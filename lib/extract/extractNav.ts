import type { PageData } from "@/lib/types/comparison";

export function navHrefSet(p: PageData): Set<string> {
  return new Set(p.navLinks.map((l) => l.href));
}

export function navTexts(p: PageData): string[] {
  return p.navLinks.map((l) => l.text);
}

/** Sum of nested-list parents, flyout triggers, and disclosure menus in nav/header. */
export function navMenuSignalStrength(p: PageData): number {
  const s = p.navMenuSignals;
  return s.submenuParentCount + s.flyoutOrMenuTriggerCount + s.detailsMenuCount;
}
