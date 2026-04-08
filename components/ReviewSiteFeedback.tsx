"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveSiteReview } from "@/app/actions/siteReview";
import { buildContentReviewItems } from "@/lib/contentReview/buildContentReviewItems";
import { buildGlobalReviewPrompt } from "@/lib/review/buildGlobalReviewPrompt";
import { reviewStatusUiLabel } from "@/lib/reviewLabels";
import type {
  Findings,
  VisualDiffGuide as VisualDiffGuideData,
} from "@/lib/types/comparison";
import type {
  ContentReviewDecision,
  ReviewStatus,
  SiteReviewEntry,
} from "@/lib/storage/siteReview";
import { ContentReviewList } from "@/components/ContentReviewList";
import { VisualDiffGuide } from "@/components/VisualDiffGuide";

function bandScrollRatiosForGuide(
  guide: VisualDiffGuideData,
  startYRatio: number,
): { currentRatio: number; newRatio: number } {
  const hMin = guide.height;
  const hc = Math.max(1, guide.currentPngHeight ?? hMin);
  const hn = Math.max(1, guide.newPngHeight ?? hMin);
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  return {
    currentRatio: clamp01(startYRatio * (hMin / hc)),
    newRatio: clamp01(startYRatio * (hMin / hn)),
  };
}

function effectiveDraft(
  siteLatestRunId: string | undefined,
  stored: SiteReviewEntry | undefined,
): {
  desktopStatus: ReviewStatus;
  desktopNotes: string;
  mobileStatus: ReviewStatus;
  mobileNotes: string;
  globalReviewPrompt: string;
  contentItemDecisions: Record<string, ContentReviewDecision | undefined>;
  sectionDecisions: {
    desktop: Record<string, ContentReviewDecision>;
    mobile: Record<string, ContentReviewDecision>;
  };
} {
  const stale =
    Boolean(siteLatestRunId) &&
    stored?.reviewedRunId != null &&
    stored.reviewedRunId !== siteLatestRunId;
  if (stale) {
    return {
      desktopStatus: "empty",
      desktopNotes: "",
      mobileStatus: "empty",
      mobileNotes: "",
      globalReviewPrompt: "",
      contentItemDecisions: {},
      sectionDecisions: { desktop: {}, mobile: {} },
    };
  }
  const cid = stored?.contentItemDecisions ?? {};
  const sd = stored?.sectionDecisions;
  return {
    desktopStatus: stored?.desktopReview?.status ?? stored?.status ?? "empty",
    desktopNotes: stored?.desktopReview?.notes ?? stored?.notes ?? "",
    mobileStatus: stored?.mobileReview?.status ?? stored?.status ?? "empty",
    mobileNotes: stored?.mobileReview?.notes ?? "",
    globalReviewPrompt: stored?.globalReviewPrompt ?? "",
    contentItemDecisions: { ...cid },
    sectionDecisions: {
      desktop: { ...sd?.desktop },
      mobile: { ...sd?.mobile },
    },
  };
}

export function ReviewSiteFeedback({
  siteKey,
  runId,
  siteLatestRunId,
  initialEntry,
  currentUrl,
  newUrl,
  projectLabel,
  desktopGuide,
  mobileGuide,
  findings,
  activeMode,
  onMarkDesktopDone,
  onMarkMobileDone,
  onSaved,
  desktopReviewed,
  mobileReviewed,
  reviewSaved,
  onDesktopReviewedMark,
  onMobileReviewedMark,
  onReviewSavedMark,
  onBandScrollToRatios,
}: {
  siteKey: string;
  runId: string;
  siteLatestRunId: string | undefined;
  initialEntry: SiteReviewEntry | undefined;
  currentUrl: string;
  newUrl: string;
  projectLabel?: string;
  desktopGuide?: VisualDiffGuideData;
  mobileGuide?: VisualDiffGuideData;
  findings: Findings;
  activeMode: "desktop" | "mobile";
  onMarkDesktopDone?: () => void;
  onMarkMobileDone?: () => void;
  onSaved?: () => void;
  desktopReviewed: boolean;
  mobileReviewed: boolean;
  reviewSaved: boolean;
  onDesktopReviewedMark: () => void;
  onMobileReviewedMark: () => void;
  onReviewSavedMark: (saved: boolean) => void;
  /** Sync main preview scroll when a band row is chosen (matches snapshot viewport). */
  onBandScrollToRatios?: (ratios: {
    currentRatio: number;
    newRatio: number;
  }) => void;
}) {
  const router = useRouter();
  const contentItems = useMemo(() => buildContentReviewItems(findings), [findings]);

  const [draft, setDraft] = useState(() => {
    const seed = effectiveDraft(siteLatestRunId, initialEntry);
    const rejectedLines = contentItems
      .filter((i) => seed.contentItemDecisions[i.id] === "rejected")
      .map((i) => i.text);
    const rejectedDesktop = new Set(
      Object.entries(seed.sectionDecisions.desktop)
        .filter(([, v]) => v === "rejected")
        .map(([k]) => k),
    );
    const rejectedMobile = new Set(
      Object.entries(seed.sectionDecisions.mobile)
        .filter(([, v]) => v === "rejected")
        .map(([k]) => k),
    );
    if (seed.globalReviewPrompt.trim()) return seed;
    return {
      ...seed,
      globalReviewPrompt: buildGlobalReviewPrompt({
        projectLabel,
        currentUrl,
        newUrl,
        desktopReview: {
          status: seed.desktopStatus,
          notes: seed.desktopNotes,
        },
        mobileReview: {
          status: seed.mobileStatus,
          notes: seed.mobileNotes,
        },
        desktopGuide,
        mobileGuide,
        rejectedContentLines: rejectedLines,
        rejectedDesktopBandKeys: rejectedDesktop,
        rejectedMobileBandKeys: rejectedMobile,
      }),
    };
  });

  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [selectedDesktopSection, setSelectedDesktopSection] = useState(0);
  const [selectedMobileSection, setSelectedMobileSection] = useState(0);
  const contentListRef = useRef<HTMLDivElement>(null);
  const globalPromptRef = useRef<HTMLTextAreaElement>(null);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedStateLabel, setSavedStateLabel] = useState("");

  function setContentDecision(id: string, decision: ContentReviewDecision): void {
    setDraft((d) => ({
      ...d,
      contentItemDecisions: { ...d.contentItemDecisions, [id]: decision },
    }));
  }

  function setSectionDecision(
    variant: "desktop" | "mobile",
    sectionIndex: number,
    decision: ContentReviewDecision,
  ): void {
    const key = String(sectionIndex);
    setDraft((d) => ({
      ...d,
      sectionDecisions: {
        ...d.sectionDecisions,
        [variant]: {
          ...d.sectionDecisions[variant],
          [key]: decision,
        },
      },
    }));
  }

  async function handleSave() {
    setErr(null);
    setSaving(true);
    const rejectedLines = contentItems
      .filter((i) => draft.contentItemDecisions[i.id] === "rejected")
      .map((i) => i.text);
    const rejectedDesktop = new Set(
      Object.entries(draft.sectionDecisions.desktop)
        .filter(([, v]) => v === "rejected")
        .map(([k]) => k),
    );
    const rejectedMobile = new Set(
      Object.entries(draft.sectionDecisions.mobile)
        .filter(([, v]) => v === "rejected")
        .map(([k]) => k),
    );
    const computed = buildGlobalReviewPrompt({
      projectLabel,
      currentUrl,
      newUrl,
      desktopReview: {
        status: draft.desktopStatus,
        notes: draft.desktopNotes,
      },
      mobileReview: {
        status: draft.mobileStatus,
        notes: draft.mobileNotes,
      },
      desktopGuide,
      mobileGuide,
      rejectedContentLines: rejectedLines,
      rejectedDesktopBandKeys: rejectedDesktop,
      rejectedMobileBandKeys: rejectedMobile,
    });
    const contentItemDecisionsClean = Object.fromEntries(
      Object.entries(draft.contentItemDecisions).filter(
        (e): e is [string, ContentReviewDecision] =>
          e[1] === "approved" || e[1] === "rejected",
      ),
    );
    function cleanSectionRecord(
      r: Record<string, ContentReviewDecision | undefined>,
    ): Record<string, ContentReviewDecision> {
      return Object.fromEntries(
        Object.entries(r).filter(
          (e): e is [string, ContentReviewDecision] =>
            e[1] === "approved" || e[1] === "rejected",
        ),
      );
    }
    const desktopS = cleanSectionRecord(draft.sectionDecisions.desktop);
    const mobileS = cleanSectionRecord(draft.sectionDecisions.mobile);
    const sectionDecisionsClean =
      Object.keys(desktopS).length > 0 || Object.keys(mobileS).length > 0
        ? {
            ...(Object.keys(desktopS).length > 0 ? { desktop: desktopS } : {}),
            ...(Object.keys(mobileS).length > 0 ? { mobile: mobileS } : {}),
          }
        : undefined;

    const r = await saveSiteReview(
      siteKey,
      draft.desktopStatus,
      draft.desktopNotes,
      draft.mobileStatus,
      draft.mobileNotes,
      currentUrl,
      newUrl,
      projectLabel,
      desktopGuide,
      mobileGuide,
      draft.globalReviewPrompt.trim() || computed,
      contentItemDecisionsClean,
      sectionDecisionsClean,
      contentItems.map((i) => ({ id: i.id, text: i.text })),
      runId,
    );
    setSaving(false);
    if (r.ok) {
      setSavedStateLabel("Review saved");
      onReviewSavedMark(true);
      onSaved?.();
      router.refresh();
    } else {
      setErr(r.error);
    }
  }

  const canPickPassFail = Boolean(siteLatestRunId);
  const warnDesktopFailedNoNotes =
    draft.desktopStatus === "failed" && !draft.desktopNotes.trim();
  const warnMobileFailedNoNotes =
    draft.mobileStatus === "failed" && !draft.mobileNotes.trim();
  const notLatestCapture =
    siteLatestRunId !== undefined && siteLatestRunId !== runId;

  const templates = [
    {
      id: "layout",
      label: "Layout",
      text: "Layout and section spacing should match the original hierarchy more closely.",
    },
    {
      id: "typography",
      label: "Typography",
      text: "Typography scale and contrast should better match the original site.",
    },
    {
      id: "cta",
      label: "CTA",
      text: "Primary CTA placement and emphasis should be improved for clarity.",
    },
    {
      id: "mobile",
      label: "Mobile stack",
      text: "Mobile stacking and spacing need refinement to avoid crowded content.",
    },
  ] as const;

  function applyTemplate(
    field: "desktopNotes" | "mobileNotes",
    text: string,
  ): void {
    setDraft((prev) => {
      const current = prev[field].trim();
      const next = current ? `${current}\n- ${text}` : `- ${text}`;
      return { ...prev, [field]: next };
    });
  }

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        el.isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowDown" || (e.key.toLowerCase() === "j" && !e.metaKey)) {
        if (contentItems.length === 0) return;
        e.preventDefault();
        setSelectedContentIndex((i) =>
          Math.min(contentItems.length - 1, i + 1),
        );
        return;
      }
      if (e.key === "ArrowUp" || (e.key.toLowerCase() === "k" && !e.metaKey)) {
        if (contentItems.length === 0) return;
        e.preventDefault();
        setSelectedContentIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key.toLowerCase() === "a") {
        if (contentItems.length === 0) return;
        e.preventDefault();
        const item = contentItems[selectedContentIndex];
        if (item) setContentDecision(item.id, "approved");
        return;
      }
      if (e.key.toLowerCase() === "r") {
        if (contentItems.length === 0) return;
        e.preventDefault();
        const item = contentItems[selectedContentIndex];
        if (item) setContentDecision(item.id, "rejected");
        return;
      }
      if (e.key.toLowerCase() === "g") {
        e.preventDefault();
        globalPromptRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [contentItems, selectedContentIndex]);

  return (
    <div className="flex flex-col gap-2">
      <ContentReviewList
        items={contentItems}
        decisions={draft.contentItemDecisions}
        selectedIndex={selectedContentIndex}
        onSelectIndex={setSelectedContentIndex}
        onDecision={setContentDecision}
        listRef={contentListRef}
      />

      <section className="rounded-lg border border-zinc-200 bg-zinc-50/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Review progress
        </h3>
        <ul className="mt-1 space-y-1 text-[10px]">
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">
              1. Content lines
            </span>
            <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
              {contentItems.length} items
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">2. Desktop</span>
            <button
              type="button"
              onClick={() => {
                onDesktopReviewedMark();
                onMarkDesktopDone?.();
              }}
              className={`rounded px-1.5 py-0.5 font-medium ${
                desktopReviewed
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {desktopReviewed ? "Done" : "Mark"}
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">3. Mobile</span>
            <button
              type="button"
              onClick={() => {
                onMobileReviewedMark();
                onMarkMobileDone?.();
              }}
              className={`rounded px-1.5 py-0.5 font-medium ${
                mobileReviewed
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {mobileReviewed ? "Done" : "Mark"}
            </button>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-zinc-600 dark:text-zinc-300">4. Save</span>
            <span
              className={`rounded px-1.5 py-0.5 font-medium ${
                reviewSaved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {reviewSaved ? "Done" : "Pending"}
            </span>
          </li>
        </ul>
      </section>

      <VisualDiffGuide
        variant="desktop"
        guide={desktopGuide}
        selectedSection={selectedDesktopSection}
        onSelectSection={setSelectedDesktopSection}
        onBandScrollToRatio={
          activeMode === "desktop" && onBandScrollToRatios && desktopGuide
            ? (startYRatio) =>
                onBandScrollToRatios(
                  bandScrollRatiosForGuide(desktopGuide, startYRatio),
                )
            : undefined
        }
        sectionDecisions={draft.sectionDecisions.desktop}
        onSectionDecision={(idx, d) => setSectionDecision("desktop", idx, d)}
      />
      <VisualDiffGuide
        variant="mobile"
        guide={mobileGuide}
        selectedSection={selectedMobileSection}
        onSelectSection={setSelectedMobileSection}
        onBandScrollToRatio={
          activeMode === "mobile" && onBandScrollToRatios && mobileGuide
            ? (startYRatio) =>
                onBandScrollToRatios(
                  bandScrollRatiosForGuide(mobileGuide, startYRatio),
                )
            : undefined
        }
        sectionDecisions={draft.sectionDecisions.mobile}
        onSectionDecision={(idx, d) => setSectionDecision("mobile", idx, d)}
      />

      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
        {notLatestCapture ? (
          <p
            className="text-[9px] leading-snug text-amber-800 dark:text-amber-200"
            role="status"
          >
            This capture is not the latest for this row — saving ties the review
            to this run id.
          </p>
        ) : null}
        <div>
          <label
            htmlFor="review-site-desktop-status"
            className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Desktop status
          </label>
          <select
            id="review-site-desktop-status"
            value={draft.desktopStatus}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                desktopStatus: e.target.value as ReviewStatus,
              }))
            }
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="empty">{reviewStatusUiLabel.empty}</option>
            <option value="failed" disabled={!canPickPassFail}>
              {reviewStatusUiLabel.failed}
            </option>
            <option value="passed" disabled={!canPickPassFail}>
              {reviewStatusUiLabel.passed}
            </option>
          </select>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label
              htmlFor="review-site-desktop-notes"
              className="block text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Desktop comments
            </label>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400">
              {draft.desktopNotes.length} / 4000
            </span>
          </div>
          <div className="mb-1.5 flex flex-wrap gap-1">
            {templates.map((t) => (
              <button
                key={`desktop-${t.id}`}
                type="button"
                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => applyTemplate("desktopNotes", t.text)}
              >
                + {t.label}
              </button>
            ))}
          </div>
          <textarea
            id="review-site-desktop-notes"
            value={draft.desktopNotes}
            onChange={(e) =>
              setDraft((d) => ({ ...d, desktopNotes: e.target.value }))
            }
            rows={5}
            placeholder="Desktop feedback..."
            maxLength={4000}
            className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <div className="mt-1 flex items-center justify-between">
            {warnDesktopFailedNoNotes ? (
              <p className="text-[9px] text-amber-700 dark:text-amber-300">
                Add notes when desktop status is Failed.
              </p>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => {
                onDesktopReviewedMark();
                onMarkDesktopDone?.();
              }}
            >
              Mark desktop reviewed
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="review-site-mobile-status"
            className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Mobile status
          </label>
          <select
            id="review-site-mobile-status"
            value={draft.mobileStatus}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                mobileStatus: e.target.value as ReviewStatus,
              }))
            }
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="empty">{reviewStatusUiLabel.empty}</option>
            <option value="failed" disabled={!canPickPassFail}>
              {reviewStatusUiLabel.failed}
            </option>
            <option value="passed" disabled={!canPickPassFail}>
              {reviewStatusUiLabel.passed}
            </option>
          </select>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label
              htmlFor="review-site-mobile-notes"
              className="block text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Mobile comments
            </label>
            <span className="text-[9px] text-zinc-500 dark:text-zinc-400">
              {draft.mobileNotes.length} / 4000
            </span>
          </div>
          <div className="mb-1.5 flex flex-wrap gap-1">
            {templates.map((t) => (
              <button
                key={`mobile-${t.id}`}
                type="button"
                className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => applyTemplate("mobileNotes", t.text)}
              >
                + {t.label}
              </button>
            ))}
          </div>
          <textarea
            id="review-site-mobile-notes"
            value={draft.mobileNotes}
            onChange={(e) =>
              setDraft((d) => ({ ...d, mobileNotes: e.target.value }))
            }
            rows={5}
            placeholder="Mobile feedback..."
            maxLength={4000}
            className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <div className="mt-1 flex items-center justify-between">
            {warnMobileFailedNoNotes ? (
              <p className="text-[9px] text-amber-700 dark:text-amber-300">
                Add notes when mobile status is Failed.
              </p>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => {
                onMobileReviewedMark();
                onMarkMobileDone?.();
              }}
            >
              Mark mobile reviewed
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="review-site-global-prompt"
            className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Global review prompt (G to focus)
          </label>
          <textarea
            ref={globalPromptRef}
            id="review-site-global-prompt"
            value={draft.globalReviewPrompt}
            onChange={(e) =>
              setDraft((d) => ({ ...d, globalReviewPrompt: e.target.value }))
            }
            rows={7}
            placeholder="Final consolidated instruction text for Lovable..."
            maxLength={12000}
            className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
        {err ? (
          <p className="text-[9px] text-red-600 dark:text-red-400" role="alert">
            {err}
          </p>
        ) : null}
        {savedStateLabel ? (
          <p
            aria-live="polite"
            className="text-[9px] text-emerald-700 dark:text-emerald-300"
          >
            {savedStateLabel}
          </p>
        ) : null}
        <p className="text-[9px] text-zinc-500 dark:text-zinc-400">
          Active viewport: <strong>{activeMode}</strong>. Content: ↑/↓ or J/K
          move, A approve, R needs change. Save writes everything.
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="w-full rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {saving ? "Saving…" : "Save review"}
        </button>
      </div>
    </div>
  );
}
