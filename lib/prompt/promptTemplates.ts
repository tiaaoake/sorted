import type { Findings, PageData } from "@/lib/types/comparison";
import { navMenuSignalStrength } from "@/lib/extract/extractNav";

function pickLines(lines: string[], max: number): string[] {
  return lines
    .filter((l) => l && !/similar between versions|No major automated|broadly similar/i.test(l))
    .slice(0, max);
}

/**
 * Deterministic paragraph when no LLM is configured or on failure.
 */
export function templatePrompt(findings: Findings, current: PageData): string {
  const preserve: string[] = [];
  if (current.visualSignals.sampledColors.length) {
    const list = current.visualSignals.sampledColors.join(", ");
    preserve.push(`brand colour anchors from the capture (${list})`);
  }
  if (current.navLinks.length)
    preserve.push("navigation labels and key links from the original");
  if (navMenuSignalStrength(current) >= 1)
    preserve.push(
      "dropdown or multi-level navigation (submenus, flyouts, or mega-menus) if the original used them",
    );
  if (current.visualSignals.heroBackgroundIsImage || current.visualSignals.bodyBackgroundIsImage)
    preserve.push("hero or body background imagery where the original used it");
  if (current.visualSignals.hasCarouselMarkers)
    preserve.push("slider/carousel behaviour if it existed on the original");
  if (current.visualSignals.headerChromeScheme === "dark_bar_light_text") {
    preserve.push(
      "header bar contrast: dark background with light navigation text (and equivalent contrast for CTAs in the bar)",
    );
  } else if (current.visualSignals.headerChromeScheme === "light_bar_dark_text") {
    preserve.push(
      "header bar contrast: light background with dark navigation text (and equivalent contrast for CTAs in the bar)",
    );
  }
  const preserveStr =
    preserve.length > 0
      ? preserve.join(", ")
      : "logo placement, hierarchy, and trust copy from the original";

  const restore = pickLines(
    [...findings.missing, ...findings.text, ...findings.structural],
    5,
  );
  const keepNew = pickLines(findings.improved, 3);

  const restoreStr =
    restore.length > 0
      ? restore.join(" ")
      : "Restore any trust signals, local references, and service-specific copy that appear weaker on the new version.";

  const keepStr =
    keepNew.length > 0
      ? ` Keep these positives from the new version: ${keepNew.join(" ")}`
      : "";

  const colourStr =
    current.visualSignals.sampledColors.length > 0
      ? `Colour: treat the sampled values above as exact anchors; match neutrals, borders, hover states, and gradients to the original site at ${current.url}. `
      : `Colour: match the full palette to the original site at ${current.url}. `;

  return (
    `Preserve ${preserveStr}. ${colourStr}${restoreStr}` +
    keepStr +
    " Strengthen CTA prominence if it regressed. Keep desktop and mobile visually consistent with the original brand fidelity."
  );
}
