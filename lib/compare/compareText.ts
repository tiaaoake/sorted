import type { PageData } from "@/lib/types/comparison";
import { navHrefSet } from "@/lib/extract/extractNav";
import { firstHeadingOfLevel } from "@/lib/extract/extractHeadings";
import { ctaButtonLabels } from "@/lib/extract/extractCTAs";

function properNounishCount(s: string): number {
  return (s.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []).length;
}

export function compareText(current: PageData, next: PageData): string[] {
  const out: string[] = [];

  if (current.title !== next.title) {
    out.push(
      `Page title changed from "${current.title.slice(0, 80)}${current.title.length > 80 ? "…" : ""}" to "${next.title.slice(0, 80)}${next.title.length > 80 ? "…" : ""}".`,
    );
  }

  const curNav = navHrefSet(current);
  const nexNav = navHrefSet(next);
  for (const link of current.navLinks) {
    if (!nexNav.has(link.href)) {
      out.push(`Navigation item removed: "${link.text}".`);
    }
  }
  for (const link of next.navLinks) {
    if (!curNav.has(link.href)) {
      out.push(`Navigation item added: "${link.text}".`);
    }
  }

  const h1c = firstHeadingOfLevel(current, 1);
  const h1n = firstHeadingOfLevel(next, 1);
  if (h1c && h1n && h1c !== h1n) {
    const lost = properNounishCount(h1c) - properNounishCount(h1n);
    if (h1n.length < h1c.length * 0.6) {
      out.push(
        "Hero headline appears shorter or more generic than the original (possible loss of specificity).",
      );
    } else if (lost >= 2) {
      out.push(
        "Hero headline may have lost specific naming or local references compared to the original.",
      );
    } else {
      out.push("Primary (H1) headline text changed between versions.");
    }
  } else if (h1c && !h1n) {
    out.push("Visible H1 headline present on the original may be missing or hidden on the new version.");
  }

  const heroC = current.heroCandidates.headline;
  const heroN = next.heroCandidates.headline;
  if (heroC && heroN && heroC !== heroN) {
    out.push("Detected hero headline differs between versions.");
  }

  const curCtas = new Set(ctaButtonLabels(current).map((t) => t.toLowerCase()));
  const nexCtas = new Set(ctaButtonLabels(next).map((t) => t.toLowerCase()));
  for (const t of curCtas) {
    if (!nexCtas.has(t)) {
      const orig = ctaButtonLabels(current).find(
        (x) => x.toLowerCase() === t,
      );
      if (orig) out.push(`CTA or button label removed or changed: "${orig}".`);
    }
  }

  const fc = current.footerSnippet.length;
  const fn = next.footerSnippet.length;
  if (fc > 120 && fn < fc * 0.4) {
    out.push(
      "Footer visible text is substantially shorter on the new version (links, trust copy, or contact details may be reduced).",
    );
  }

  const curTrust =
    /\b(license|insured|BBB|years?\s+in\s+business|local|family[- ]owned)\b/i.test(
      current.visibleTextSample,
    );
  const nexTrust =
    /\b(license|insured|BBB|years?\s+in\s+business|local|family[- ]owned)\b/i.test(
      next.visibleTextSample,
    );
  if (curTrust && !nexTrust) {
    out.push(
      "Trust-related wording (e.g. licensing, local, experience) appears weaker or absent in the new page text sample.",
    );
  }

  const metaDrop =
    current.metaDescription.length > 40 && next.metaDescription.length < 20;
  if (metaDrop) {
    out.push("Meta description is much shorter or missing on the new version.");
  }

  if (out.length === 0) {
    out.push(
      "No major automated text differences were detected in titles, nav, H1, CTAs, or footer heuristics.",
    );
  }

  return out;
}
