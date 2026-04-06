import { computePassScore } from "@/lib/compare/computePassScore";
import type { Findings } from "@/lib/types/comparison";

/** Single compact score row for dense review sidebars. */
export function SidebarScore({ findings }: { findings: Findings }) {
  const { score } = computePassScore(findings);
  return (
    <section
      className="flex shrink-0 items-baseline justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50/90 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/40"
      aria-label="Score"
    >
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Score
      </span>
      <p className="flex items-baseline gap-0.5 tabular-nums">
        <span className="text-lg font-bold leading-none text-zinc-900 dark:text-zinc-50">
          {score}
        </span>
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">/ 100</span>
      </p>
    </section>
  );
}
