"use client";

import { useMemo, useState } from "react";
import type { ComparisonRun } from "@/lib/types/comparison";
import { DraftEmailImageSidebar } from "@/components/DraftEmailImageSidebar";
import { DraftEmailPanel } from "@/components/DraftEmailPanel";
import { DifferencesPanel } from "@/components/DifferencesPanel";
import { PreviewLightbox } from "@/components/PreviewLightbox";
import type { PreviewSlide } from "@/components/PreviewLightbox";
import { ReviewLiveSplit } from "@/components/ReviewLiveSplit";
import { ReviewSiteFeedback } from "@/components/ReviewSiteFeedback";
import { SidebarScore } from "@/components/SidebarScore";
import { ViewToggle } from "@/components/ViewToggle";
import type { SiteReviewEntry } from "@/lib/storage/siteReview";

type ViewMode = "desktop" | "mobile";
type ReviewTab = "live" | "draftEmail";
type LiveSidebarTab = "review" | "prompt";
type LightboxMode = "compare" | "draftEmail";

export default function ReviewClient({
  run,
  reviewStorageKey,
  initialSiteReview,
  siteLatestRunId,
}: {
  run: ComparisonRun;
  /** Map key for site review (Projects id, inferred row, or run id). */
  reviewStorageKey: string;
  initialSiteReview: SiteReviewEntry | undefined;
  siteLatestRunId: string | undefined;
}) {
  const [mode, setMode] = useState<ViewMode>("desktop");
  const [reviewTab, setReviewTab] = useState<ReviewTab>("live");
  const [liveSidebarTab, setLiveSidebarTab] =
    useState<LiveSidebarTab>("review");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxMode, setLightboxMode] = useState<LightboxMode>("compare");

  const currentSrc =
    mode === "desktop"
      ? run.screenshots.currentDesktop
      : run.screenshots.currentMobile;
  const newSrc =
    mode === "desktop"
      ? run.screenshots.newDesktop
      : run.screenshots.newMobile;

  const compareSlides: PreviewSlide[] = useMemo(
    () => [
      {
        src: currentSrc,
        alt: `Current site ${mode} screenshot`,
        label: `Current (${mode})`,
      },
      {
        src: newSrc,
        alt: `New site ${mode} screenshot`,
        label: `New (${mode})`,
      },
    ],
    [currentSrc, newSrc, mode],
  );

  const draftEmailSlides: PreviewSlide[] = useMemo(
    () => [
      {
        src: run.screenshots.currentMobile,
        alt: "Current site mobile screenshot",
        label: "Before (mobile)",
      },
      {
        src: run.screenshots.newMobile,
        alt: "New site mobile screenshot",
        label: "After (mobile)",
      },
      {
        src: run.screenshots.currentDesktop,
        alt: "Current site desktop screenshot",
        label: "Before (desktop)",
      },
      {
        src: run.screenshots.newDesktop,
        alt: "New site desktop screenshot",
        label: "After (desktop)",
      },
    ],
    [
      run.screenshots.currentMobile,
      run.screenshots.newMobile,
      run.screenshots.currentDesktop,
      run.screenshots.newDesktop,
    ],
  );

  const lightboxSlides =
    lightboxMode === "compare" ? compareSlides : draftEmailSlides;

  function openLightboxCompare(index: 0 | 1) {
    setLightboxMode("compare");
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function openLightboxDraftEmail(index: 0 | 1 | 2 | 3) {
    setLightboxMode("draftEmail");
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  const tabBase =
    "rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400";
  const tabActive =
    "bg-zinc-900 text-white shadow dark:bg-zinc-100 dark:text-zinc-900";
  const tabIdle =
    "text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-800";

  const sidebarTabBase =
    "rounded-md px-2 py-1 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400";

  const asideScrollClass =
    "min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-950 lg:max-h-[calc(100vh-12rem)]";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PreviewLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
      <header className="shrink-0 space-y-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Review comparison
        </h1>
        <div
          className="inline-flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-700 dark:bg-zinc-900/80"
          role="tablist"
          aria-label="Review view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={reviewTab === "live"}
            className={`${tabBase} ${reviewTab === "live" ? tabActive : tabIdle}`}
            onClick={() => setReviewTab("live")}
          >
            Live preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={reviewTab === "draftEmail"}
            className={`${tabBase} ${reviewTab === "draftEmail" ? tabActive : tabIdle}`}
            onClick={() => setReviewTab("draftEmail")}
          >
            Draft Email
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-4">
        <section className="flex min-h-0 flex-1 flex-col max-lg:min-h-[50vh] lg:h-[calc(100dvh-12rem)] lg:max-h-[calc(100dvh-12rem)]">
          <div className="flex h-full min-h-0 flex-1 flex-col">
            {reviewTab === "live" ? (
              <ReviewLiveSplit
                viewportMode={mode}
                currentUrl={run.currentUrl}
                newUrl={run.newUrl}
                currentSrc={currentSrc}
                newSrc={newSrc}
                screenshotAltCurrent={`Current site ${mode} screenshot`}
                screenshotAltNew={`New site ${mode} screenshot`}
                onOpenLightbox={openLightboxCompare}
              />
            ) : (
              <DraftEmailPanel run={run} />
            )}
          </div>
        </section>

        <aside
          className={`flex min-h-0 w-full shrink-0 flex-col gap-2 lg:w-[min(340px,36vw)] lg:max-w-[360px] ${reviewTab === "draftEmail" ? "lg:max-w-[min(400px,42vw)]" : ""}`}
        >
          {reviewTab === "live" ? (
            <>
              <div className="shrink-0">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Snapshot viewport
                </p>
                <ViewToggle mode={mode} onChange={setMode} size="compact" />
                <p className="mt-1 text-[9px] leading-snug text-zinc-500 dark:text-zinc-400">
                  Desktop vs mobile captures; narrows the live preview column.
                </p>
              </div>
              <div
                className="inline-flex w-full shrink-0 gap-1 rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/80"
                role="tablist"
                aria-label="Sidebar tools"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={liveSidebarTab === "review"}
                  className={`${sidebarTabBase} ${liveSidebarTab === "review" ? tabActive : tabIdle}`}
                  onClick={() => setLiveSidebarTab("review")}
                >
                  Review
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={liveSidebarTab === "prompt"}
                  className={`${sidebarTabBase} ${liveSidebarTab === "prompt" ? tabActive : tabIdle}`}
                  onClick={() => setLiveSidebarTab("prompt")}
                >
                  Prompt
                </button>
              </div>
              <div className={`${asideScrollClass} flex flex-col gap-2`}>
                {liveSidebarTab === "review" ? (
                  <>
                    <SidebarScore findings={run.findings} />
                    <ReviewSiteFeedback
                      siteKey={reviewStorageKey}
                      runId={run.id}
                      siteLatestRunId={siteLatestRunId}
                      initialEntry={initialSiteReview}
                    />
                    <DifferencesPanel
                      compact
                      showOnly="suggested"
                      runId={run.id}
                      findings={run.findings}
                      generatedPrompt={run.generatedPrompt}
                      initialUserPromptAppend={run.userPromptAppend}
                      referenceSiteUrl={run.currentUrl}
                    />
                  </>
                ) : (
                  <DifferencesPanel
                    compact
                    showOnly="promptTools"
                    runId={run.id}
                    findings={run.findings}
                    generatedPrompt={run.generatedPrompt}
                    initialUserPromptAppend={run.userPromptAppend}
                    referenceSiteUrl={run.currentUrl}
                  />
                )}
              </div>
            </>
          ) : (
            <div className={asideScrollClass}>
              <DraftEmailImageSidebar
                run={run}
                onOpenLightbox={openLightboxDraftEmail}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
