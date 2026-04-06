import type { PageData } from "@/lib/types/comparison";

export function hasCarouselSignals(p: PageData): boolean {
  return p.visualSignals.hasCarouselMarkers;
}
