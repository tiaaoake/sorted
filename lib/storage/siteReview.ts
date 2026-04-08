import path from "path";
import fs from "fs/promises";

export type ReviewStatus = "empty" | "failed" | "passed";

export type ContentReviewDecision = "approved" | "rejected";

export type DeviceReviewEntry = {
  status: ReviewStatus;
  notes: string;
};

export type SiteReviewEntry = {
  /** Legacy aggregate status kept for backwards compatibility in list UIs. */
  status: ReviewStatus;
  /** Legacy aggregate notes kept for backwards compatibility in list UIs. */
  notes: string;
  desktopReview?: DeviceReviewEntry;
  mobileReview?: DeviceReviewEntry;
  /** Lovable-ready final reviewer text. */
  globalReviewPrompt?: string;
  /** Per content-diff line: approved vs needs change (rejected). */
  contentItemDecisions?: Record<string, ContentReviewDecision>;
  /** Per visual band (desktop/mobile): key is section index as string. */
  sectionDecisions?: {
    desktop?: Record<string, ContentReviewDecision>;
    mobile?: Record<string, ContentReviewDecision>;
  };
  /** Run id this review applies to; null when status is empty / not tied. */
  reviewedRunId: string | null;
};

export type SiteReviewMap = Record<string, SiteReviewEntry>;

function normalizeDeviceReview(raw: unknown): DeviceReviewEntry | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as Record<string, unknown>;
  const status = obj.status;
  if (status !== "empty" && status !== "failed" && status !== "passed") {
    return undefined;
  }
  const notes = typeof obj.notes === "string" ? obj.notes : "";
  return { status, notes };
}

function normalizeSiteReviewEntry(raw: unknown): SiteReviewEntry | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const obj = raw as Record<string, unknown>;
  const status = obj.status;
  if (status !== "empty" && status !== "failed" && status !== "passed") {
    return undefined;
  }
  const notes = typeof obj.notes === "string" ? obj.notes : "";
  const reviewedRunId =
    typeof obj.reviewedRunId === "string" ? obj.reviewedRunId : null;
  const desktopReview = normalizeDeviceReview(obj.desktopReview);
  const mobileReview = normalizeDeviceReview(obj.mobileReview);
  const globalReviewPrompt =
    typeof obj.globalReviewPrompt === "string" ? obj.globalReviewPrompt : undefined;
  const contentItemDecisions = normalizeContentItemDecisions(
    obj.contentItemDecisions,
  );
  const sectionDecisions = normalizeSectionDecisions(obj.sectionDecisions);
  return {
    status,
    notes,
    ...(desktopReview ? { desktopReview } : {}),
    ...(mobileReview ? { mobileReview } : {}),
    ...(globalReviewPrompt ? { globalReviewPrompt } : {}),
    ...(contentItemDecisions ? { contentItemDecisions } : {}),
    ...(sectionDecisions ? { sectionDecisions } : {}),
    reviewedRunId,
  };
}

function isDecision(v: unknown): v is ContentReviewDecision {
  return v === "approved" || v === "rejected";
}

function normalizeContentItemDecisions(
  raw: unknown,
): Record<string, ContentReviewDecision> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, ContentReviewDecision> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k !== "string" || k.length > 200) continue;
    if (isDecision(v)) out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeSectionDecisions(raw: unknown): SiteReviewEntry["sectionDecisions"] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const desktop = normalizeContentItemDecisions(o.desktop);
  const mobile = normalizeContentItemDecisions(o.mobile);
  if (!desktop && !mobile) return undefined;
  return {
    ...(desktop ? { desktop } : {}),
    ...(mobile ? { mobile } : {}),
  };
}

function siteReviewFile(): string {
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    "data",
    "site-review.json",
  );
}

export async function getSiteReviewMap(): Promise<SiteReviewMap> {
  try {
    const raw = await fs.readFile(siteReviewFile(), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: SiteReviewMap = {};
      for (const [key, value] of Object.entries(parsed)) {
        const normalized = normalizeSiteReviewEntry(value);
        if (normalized) out[key] = normalized;
      }
      return out;
    }
  } catch {
    /* missing or invalid */
  }
  return {};
}

export async function setSiteReview(
  siteKey: string,
  entry: SiteReviewEntry,
): Promise<void> {
  const map = await getSiteReviewMap();
  map[siteKey] = entry;
  const file = siteReviewFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(map, null, 2), "utf-8");
}
