import path from "path";
import type { Dirent } from "fs";
import fs from "fs/promises";
import { comparisonRunSchema } from "@/lib/types/comparison";
import { getRunsRootDir } from "./paths";

export type RunListItem = {
  id: string;
  createdAt: string;
  currentUrl: string;
  newUrl: string;
};

const listItemSchema = comparisonRunSchema.pick({
  id: true,
  createdAt: true,
  currentUrl: true,
  newUrl: true,
});

export async function listRecentRuns(limit: number): Promise<RunListItem[]> {
  const root = getRunsRootDir();
  let entries: Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const runs: RunListItem[] = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const id = e.name;
    try {
      const raw = await fs.readFile(
        path.join(root, id, "comparison.json"),
        "utf-8",
      );
      const parsed: unknown = JSON.parse(raw);
      const safe = listItemSchema.safeParse(parsed);
      if (safe.success) runs.push(safe.data);
    } catch {
      continue;
    }
  }

  runs.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return runs.slice(0, limit);
}
