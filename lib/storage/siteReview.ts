import path from "path";
import fs from "fs/promises";

export type ReviewStatus = "empty" | "failed" | "passed";

export type SiteReviewEntry = {
  status: ReviewStatus;
  notes: string;
  /** Run id this review applies to; null when status is empty / not tied. */
  reviewedRunId: string | null;
};

export type SiteReviewMap = Record<string, SiteReviewEntry>;

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
      return parsed as SiteReviewMap;
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
