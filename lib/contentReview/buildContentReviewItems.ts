import type { Findings } from "@/lib/types/comparison";

export type ContentReviewCategory = "text" | "structural" | "missing";

export type ContentReviewItem = {
  id: string;
  category: ContentReviewCategory;
  text: string;
};

function stableId(category: ContentReviewCategory, text: string): string {
  let h = 0;
  const s = `${category}:${text.trim()}`;
  for (let i = 0; i < s.length; i += 1) {
    h = Math.imul(31, h) + s.charCodeAt(i);
    h |= 0;
  }
  return `${category}-${(h >>> 0).toString(16)}`;
}

function pushUnique(
  out: ContentReviewItem[],
  seen: Set<string>,
  category: ContentReviewCategory,
  line: string,
): void {
  const t = line.trim();
  if (!t || t.length > 2000) return;
  const id = stableId(category, t);
  if (seen.has(id)) return;
  seen.add(id);
  out.push({ id, category, text: t });
}

/**
 * Flat list of heuristic content-related findings for review (approve / needs change).
 */
export function buildContentReviewItems(findings: Findings): ContentReviewItem[] {
  const out: ContentReviewItem[] = [];
  const seen = new Set<string>();
  for (const line of findings.text) {
    pushUnique(out, seen, "text", line);
  }
  for (const line of findings.structural) {
    pushUnique(out, seen, "structural", line);
  }
  for (const line of findings.missing) {
    pushUnique(out, seen, "missing", line);
  }
  return out;
}
