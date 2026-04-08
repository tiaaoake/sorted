"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildGlobalReviewPrompt } from "@/lib/review/buildGlobalReviewPrompt";
import { getSiteLatestMap } from "@/lib/storage/siteLatest";
import {
  setSiteReview,
  type DeviceReviewEntry,
  type ReviewStatus,
  type SiteReviewEntry,
} from "@/lib/storage/siteReview";
import type { VisualDiffGuide } from "@/lib/types/comparison";
import type { ContentReviewDecision } from "@/lib/storage/siteReview";

const MAX_NOTES = 4000;

const statusSchema = z.enum(["empty", "failed", "passed"]);
const uuidSchema = z.string().uuid();

export type SaveSiteReviewResult =
  | { ok: true; entry: SiteReviewEntry }
  | { ok: false; error: string };

function parseContentItemDecisions(
  raw: unknown,
): Record<string, ContentReviewDecision> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, ContentReviewDecision> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== "string" || k.length > 200) continue;
    if (v === "approved" || v === "rejected") out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseSectionDecisions(raw: unknown):
  | {
      desktop?: Record<string, ContentReviewDecision>;
      mobile?: Record<string, ContentReviewDecision>;
    }
  | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const desktop = parseContentItemDecisions(o.desktop);
  const mobile = parseContentItemDecisions(o.mobile);
  if (!desktop && !mobile) return undefined;
  return { ...(desktop ? { desktop } : {}), ...(mobile ? { mobile } : {}) };
}

type ContentItemSnapshot = { id: string; text: string };

function parseContentItemsSnapshot(raw: unknown): ContentItemSnapshot[] {
  if (!Array.isArray(raw)) return [];
  const out: ContentItemSnapshot[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : "";
    const text = typeof r.text === "string" ? r.text : "";
    if (id && text) out.push({ id, text });
  }
  return out;
}

export async function saveSiteReview(
  siteKeyRaw: unknown,
  desktopStatusRaw: unknown,
  desktopNotesRaw: unknown,
  mobileStatusRaw: unknown,
  mobileNotesRaw: unknown,
  currentUrlRaw?: unknown,
  newUrlRaw?: unknown,
  projectLabelRaw?: unknown,
  desktopGuideRaw?: unknown,
  mobileGuideRaw?: unknown,
  globalReviewPromptRaw?: unknown,
  contentItemDecisionsRaw?: unknown,
  sectionDecisionsRaw?: unknown,
  contentItemsSnapshotRaw?: unknown,
  reviewRunIdRaw?: unknown,
): Promise<SaveSiteReviewResult> {
  const siteKey =
    typeof siteKeyRaw === "string" ? siteKeyRaw.trim() : "";
  if (!siteKey) {
    return { ok: false, error: "Invalid site key" };
  }

  const desktopStatusParsed = statusSchema.safeParse(desktopStatusRaw);
  const mobileStatusParsed = statusSchema.safeParse(mobileStatusRaw);
  if (!desktopStatusParsed.success || !mobileStatusParsed.success) {
    return { ok: false, error: "Invalid review status" };
  }
  const desktopReview: DeviceReviewEntry = {
    status: desktopStatusParsed.data,
    notes:
      typeof desktopNotesRaw === "string"
        ? desktopNotesRaw.trim().slice(0, MAX_NOTES)
        : "",
  };
  const mobileReview: DeviceReviewEntry = {
    status: mobileStatusParsed.data,
    notes:
      typeof mobileNotesRaw === "string"
        ? mobileNotesRaw.trim().slice(0, MAX_NOTES)
        : "",
  };

  const reviewRunIdTrimmed =
    typeof reviewRunIdRaw === "string" ? reviewRunIdRaw.trim() : "";
  const reviewRunIdParsed = reviewRunIdTrimmed
    ? uuidSchema.safeParse(reviewRunIdTrimmed)
    : null;
  const reviewRunId =
    reviewRunIdParsed?.success === true ? reviewRunIdParsed.data : undefined;

  const latestMap = await getSiteLatestMap();
  const latest = latestMap[siteKey];

  const isFullyEmpty =
    desktopReview.status === "empty" && mobileReview.status === "empty";
  if (isFullyEmpty) {
    const entry: SiteReviewEntry = {
      status: "empty",
      notes: "",
      desktopReview,
      mobileReview,
      globalReviewPrompt: "",
      contentItemDecisions: {},
      sectionDecisions: {},
      reviewedRunId: null,
    };
    await setSiteReview(siteKey, entry);
    revalidatePath("/");
    if (reviewRunId) {
      revalidatePath(`/review/${reviewRunId}`);
    }
    return { ok: true, entry };
  }

  const reviewedRunId = reviewRunId ?? latest?.runId;
  if (!reviewedRunId) {
    return {
      ok: false,
      error: "Run Compare first — no capture for this row yet.",
    };
  }

  const currentUrl =
    typeof currentUrlRaw === "string" ? currentUrlRaw.trim() : "";
  const newUrl = typeof newUrlRaw === "string" ? newUrlRaw.trim() : "";
  const projectLabel =
    typeof projectLabelRaw === "string" ? projectLabelRaw.trim() : undefined;
  const desktopGuide =
    desktopGuideRaw && typeof desktopGuideRaw === "object"
      ? (desktopGuideRaw as VisualDiffGuide)
      : undefined;
  const mobileGuide =
    mobileGuideRaw && typeof mobileGuideRaw === "object"
      ? (mobileGuideRaw as VisualDiffGuide)
      : undefined;
  const aggregateStatus: ReviewStatus =
    desktopReview.status === "failed" || mobileReview.status === "failed"
      ? "failed"
      : desktopReview.status === "passed" && mobileReview.status === "passed"
        ? "passed"
        : "empty";
  const aggregateNotes = [desktopReview.notes.trim(), mobileReview.notes.trim()]
    .filter(Boolean)
    .join("\n\n");
  const userGlobalPrompt =
    typeof globalReviewPromptRaw === "string"
      ? globalReviewPromptRaw.trim().slice(0, MAX_NOTES * 3)
      : "";

  const contentItemDecisions = parseContentItemDecisions(contentItemDecisionsRaw) ?? {};
  const sectionDecisions = parseSectionDecisions(sectionDecisionsRaw);
  const contentItemsSnapshot = parseContentItemsSnapshot(contentItemsSnapshotRaw);
  const rejectedContentLines = contentItemsSnapshot
    .filter((row) => contentItemDecisions[row.id] === "rejected")
    .map((row) => row.text);
  const rejectedDesktopBandKeys = new Set(
    Object.entries(sectionDecisions?.desktop ?? {})
      .filter(([, v]) => v === "rejected")
      .map(([k]) => k),
  );
  const rejectedMobileBandKeys = new Set(
    Object.entries(sectionDecisions?.mobile ?? {})
      .filter(([, v]) => v === "rejected")
      .map(([k]) => k),
  );

  const computedGlobalPrompt =
    currentUrl && newUrl
      ? buildGlobalReviewPrompt({
          projectLabel,
          currentUrl,
          newUrl,
          desktopReview,
          mobileReview,
          desktopGuide,
          mobileGuide,
          rejectedContentLines,
          rejectedDesktopBandKeys,
          rejectedMobileBandKeys,
        })
      : "";

  const entry: SiteReviewEntry = {
    status: aggregateStatus,
    notes: aggregateNotes,
    desktopReview,
    mobileReview,
    globalReviewPrompt: userGlobalPrompt || computedGlobalPrompt,
    contentItemDecisions,
    ...(sectionDecisions ? { sectionDecisions } : {}),
    reviewedRunId,
  };
  await setSiteReview(siteKey, entry);
  revalidatePath("/");
  revalidatePath(`/review/${reviewedRunId}`);
  return { ok: true, entry };
}
