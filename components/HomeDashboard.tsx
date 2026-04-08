"use client";

import { CompareForm } from "@/components/CompareForm";
import { ExampleSitesPanel } from "@/components/ExampleSitesPanel";
import { MasterPromptCopyCard } from "@/components/MasterPromptCopyCard";
import { EXAMPLE_SITE_PAIRS } from "@/lib/data/exampleSites";
import type { SiteLatestMap } from "@/lib/storage/siteLatest";
import type { SiteReviewMap } from "@/lib/storage/siteReview";

export function HomeDashboard({
  siteLatest,
  siteReview,
}: {
  siteLatest: SiteLatestMap;
  siteReview: SiteReviewMap;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-10 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Website comparison
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Capture desktop and mobile, diff copy and structure, and copy an
          update prompt. Use the table for client projects — refresh after each
          Lovable deploy.
        </p>
      </div>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,22rem)] lg:items-start lg:gap-8">
        <section className="min-w-0 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Projects
          </h2>
          <ExampleSitesPanel
            pairs={EXAMPLE_SITE_PAIRS}
            latest={siteLatest}
            siteReview={siteReview}
          />
        </section>

        <aside className="flex flex-col gap-10 lg:sticky lg:top-6 lg:self-start">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Lovable master prompt
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Paste the client&apos;s current site URL, then copy the full
              redesign brief for Lovable. This is separate from the comparison
              &quot;Copy prompt&quot; on the review page, which only includes
              diff-based update instructions.
            </p>
            <MasterPromptCopyCard />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Custom URLs
            </h2>
            <CompareForm />
          </section>
        </aside>
      </div>
    </main>
  );
}
