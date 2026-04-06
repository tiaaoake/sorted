"use client";

import Link from "next/link";
import { useState } from "react";
import { runComparison, type CompareResult } from "@/app/actions/compare";
import type { ExampleSitePair } from "@/lib/data/exampleSites";
import type { SiteLatestMap } from "@/lib/storage/siteLatest";
import { reviewStatusUiLabel } from "@/lib/reviewLabels";
import type { SiteReviewEntry, SiteReviewMap } from "@/lib/storage/siteReview";
import { SitePreviewThumbnail } from "@/components/SitePreviewThumbnail";

function shortUrl(u: string, max = 36): string {
  try {
    const { hostname } = new URL(u);
    if (hostname.length <= max) return hostname;
    return `${hostname.slice(0, max - 1)}…`;
  } catch {
    return u.length <= max ? u : `${u.slice(0, max - 1)}…`;
  }
}

function formatAgo(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 36) return `${hr}h ago`;
  const d = Math.round(hr / 24);
  return `${d}d ago`;
}

function rowReviewBadge(
  latestRunId: string | undefined,
  rev: SiteReviewEntry | undefined,
): { label: string; className: string; title?: string } {
  const base =
    "inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-medium";
  if (!latestRunId) {
    return {
      label: reviewStatusUiLabel.empty,
      className: `${base} bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100`,
      title: "Run Compare first",
    };
  }
  const stale =
    rev?.reviewedRunId != null && rev.reviewedRunId !== latestRunId;
  if (stale) {
    return {
      label: reviewStatusUiLabel.empty,
      className: `${base} bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100`,
      title: "New capture since last review",
    };
  }
  const status = rev?.status ?? "empty";
  if (status === "empty") {
    return {
      label: reviewStatusUiLabel.empty,
      className: `${base} bg-zinc-200/90 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200`,
    };
  }
  if (status === "passed") {
    return {
      label: reviewStatusUiLabel.passed,
      className: `${base} bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100`,
    };
  }
  return {
    label: reviewStatusUiLabel.failed,
    className: `${base} bg-red-100 text-red-950 dark:bg-red-950/40 dark:text-red-100`,
  };
}

export function ExampleSitesPanel({
  pairs,
  latest: initialLatest,
  siteReview,
}: {
  pairs: ExampleSitePair[];
  latest: SiteLatestMap;
  siteReview: SiteReviewMap;
}) {
  const [latest, setLatest] = useState(initialLatest);
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [rowError, setRowError] = useState<string | null>(null);

  function setBusy(id: string, busy: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function runPair(pair: ExampleSitePair) {
    if (!pair.newUrl) return;
    setRowError(null);
    setBusy(pair.id, true);
    const fd = new FormData();
    fd.set("currentUrl", pair.currentUrl);
    fd.set("newUrl", pair.newUrl);
    fd.set("siteKey", pair.id);
    void runComparison(fd).then((r: CompareResult) => {
      setBusy(pair.id, false);
      if (r.success) {
        setLatest((prev) => ({
          ...prev,
          [pair.id]: {
            runId: r.id,
            updatedAt: new Date().toISOString(),
            currentUrl: pair.currentUrl,
            newUrl: pair.newUrl!,
            score: r.score,
          },
        }));
      } else {
        setRowError(`${pair.label}: ${r.error}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      {rowError ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {rowError}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[860px] table-fixed text-left text-[11px] leading-tight text-zinc-900 dark:text-zinc-100">
          <colgroup>
            <col className="w-16" />
            <col className="min-w-[7rem]" />
            <col className="w-[8.75rem]" />
            <col className="w-[8.75rem]" />
            <col className="w-[5.25rem]" />
            <col className="w-[2.75rem]" />
            <col className="w-[5.5rem]" />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
              <th className="whitespace-nowrap px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Preview
              </th>
              <th className="min-w-0 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Site
              </th>
              <th className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Current
              </th>
              <th className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                New
              </th>
              <th className="whitespace-nowrap px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Last capture
              </th>
              <th className="whitespace-nowrap px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Score
              </th>
              <th className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Status
              </th>
              <th className="px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {pairs.map((pair) => {
              const entry = latest[pair.id];
              const loading = busyIds.has(pair.id);
              const rev = siteReview[pair.id];
              const badge = rowReviewBadge(entry?.runId, rev);
              return (
                <tr
                  key={pair.id}
                  className="bg-white dark:bg-zinc-950/40"
                >
                  <td className="w-16 min-w-16 px-1.5 py-1 align-middle">
                    <div className="flex justify-center">
                      <SitePreviewThumbnail
                        label={pair.label}
                        currentSiteUrl={pair.currentUrl}
                        runId={entry?.runId}
                        cacheBust={entry?.updatedAt}
                        sizeClassName="h-8 w-8"
                      />
                    </div>
                  </td>
                  <td className="min-w-0 px-1.5 py-1 align-middle">
                    <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {pair.label}
                    </div>
                  </td>
                  <td className="max-w-0 overflow-hidden px-1.5 py-1 align-middle">
                    <a
                      href={pair.currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={pair.currentUrl}
                      className="block truncate whitespace-nowrap text-zinc-600 underline decoration-zinc-300 underline-offset-1 hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200"
                    >
                      {shortUrl(pair.currentUrl, 96)}
                    </a>
                  </td>
                  <td className="overflow-hidden px-1.5 py-1 align-middle">
                    {pair.newUrl ? (
                      <a
                        href={pair.newUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={pair.newUrl}
                        className="block max-w-full truncate whitespace-nowrap text-zinc-600 underline decoration-zinc-300 underline-offset-1 hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200"
                      >
                        {shortUrl(pair.newUrl, 96)}
                      </a>
                    ) : (
                      <span
                        className="block truncate text-zinc-400 dark:text-zinc-500"
                        title="No redesign URL yet"
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right text-zinc-500 dark:text-zinc-400">
                    {entry ? (
                      <time dateTime={entry.updatedAt} title={entry.updatedAt}>
                        {formatAgo(entry.updatedAt)}
                      </time>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {entry?.score !== undefined ? (
                      <span title="Heuristic pass score (0–100)">{entry.score}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-1.5 py-1 align-middle">
                    <span
                      className={badge.className}
                      title={badge.title}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-1.5 py-1">
                    <div className="flex flex-nowrap items-center justify-end gap-1">
                      {entry ? (
                        <Link
                          href={`/review/${entry.runId}`}
                          className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Open review
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        disabled={loading || !pair.newUrl}
                        title={
                          pair.newUrl
                            ? undefined
                            : "Add a new (Lovable) URL to enable compare"
                        }
                        onClick={() => runPair(pair)}
                        className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                      >
                        {loading
                          ? "Capturing…"
                          : !pair.newUrl
                            ? "No new URL"
                            : entry
                              ? "Refresh"
                              : "Compare"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        <strong className="font-medium text-zinc-600 dark:text-zinc-300">
          Refresh
        </strong>{" "}
        re-captures both URLs in the background — you can run several at once.
        Open review on a row when it finishes. Use after you ship changes to the
        new (Lovable) site. Edit status and notes on the review page; the table
        shows{" "}
        <strong className="font-medium text-zinc-600 dark:text-zinc-300">
          To Review
        </strong>{" "}
        until you save a pass or fail for the current capture.
      </p>
    </div>
  );
}
