import { EXAMPLE_SITE_PAIRS } from "@/lib/data/exampleSites";
import type { SiteLatestMap } from "@/lib/storage/siteLatest";

function normalizeForMatch(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    u.pathname = path || "/";
    return u.href;
  } catch {
    return url.trim();
  }
}

/** Match run.currentUrl to a Projects row when `siteKey` was not persisted on the run. */
export function inferExampleSiteIdFromCurrentUrl(
  currentUrl: string,
): string | undefined {
  const n = normalizeForMatch(currentUrl);
  for (const p of EXAMPLE_SITE_PAIRS) {
    if (normalizeForMatch(p.currentUrl) === n) return p.id;
  }
  return undefined;
}

/**
 * Key for `site-review.json`: persisted Projects `siteKey`, inferred row id, or
 * this run's id for ad-hoc / custom URL compares.
 */
export function reviewStorageKeyForRun(run: {
  siteKey?: string;
  currentUrl: string;
  id: string;
}): string {
  const k = run.siteKey?.trim();
  if (k) return k;
  return inferExampleSiteIdFromCurrentUrl(run.currentUrl) ?? run.id;
}

/** Latest capture id for stale UI; run-scoped compares use this run only. */
export function siteLatestRunIdForReviewSidebar(
  storageKey: string,
  runId: string,
  siteLatestMap: SiteLatestMap,
): string | undefined {
  if (storageKey === runId) return runId;
  return siteLatestMap[storageKey]?.runId;
}
