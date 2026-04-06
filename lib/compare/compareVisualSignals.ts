import type { PageData } from "@/lib/types/comparison";
import { averagePairwiseDistance } from "@/lib/extract/extractColors";

export function compareVisualSignals(
  current: PageData,
  next: PageData,
): string[] {
  const out: string[] = [];
  const cv = current.visualSignals;
  const nv = next.visualSignals;

  if (cv.heroBackgroundIsImage && !nv.heroBackgroundIsImage) {
    out.push(
      "Hero or top region used a background image on the original; the new version looks more flat or solid-colored there.",
    );
  }
  if (!cv.heroBackgroundIsImage && nv.heroBackgroundIsImage) {
    out.push(
      "New version introduces a hero background image where the original did not (or did not expose one to our heuristic).",
    );
  }

  if (cv.bodyBackgroundIsImage && !nv.bodyBackgroundIsImage) {
    out.push(
      "Body-level background imagery from the original is not detected on the new version.",
    );
  }

  const dist = averagePairwiseDistance(
    cv.sampledColors,
    nv.sampledColors,
  );
  if (dist > 55) {
    out.push(
      "Sampled brand-like colors shifted noticeably between versions (palette may have changed).",
    );
  } else if (dist > 25) {
    out.push("Minor color shifts detected in sampled UI elements.");
  }

  const curChrome = cv.headerChromeScheme;
  const nexChrome = nv.headerChromeScheme;
  if (
    curChrome !== "unclear" &&
    nexChrome !== "unclear" &&
    curChrome !== nexChrome
  ) {
    out.push(
      "Header chrome contrast pattern changed (e.g. dark bar with light nav text vs light bar with dark nav). Preserve WCAG-readable contrast; match the original bar treatment unless a deliberate rebrand.",
    );
  }

  if (nv.largeImageCountAboveFold < cv.largeImageCountAboveFold - 1) {
    out.push(
      "Fewer large images in the above-the-fold area on the new version (possible loss of imagery or slider).",
    );
  }
  if (nv.largeImageCountAboveFold > cv.largeImageCountAboveFold + 1) {
    out.push(
      "More large imagery above the fold on the new version (richer visual hero or gallery).",
    );
  }

  if (out.length === 0) {
    out.push(
      "Visual signal heuristics (background images, sampled colors, image density) are broadly similar.",
    );
  }

  return out;
}
