import fs from "fs/promises";
import path from "path";
import { comparisonRunSchema, type ComparisonRun } from "@/lib/types/comparison";
import { getRunDir } from "./paths";

export async function loadRun(runId: string): Promise<ComparisonRun | null> {
  const file = path.join(getRunDir(runId), "comparison.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return comparisonRunSchema.parse(parsed);
  } catch {
    return null;
  }
}
