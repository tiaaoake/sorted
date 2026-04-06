import path from "path";
import fs from "fs/promises";

export function getRunsRootDir(): string {
  return path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "public",
    "data",
    "runs",
  );
}

export function getRunDir(runId: string): string {
  return path.join(getRunsRootDir(), runId);
}

export async function ensureRunDir(runId: string): Promise<string> {
  const dir = getRunDir(runId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function publicPathForScreenshot(
  runId: string,
  filename: string,
): string {
  return `/data/runs/${runId}/${filename}`;
}
