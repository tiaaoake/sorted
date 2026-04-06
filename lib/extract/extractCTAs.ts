import type { PageData } from "@/lib/types/comparison";

export function ctaButtonLabels(p: PageData): string[] {
  return p.buttonsAndLinks
    .map((b) => b.text)
    .filter((t) => t.length > 0 && t.length < 80);
}
