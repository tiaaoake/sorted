import type { PageData } from "@/lib/types/comparison";
import { hasCarouselSignals } from "@/lib/extract/detectSlider";
import { navMenuSignalStrength } from "@/lib/extract/extractNav";

export function compareStructure(
  current: PageData,
  next: PageData,
): string[] {
  const out: string[] = [];
  const cs = current.sectionOutline;
  const ns = next.sectionOutline;

  const curNavMenu = navMenuSignalStrength(current);
  const nexNavMenu = navMenuSignalStrength(next);
  if (curNavMenu >= 1 && nexNavMenu === 0) {
    out.push(
      "Navigation dropdown or multi-level patterns were detected on the original (nested menu lists, flyout triggers, or disclosure menus) but not on the new version — confirm submenus/mega-menus match the original UX.",
    );
  } else if (curNavMenu >= 2 && nexNavMenu >= 1 && nexNavMenu < curNavMenu - 1) {
    out.push(
      "Fewer navigation dropdown / submenu signals on the new version than on the original — verify all nested items are still reachable.",
    );
  } else if (curNavMenu === 0 && nexNavMenu >= 1) {
    out.push(
      "New version shows navigation dropdown or submenu patterns not detected on the original (may be an intentional upgrade).",
    );
  }

  if (ns.sectionCount < cs.sectionCount - 1) {
    out.push(
      `Fewer \`<section>\` blocks on the new page (${ns.sectionCount} vs ${cs.sectionCount}); content may have been consolidated or removed.`,
    );
  }
  if (ns.mainChildCount < cs.mainChildCount - 2) {
    out.push(
      "Main content has fewer top-level blocks; layout may have been simplified or sections removed.",
    );
  }
  if (cs.hasNavLandmark && !ns.hasNavLandmark) {
    out.push(
      "Navigation landmark (\`<nav>\`) not detected on the new version (nav may be refactored or embedded differently).",
    );
  }
  if (cs.hasMainLandmark && !ns.hasMainLandmark) {
    out.push(
      "Main landmark (\`<main>\`) not detected on the new version (structure may rely on generic containers).",
    );
  }

  const curCar = hasCarouselSignals(current);
  const nexCar = hasCarouselSignals(next);
  if (curCar && !nexCar) {
    out.push(
      "Carousel / slider markers present on the original were not detected on the new version (slider may be removed or rebuilt).",
    );
  }
  if (!curCar && nexCar) {
    out.push(
      "New version shows carousel/slider-style markers not seen on the original.",
    );
  }

  const ctaDrop = next.buttonsAndLinks.length < current.buttonsAndLinks.length - 3;
  if (ctaDrop) {
    out.push(
      "Fewer visible buttons/links detected on the new page; CTA blocks may have been removed.",
    );
  }

  if (out.length === 0) {
    out.push(
      "Structural outline (sections, landmarks, CTA count) looks broadly similar between versions.",
    );
  }

  return out;
}
