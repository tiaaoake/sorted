import type { VisualDiffGuide } from "@/lib/types/comparison";
import type { DeviceReviewEntry } from "@/lib/storage/siteReview";

function rejectedBandLines(
  guide: VisualDiffGuide | undefined,
  rejectedKeys: Set<string>,
): string[] {
  if (!guide) return [];
  return guide.sections
    .filter((s) => rejectedKeys.has(String(s.sectionIndex)))
    .map((s) => {
      const from = Math.round(s.startYRatio * 100);
      const to = Math.round(s.endYRatio * 100);
      return `Band ${s.sectionIndex + 1} (${from}%–${to}% of page height): ${s.severity} pixel difference — needs visual follow-up`;
    });
}

export function buildGlobalReviewPrompt(input: {
  projectLabel?: string;
  currentUrl: string;
  newUrl: string;
  desktopReview: DeviceReviewEntry;
  mobileReview: DeviceReviewEntry;
  desktopGuide?: VisualDiffGuide;
  mobileGuide?: VisualDiffGuide;
  /** Content diff lines marked "Needs change". */
  rejectedContentLines: string[];
  /** Section indices (as strings) rejected for desktop/mobile snapshot bands. */
  rejectedDesktopBandKeys?: Set<string>;
  rejectedMobileBandKeys?: Set<string>;
}): string {
  const desktopNotes = input.desktopReview.notes.trim() || "No extra desktop notes.";
  const mobileNotes = input.mobileReview.notes.trim() || "No extra mobile notes.";
  const desktopBands = rejectedBandLines(
    input.desktopGuide,
    input.rejectedDesktopBandKeys ?? new Set(),
  );
  const mobileBands = rejectedBandLines(
    input.mobileGuide,
    input.rejectedMobileBandKeys ?? new Set(),
  );

  const contentBlock =
    input.rejectedContentLines.length > 0
      ? input.rejectedContentLines.map((line) => `- ${line}`)
      : ["- (No automated content lines flagged as needing change.)"];

  return [
    `Context`,
    `- Project: ${input.projectLabel ?? "N/A"}`,
    `- Current URL: ${input.currentUrl}`,
    `- New URL: ${input.newUrl}`,
    `- Devices reviewed: desktop + mobile`,
    ``,
    `Content and copy — needs change (from review)`,
    ...contentBlock,
    ``,
    `Desktop — reviewer notes`,
    `- Status: ${input.desktopReview.status}`,
    `- Notes: ${desktopNotes}`,
    ...(desktopBands.length
      ? ["", `Desktop — snapshot bands flagged for follow-up`, ...desktopBands.map((l) => `- ${l}`)]
      : []),
    ``,
    `Mobile — reviewer notes`,
    `- Status: ${input.mobileReview.status}`,
    `- Notes: ${mobileNotes}`,
    ...(mobileBands.length
      ? ["", `Mobile — snapshot bands flagged for follow-up`, ...mobileBands.map((l) => `- ${l}`)]
      : []),
    ``,
    `Non-negotiables`,
    `- Preserve key brand cues and hierarchy from the current site unless a note above asks otherwise.`,
    `- Address every item under "Content and copy — needs change" unless explicitly superseded by notes.`,
    ``,
    `Acceptance checks`,
    `- Requested content and layout fixes are implemented on both desktop and mobile where applicable.`,
    `- No regressions versus the agreed baseline for approved items.`,
  ].join("\n");
}
