import path from "path";
import fs from "fs/promises";
import { computePassScore } from "@/lib/compare/computePassScore";
import { loadRun } from "@/lib/storage/loadRun";

export type SiteLatestEntry = {
  runId: string;
  updatedAt: string;
  currentUrl: string;
  newUrl: string;
  /** Filled when enriched from the run’s `comparison.json` (heuristic pass score). */
  score?: number;
};

export type SiteLatestMap = Record<string, SiteLatestEntry>;

function siteLatestFile(): string {
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    "data",
    "site-latest.json",
  );
}

export async function getSiteLatestMap(): Promise<SiteLatestMap> {
  try {
    const raw = await fs.readFile(siteLatestFile(), "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as SiteLatestMap;
    }
  } catch {
    /* missing or invalid */
  }
  return {};
}

/** Same as `getSiteLatestMap` but attaches `score` from each run’s findings when available. */
export async function getSiteLatestMapWithScores(): Promise<SiteLatestMap> {
  const map = await getSiteLatestMap();
  const keys = Object.keys(map);
  if (keys.length === 0) return map;

  const enriched = await Promise.all(
    keys.map(async (key) => {
      const entry = map[key];
      const run = await loadRun(entry.runId);
      const score = run ? computePassScore(run.findings).score : undefined;
      return [key, { ...entry, score }] as const;
    }),
  );

  return Object.fromEntries(enriched);
}

export async function setSiteLatest(
  siteKey: string,
  entry: Omit<SiteLatestEntry, "updatedAt"> & { updatedAt?: string },
): Promise<void> {
  const map = await getSiteLatestMap();
  map[siteKey] = {
    runId: entry.runId,
    currentUrl: entry.currentUrl,
    newUrl: entry.newUrl,
    updatedAt: entry.updatedAt ?? new Date().toISOString(),
  };
  const file = siteLatestFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(map, null, 2), "utf-8");
}
