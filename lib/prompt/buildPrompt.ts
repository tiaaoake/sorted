import type { Findings, PageData } from "@/lib/types/comparison";

export function buildLlmUserBrief(
  findings: Findings,
  current: PageData,
  next: PageData,
): string {
  const parts: string[] = [];
  parts.push(`Original URL: ${current.url}`);
  parts.push(`New URL: ${next.url}`);
  parts.push(`Original title: ${current.title}`);
  parts.push(`New title: ${next.title}`);
  parts.push("");
  parts.push("Colour guidance for the builder:");
  if (current.visualSignals.sampledColors.length > 0) {
    parts.push(
      `- Sampled swatches from the original (use as exact anchors): ${current.visualSignals.sampledColors.join(", ")}`,
    );
    parts.push(
      `- Match the broader colour system (neutrals, borders, hover states, gradients) to the original URL above — reference that live site, not approximations.`,
    );
  } else {
    parts.push(
      `- No swatches were sampled in this capture; derive the full palette by referencing the original URL.`,
    );
  }
  const chromeLabel: Record<string, string> = {
    dark_bar_light_text: "dark header bar with light nav text",
    light_bar_dark_text: "light header bar with dark nav text",
    unclear: "not determined (e.g. transparent header or ambiguous colours)",
  };
  parts.push(
    `- Original header/nav contrast pattern (heuristic): ${chromeLabel[current.visualSignals.headerChromeScheme] ?? current.visualSignals.headerChromeScheme}.`,
  );
  parts.push("");
  parts.push("Summary bullets:");
  findings.summary.forEach((s) => parts.push(`- ${s}`));
  parts.push("");
  parts.push("Text findings:");
  findings.text.slice(0, 12).forEach((s) => parts.push(`- ${s}`));
  parts.push("");
  parts.push("Structural findings:");
  findings.structural.slice(0, 10).forEach((s) => parts.push(`- ${s}`));
  parts.push("");
  parts.push("Visual signal findings:");
  findings.visual.slice(0, 10).forEach((s) => parts.push(`- ${s}`));
  parts.push("");
  parts.push("Missing / risk:");
  findings.missing.slice(0, 8).forEach((s) => parts.push(`- ${s}`));
  parts.push("");
  parts.push("What improved:");
  findings.improved.slice(0, 6).forEach((s) => parts.push(`- ${s}`));
  return parts.join("\n");
}
