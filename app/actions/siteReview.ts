"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSiteLatestMap } from "@/lib/storage/siteLatest";
import {
  setSiteReview,
  type ReviewStatus,
  type SiteReviewEntry,
} from "@/lib/storage/siteReview";

const MAX_NOTES = 4000;

const statusSchema = z.enum(["empty", "failed", "passed"]);
const uuidSchema = z.string().uuid();

export type SaveSiteReviewResult =
  | { ok: true; entry: SiteReviewEntry }
  | { ok: false; error: string };

export async function saveSiteReview(
  siteKeyRaw: unknown,
  statusRaw: unknown,
  notesRaw: unknown,
  reviewRunIdRaw?: unknown,
): Promise<SaveSiteReviewResult> {
  const siteKey =
    typeof siteKeyRaw === "string" ? siteKeyRaw.trim() : "";
  if (!siteKey) {
    return { ok: false, error: "Invalid site key" };
  }

  const statusParsed = statusSchema.safeParse(statusRaw);
  if (!statusParsed.success) {
    return { ok: false, error: "Invalid status" };
  }
  const status: ReviewStatus = statusParsed.data;

  const notes =
    typeof notesRaw === "string" ? notesRaw.trim().slice(0, MAX_NOTES) : "";

  const reviewRunIdTrimmed =
    typeof reviewRunIdRaw === "string" ? reviewRunIdRaw.trim() : "";
  const reviewRunIdParsed = reviewRunIdTrimmed
    ? uuidSchema.safeParse(reviewRunIdTrimmed)
    : null;
  const reviewRunId =
    reviewRunIdParsed?.success === true ? reviewRunIdParsed.data : undefined;

  const latestMap = await getSiteLatestMap();
  const latest = latestMap[siteKey];

  if (status === "empty") {
    const entry: SiteReviewEntry = {
      status: "empty",
      notes: "",
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

  const entry: SiteReviewEntry = {
    status,
    notes,
    reviewedRunId,
  };
  await setSiteReview(siteKey, entry);
  revalidatePath("/");
  revalidatePath(`/review/${reviewedRunId}`);
  return { ok: true, entry };
}
