import Link from "next/link";
import { notFound } from "next/navigation";
import { computePassScore } from "@/lib/compare/computePassScore";
import { EXAMPLE_SITE_PAIRS } from "@/lib/data/exampleSites";
import {
  reviewStorageKeyForRun,
  siteLatestRunIdForReviewSidebar,
} from "@/lib/reviewStorageKey";
import { loadRun } from "@/lib/storage/loadRun";
import { getSiteLatestMapWithScores } from "@/lib/storage/siteLatest";
import { getSiteReviewMap } from "@/lib/storage/siteReview";
import ReviewClient from "./ReviewClient";

type Props = { params: Promise<{ id: string }> };

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  const run = await loadRun(id);
  if (!run) notFound();

  const [siteReviewMap, siteLatestMap] = await Promise.all([
    getSiteReviewMap(),
    getSiteLatestMapWithScores(),
  ]);
  const reviewStorageKey = reviewStorageKeyForRun(run);
  const initialSiteReview = siteReviewMap[reviewStorageKey];
  const siteLatestRunId =
    siteLatestRunIdForReviewSidebar(
      reviewStorageKey,
      run.id,
      siteLatestMap,
    ) ?? run.id;
  const storageKeyIndex = EXAMPLE_SITE_PAIRS.findIndex(
    (p) => p.id === reviewStorageKey,
  );
  const currentProject =
    storageKeyIndex >= 0 ? EXAMPLE_SITE_PAIRS[storageKeyIndex] : undefined;
  const prevProject =
    storageKeyIndex > 0 ? EXAMPLE_SITE_PAIRS[storageKeyIndex - 1] : undefined;
  const nextProject =
    storageKeyIndex >= 0 && storageKeyIndex < EXAMPLE_SITE_PAIRS.length - 1
      ? EXAMPLE_SITE_PAIRS[storageKeyIndex + 1]
      : undefined;
  const prevRunId = prevProject ? siteLatestMap[prevProject.id]?.runId : undefined;
  const nextRunId = nextProject ? siteLatestMap[nextProject.id]?.runId : undefined;
  const currentScore = computePassScore(run.findings).score;

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex w-fit text-sm font-medium text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        ← New comparison
      </Link>
      <ReviewClient
        run={run}
        reviewStorageKey={reviewStorageKey}
        initialSiteReview={initialSiteReview}
        siteLatestRunId={siteLatestRunId}
        currentProjectLabel={currentProject?.label}
        currentProjectIndex={storageKeyIndex >= 0 ? storageKeyIndex + 1 : undefined}
        totalProjects={EXAMPLE_SITE_PAIRS.length}
        lastCaptureAt={siteLatestMap[reviewStorageKey]?.updatedAt}
        latestScore={siteLatestMap[reviewStorageKey]?.score ?? currentScore}
        prevProjectLabel={prevProject?.label}
        prevRunId={prevRunId}
        nextProjectLabel={nextProject?.label}
        nextRunId={nextRunId}
      />
    </main>
  );
}
