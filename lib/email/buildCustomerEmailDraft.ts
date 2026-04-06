import type { ComparisonRun, Findings } from "@/lib/types/comparison";

/** Use these exact strings in the editable draft so they match sidebar copy hints. */
export const EMAIL_IMAGE_PLACEHOLDERS = {
  mobileBefore: "<<< PASTE IMAGE: Mobile — before (current site) >>>",
  mobileAfter: "<<< PASTE IMAGE: Mobile — after (new site) >>>",
  desktopBefore: "<<< PASTE IMAGE: Desktop — before (current site) >>>",
  desktopAfter: "<<< PASTE IMAGE: Desktop — after (new site) >>>",
} as const;

const FALLBACK_BENEFITS = [
  "Layout and typography tuned for readability and a more professional first impression.",
  "The new experience is optimized for phones first — where most people discover local services.",
  "Clear navigation and calls-to-action so visitors can find what they need quickly.",
  "Updated visuals and structure aligned with how people browse the web today.",
  "A solid foundation for future content and marketing updates.",
] as const;

function pickTopBenefits(findings: Findings, max = 5): string[] {
  const ordered = [...findings.improved, ...findings.summary]
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of ordered) {
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
    if (out.length >= max) return out;
  }
  for (const f of FALLBACK_BENEFITS) {
    if (out.length >= max) break;
    if (!seen.has(f)) {
      seen.add(f);
      out.push(f);
    }
  }
  while (out.length < max) {
    const pad = `Enhancement ${out.length + 1}: Polished details across the new experience.`;
    if (!seen.has(pad)) {
      seen.add(pad);
      out.push(pad);
    } else break;
  }
  return out.slice(0, max);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type CustomerEmailDraft = {
  subject: string;
  plainBody: string;
  /** Present only when `baseOrigin` was passed (absolute image URLs). */
  htmlBody: string | null;
};

/**
 * Builds a customer-facing email draft: before/after framing (mobile first),
 * placeholders for pasted screenshots, new site link, and top benefits.
 */
export function buildCustomerEmailDraft(
  run: ComparisonRun,
  options?: { baseOrigin?: string | null },
): CustomerEmailDraft {
  const benefits = pickTopBenefits(run.findings, 5);
  const newUrl = run.newUrl.trim();
  const title = run.newPageData.title?.trim();

  const subject = title
    ? `Your new site is ready — ${title} (mobile-first refresh)`
    : "Your new website is ready — mobile-first refresh";

  const intro = title
    ? `We're excited to share your refreshed ${title} site. Below is a before-and-after look — we prioritized how the site feels on phones, since that's where most customers first see you.`
    : `We're excited to share your refreshed website. Below is a before-and-after look — we prioritized how the site feels on phones, since that's where most customers first see you.`;

  const { mobileBefore, mobileAfter, desktopBefore, desktopAfter } =
    EMAIL_IMAGE_PLACEHOLDERS;

  const plainLines: string[] = [
    "Hi [Name],",
    "",
    intro,
    "",
    "— Mobile (before → after) —",
    "Your current live site on a phone:",
    mobileBefore,
    "",
    "The new design on a phone:",
    mobileAfter,
    "",
    "— Desktop (before → after) —",
    "Your current site on a larger screen:",
    desktopBefore,
    "",
    "The new design on desktop:",
    desktopAfter,
    "",
    `New live preview: ${newUrl}`,
    "",
    "What this update helps with:",
    ...benefits.map((b, i) => `${i + 1}. ${b}`),
    "",
    "If you'd like any tweaks before go-live, just reply to this email.",
    "",
    "Best,",
    "[Your name]",
  ];

  const plainBody = plainLines.join("\n");

  const base = options?.baseOrigin?.replace(/\/$/, "") ?? "";
  let htmlBody: string | null = null;
  if (base) {
    const mCur = `${base}${run.screenshots.currentMobile}`;
    const mNew = `${base}${run.screenshots.newMobile}`;
    const dCur = `${base}${run.screenshots.currentDesktop}`;
    const dNew = `${base}${run.screenshots.newDesktop}`;
    const listItems = benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
    htmlBody = [
      "<p>Hi [Name],</p>",
      `<p>${escapeHtml(intro)}</p>`,
      "<p><strong>Mobile — before (current)</strong></p>",
      `<p><img src="${escapeHtml(mCur)}" alt="Before mobile" width="320" style="max-width:100%;height:auto;border:1px solid #e5e5e5;border-radius:8px;" /></p>`,
      "<p><strong>Mobile — after (new)</strong></p>",
      `<p><img src="${escapeHtml(mNew)}" alt="After mobile" width="320" style="max-width:100%;height:auto;border:1px solid #e5e5e5;border-radius:8px;" /></p>`,
      "<p><strong>Desktop — before</strong></p>",
      `<p><img src="${escapeHtml(dCur)}" alt="Before desktop" width="600" style="max-width:100%;height:auto;border:1px solid #e5e5e5;border-radius:8px;" /></p>`,
      "<p><strong>Desktop — after</strong></p>",
      `<p><img src="${escapeHtml(dNew)}" alt="After desktop" width="600" style="max-width:100%;height:auto;border:1px solid #e5e5e5;border-radius:8px;" /></p>`,
      `<p><strong>New site:</strong> <a href="${escapeHtml(newUrl)}">${escapeHtml(newUrl)}</a></p>`,
      "<p><strong>What this update helps with:</strong></p>",
      `<ol>${listItems}</ol>`,
      "<p>If you'd like any tweaks before go-live, just reply to this email.</p>",
      "<p>Best,<br />[Your name]</p>",
    ].join("\n");
  }

  return { subject, plainBody, htmlBody };
}

export function plainTextForClipboard(subject: string, plainBody: string): string {
  return `${subject}\n\n${plainBody}`;
}
