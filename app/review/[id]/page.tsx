import Link from "next/link";
import { notFound } from "next/navigation";
import {
  reviewStorageKeyForRun,
  siteLatestRunIdForReviewSidebar,
} from "@/lib/reviewStorageKey";
import { loadRun } from "@/lib/storage/loadRun";
import { getSiteLatestMap } from "@/lib/storage/siteLatest";
import { getSiteReviewMap } from "@/lib/storage/siteReview";
import ReviewClient from "./ReviewClient";

type Props = { params: Promise<{ id: string }> };

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  const run = await loadRun(id);
  if (!run) notFound();

  const [siteReviewMap, siteLatestMap] = await Promise.all([
    getSiteReviewMap(),
    getSiteLatestMap(),
  ]);
  const reviewStorageKey = reviewStorageKeyForRun(run);
  const initialSiteReview = siteReviewMap[reviewStorageKey];
  const siteLatestRunId =
    siteLatestRunIdForReviewSidebar(
      reviewStorageKey,
      run.id,
      siteLatestMap,
    ) ?? run.id;

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
      />
    </main>
  );
}
