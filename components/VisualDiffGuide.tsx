"use client";

import type { VisualDiffGuide } from "@/lib/types/comparison";
import type { ContentReviewDecision } from "@/lib/storage/siteReview";

function severityClass(severity: "low" | "medium" | "high"): string {
  if (severity === "high") {
    return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200";
  }
  if (severity === "medium") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
}

function severityLabel(severity: "low" | "medium" | "high"): string {
  if (severity === "high") return "High visual change";
  if (severity === "medium") return "Med visual change";
  return "Low visual change";
}

const BAND_NAMES = [
  "Top of page",
  "Upper",
  "Upper-mid",
  "Mid",
  "Lower-mid",
  "Lower",
  "Near footer",
  "Footer area",
];

function bandName(index: number, total: number): string {
  if (total === 8 && index < BAND_NAMES.length) return BAND_NAMES[index]!;
  return `Band ${index + 1}`;
}

/** Cap displayed pixel-diff % so near-100% noise does not imply “everything wrong.” */
function displayPixelPercent(ratio: number): number {
  const raw = Math.round(ratio * 100);
  return Math.min(99, raw);
}

export function VisualDiffGuide({
  variant,
  guide,
  selectedSection,
  onSelectSection,
  onBandScrollToRatio,
  sectionDecisions,
  onSectionDecision,
}: {
  variant: "desktop" | "mobile";
  guide?: VisualDiffGuide;
  selectedSection: number;
  onSelectSection: (index: number) => void;
  /** Scroll previews to the vertical center of this band (0–1 page height). */
  onBandScrollToRatio?: (startYRatio: number) => void;
  sectionDecisions?: Record<string, ContentReviewDecision>;
  onSectionDecision?: (sectionIndex: number, decision: ContentReviewDecision) => void;
}) {
  const label = variant === "desktop" ? "Desktop" : "Mobile";

  if (!guide || guide.sections.length === 0) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-zinc-50/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Where to look — {label}
        </h3>
        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          No snapshot band map for this capture.
        </p>
      </section>
    );
  }

  const total = guide.sections.length;

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Where to look (full-page snapshot) — {label}
      </h3>
      <p className="mt-0.5 text-[9px] leading-snug text-zinc-500 dark:text-zinc-400">
        Percentages in parentheses are vertical position on the page (top to bottom), not “amount of copy
        changed.” The badge approximates how many pixels differ in that band (screenshot noise possible).
      </p>
      <div className="mt-1.5 flex flex-col gap-1">
        {guide.sections.map((section) => {
          const selected = selectedSection === section.sectionIndex;
          const from = Math.round(section.startYRatio * 100);
          const to = Math.round(section.endYRatio * 100);
          const delta = displayPixelPercent(section.changedPixelRatio);
          const key = String(section.sectionIndex);
          const decision = sectionDecisions?.[key];
          const tooltipBadge = `${severityLabel(section.severity)} — about ${delta}% of pixels in this band differ between screenshots (pixel diff, not text %).`;
          const tooltipRow = `${bandName(section.sectionIndex, total)} — vertical slice ${from}%–${to}% of page height. ${tooltipBadge}`;

          return (
            <div
              key={`${label}-${section.sectionIndex}`}
              className={`rounded border px-2 py-1 text-[10px] transition ${
                selected
                  ? "border-zinc-500 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <button
                type="button"
                title={tooltipRow}
                onClick={() => {
                  onSelectSection(section.sectionIndex);
                  onBandScrollToRatio?.(section.startYRatio);
                }}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  Band {section.sectionIndex + 1} — {bandName(section.sectionIndex, total)} ({from}%–{to}%)
                </span>
                <span
                  title={tooltipBadge}
                  className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${severityClass(section.severity)}`}
                >
                  {delta}%
                </span>
              </button>
              {onSectionDecision ? (
                <div className="mt-1 flex flex-wrap gap-1 border-t border-zinc-100 pt-1 dark:border-zinc-800">
                  <button
                    type="button"
                    className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                      decision === "approved"
                        ? "bg-emerald-600 text-white dark:bg-emerald-700"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                    onClick={() => onSectionDecision(section.sectionIndex, "approved")}
                  >
                    Approve band
                  </button>
                  <button
                    type="button"
                    className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                      decision === "rejected"
                        ? "bg-amber-600 text-white dark:bg-amber-700"
                        : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                    onClick={() => onSectionDecision(section.sectionIndex, "rejected")}
                  >
                    Needs change
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
