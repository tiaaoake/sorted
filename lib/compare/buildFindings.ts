import type { Findings, PageData } from "@/lib/types/comparison";
import { navMenuSignalStrength } from "@/lib/extract/extractNav";
import { compareText } from "./compareText";
import { compareStructure } from "./compareStructure";
import { compareVisualSignals } from "./compareVisualSignals";

function takeSummary(
  text: string[],
  structural: string[],
  visual: string[],
  limit = 4,
): string[] {
  const merged = [...text.slice(0, 2), ...structural.slice(0, 1), ...visual.slice(0, 1)];
  return merged.slice(0, limit);
}

function missingElements(
  current: PageData,
  next: PageData,
  structural: string[],
  text: string[],
): string[] {
  const miss: string[] = [];
  for (const line of structural) {
    if (
      /removed|fewer|not detected|missing|shorter/i.test(line) &&
      !/similar/i.test(line)
    ) {
      miss.push(line);
    }
  }
  for (const line of text) {
    if (/removed|missing|absent|weaker|shorter/i.test(line)) miss.push(line);
  }
  if (
    current.visualSignals.hasCarouselMarkers &&
    !next.visualSignals.hasCarouselMarkers
  ) {
    miss.push("Carousel/slider behaviour or markup may be missing on the new site.");
  }
  if (miss.length === 0) {
    miss.push("No strong automated signals of dropped sections (heuristic).");
  }
  return miss.slice(0, 8);
}

function improvedItems(
  current: PageData,
  next: PageData,
  visual: string[],
): string[] {
  const imp: string[] = [];

  if (next.sectionOutline.sectionCount < current.sectionOutline.sectionCount) {
    imp.push("Layout may be cleaner with fewer distinct section wrappers.");
  }
  if (next.heroCandidates.headline && next.heroCandidates.subheadline) {
    imp.push("Hero area exposes both headline and supporting subcopy on the new version.");
  }
  for (const line of visual) {
    if (/More large imagery|introduces a hero background/i.test(line)) {
      imp.push(line);
    }
  }
  if (
    next.visibleTextSample.length > current.visibleTextSample.length * 1.15
  ) {
    imp.push("Visible text sample is longer on the new page (more copy surfaced to users).");
  }

  const originalHadDropdownNav = navMenuSignalStrength(current) >= 1;
  const simplerNav =
    !originalHadDropdownNav &&
    next.navLinks.length > 0 &&
    next.navLinks.length < current.navLinks.length - 1;
  if (simplerNav) {
    imp.push("Navigation list is shorter — may reduce cognitive load (verify nothing important was cut).");
  }

  if (imp.length === 0) {
    imp.push(
      "No strong automated signals of improvement; review screenshots for spacing, typography, and CTA prominence.",
    );
  }
  return imp.slice(0, 8);
}

export function buildFindings(
  current: PageData,
  next: PageData,
): Findings {
  const text = compareText(current, next);
  const structural = compareStructure(current, next);
  const visual = compareVisualSignals(current, next);

  const summary = takeSummary(text, structural, visual, 5);
  const missing = missingElements(current, next, structural, text);
  const improved = improvedItems(current, next, visual);

  return {
    summary,
    visual,
    text,
    structural,
    missing,
    improved,
    rawNotes: [],
  };
}
