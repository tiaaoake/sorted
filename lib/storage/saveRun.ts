import fs from "fs/promises";
import path from "path";
import type { ComparisonRun } from "@/lib/types/comparison";
import { ensureRunDir, publicPathForScreenshot } from "./paths";

const SCREENSHOT_FILES = {
  currentDesktop: "current-desktop.png",
  newDesktop: "new-desktop.png",
  currentMobile: "current-mobile.png",
  newMobile: "new-mobile.png",
} as const;

export type ScreenshotBuffers = {
  currentDesktop: Buffer;
  newDesktop: Buffer;
  currentMobile: Buffer;
  newMobile: Buffer;
};

export async function saveRun(
  run: Omit<ComparisonRun, "screenshots">,
  buffers: ScreenshotBuffers,
): Promise<ComparisonRun> {
  const dir = await ensureRunDir(run.id);

  const writes: Promise<void>[] = [
    fs.writeFile(path.join(dir, SCREENSHOT_FILES.currentDesktop), buffers.currentDesktop),
    fs.writeFile(path.join(dir, SCREENSHOT_FILES.newDesktop), buffers.newDesktop),
    fs.writeFile(path.join(dir, SCREENSHOT_FILES.currentMobile), buffers.currentMobile),
    fs.writeFile(path.join(dir, SCREENSHOT_FILES.newMobile), buffers.newMobile),
  ];
  await Promise.all(writes);

  const full: ComparisonRun = {
    ...run,
    screenshots: {
      currentDesktop: publicPathForScreenshot(run.id, SCREENSHOT_FILES.currentDesktop),
      newDesktop: publicPathForScreenshot(run.id, SCREENSHOT_FILES.newDesktop),
      currentMobile: publicPathForScreenshot(run.id, SCREENSHOT_FILES.currentMobile),
      newMobile: publicPathForScreenshot(run.id, SCREENSHOT_FILES.newMobile),
    },
  };

  await fs.writeFile(
    path.join(dir, "comparison.json"),
    JSON.stringify(full, null, 2),
    "utf-8",
  );

  return full;
}
