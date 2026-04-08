"use client";

import type { RefObject } from "react";
import type { ContentReviewItem } from "@/lib/contentReview/buildContentReviewItems";
import type { ContentReviewDecision } from "@/lib/storage/siteReview";

const categoryLabel: Record<ContentReviewItem["category"], string> = {
  text: "Copy",
  structural: "Structure",
  missing: "Missing",
};

export function ContentReviewList({
  items,
  decisions,
  selectedIndex,
  onSelectIndex,
  onDecision,
  listRef,
}: {
  items: ContentReviewItem[];
  decisions: Record<string, ContentReviewDecision | undefined>;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onDecision: (id: string, decision: ContentReviewDecision) => void;
  listRef?: RefObject<HTMLDivElement | null>;
}) {
  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-zinc-50/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Content changes
        </h3>
        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
          No automated text or structure diff lines for this run. Use notes below.
        </p>
      </section>
    );
  }

  return (
    <section
      ref={listRef}
      className="rounded-lg border border-zinc-200 bg-zinc-50/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/40"
      aria-label="Content review"
    >
      <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Content changes
      </h3>
      <p className="mt-0.5 text-[9px] leading-snug text-zinc-500 dark:text-zinc-400">
        Review each line. Approve if the change is acceptable; Needs change if Lovable should fix it.
      </p>
      <ul className="mt-1.5 flex max-h-64 flex-col gap-1 overflow-y-auto">
        {items.map((item, index) => {
          const d = decisions[item.id];
          const selected = selectedIndex === index;
          return (
            <li
              key={item.id}
              className={`rounded border px-2 py-1.5 text-[10px] transition ${
                selected
                  ? "border-zinc-500 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-800"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onSelectIndex(index)}
              >
                <span className="mr-1 rounded bg-zinc-200 px-1 py-0.5 text-[9px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                  {categoryLabel[item.category]}
                </span>
                <span className="text-zinc-800 dark:text-zinc-100">{item.text}</span>
              </button>
              <div className="mt-1 flex flex-wrap gap-1">
                <button
                  type="button"
                  className={`rounded px-2 py-0.5 text-[9px] font-medium ${
                    d === "approved"
                      ? "bg-emerald-600 text-white dark:bg-emerald-700"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                  onClick={() => onDecision(item.id, "approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className={`rounded px-2 py-0.5 text-[9px] font-medium ${
                    d === "rejected"
                      ? "bg-amber-600 text-white dark:bg-amber-700"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                  onClick={() => onDecision(item.id, "rejected")}
                >
                  Needs change
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
