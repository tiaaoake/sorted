import type { PageData } from "@/lib/types/comparison";

export function firstHeadingOfLevel(
  p: PageData,
  level: number,
): string | undefined {
  return p.headings.find((h) => h.level === level)?.text;
}

export function headingTexts(p: PageData): string[] {
  return p.headings.map((h) => h.text);
}
