"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { DesktopLiveIframe } from "@/components/DesktopLiveIframe";
import { MobileLiveIframe } from "@/components/MobileLiveIframe";
import { ScreenshotPanel } from "@/components/ScreenshotPanel";

type ViewportMode = "desktop" | "mobile";
type ColumnPreview = "live" | "snapshot";

export type ScrollToRatioRequest = {
  /** Bumps when the user picks another band so effects re-run. */
  id: number;
  /** 0–1 scroll fraction for Current column (aligned band start vs full PNG height). */
  currentRatio: number;
  /** 0–1 scroll fraction for New column. */
  newRatio: number;
};

function SegmentedLiveSnapshot({
  value,
  onChange,
  ariaLabel,
}: {
  value: ColumnPreview;
  onChange: (v: ColumnPreview) => void;
  ariaLabel: string;
}) {
  const base =
    "rounded-md px-2 py-1 text-[11px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400";
  const active =
    "bg-zinc-900 text-white shadow dark:bg-zinc-100 dark:text-zinc-900";
  const idle =
    "text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-800";

  return (
    <div
      className="inline-flex shrink-0 gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/80"
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`${base} ${value === "live" ? active : idle}`}
        onClick={() => onChange("live")}
        aria-pressed={value === "live"}
      >
        Live
      </button>
      <button
        type="button"
        className={`${base} ${value === "snapshot" ? active : idle}`}
        onClick={() => onChange("snapshot")}
        aria-pressed={value === "snapshot"}
      >
        Snapshot
      </button>
    </div>
  );
}

function scrollIframeToRatio(iframe: HTMLIFrameElement | null, ratio: number) {
  if (!iframe) return;
  try {
    const win = iframe.contentWindow;
    if (!win) return;
    const doc = win.document.documentElement;
    const h = Math.max(0, doc.scrollHeight - win.innerHeight);
    win.scrollTo({
      top: ratio * h,
      behavior: "smooth",
    });
  } catch {
    /* cross-origin */
  }
}

export function ReviewLiveSplit({
  viewportMode,
  currentUrl,
  newUrl,
  currentSrc,
  newSrc,
  screenshotAltCurrent,
  screenshotAltNew,
  onOpenLightbox,
  scrollToRatioRequest,
}: {
  viewportMode: ViewportMode;
  currentUrl: string;
  newUrl: string;
  currentSrc: string;
  newSrc: string;
  screenshotAltCurrent: string;
  screenshotAltNew: string;
  onOpenLightbox: (index: 0 | 1) => void;
  /** When set, scroll both preview columns to this vertical position (snapshot + live). */
  scrollToRatioRequest?: ScrollToRatioRequest | null;
}) {
  const [previewMode, setPreviewMode] = useState<ColumnPreview>("snapshot");

  const currentSnapshotScrollRef = useRef<HTMLDivElement>(null);
  const newSnapshotScrollRef = useRef<HTMLDivElement>(null);
  const currentLiveIframeRef = useRef<HTMLIFrameElement>(null);
  const newLiveIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!scrollToRatioRequest) return;
    const rc = Math.min(1, Math.max(0, scrollToRatioRequest.currentRatio));
    const rn = Math.min(1, Math.max(0, scrollToRatioRequest.newRatio));

    function scrollSnapshotEl(
      el: HTMLDivElement | null,
      r: number,
      behavior: ScrollBehavior,
    ) {
      if (!el) return;
      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      el.scrollTo({ top: r * maxScroll, behavior });
    }

    function applyScroll(behavior: ScrollBehavior) {
      scrollSnapshotEl(currentSnapshotScrollRef.current, rc, behavior);
      scrollSnapshotEl(newSnapshotScrollRef.current, rn, behavior);
      scrollIframeToRatio(currentLiveIframeRef.current, rc);
      scrollIframeToRatio(newLiveIframeRef.current, rn);
    }

    applyScroll("smooth");
    requestAnimationFrame(() => applyScroll("smooth"));

    const els = [
      currentSnapshotScrollRef.current,
      newSnapshotScrollRef.current,
    ].filter((x): x is HTMLDivElement => x != null);

    const ro = new ResizeObserver(() => {
      applyScroll("auto");
    });
    for (const el of els) ro.observe(el);

    return () => ro.disconnect();
  }, [scrollToRatioRequest]);

  const mobileChrome = viewportMode === "mobile";
  const segmentedAriaBoth =
    "Live or snapshot preview — applies to Current and New columns together";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        <PreviewColumn
          label="Current"
          pageUrl={currentUrl}
          preview={previewMode}
          onPreviewChange={setPreviewMode}
          mobileChrome={mobileChrome}
          snapshotSrc={currentSrc}
          snapshotAlt={screenshotAltCurrent}
          onSnapshotClick={() => onOpenLightbox(0)}
          segmentedAria={segmentedAriaBoth}
          snapshotScrollRef={currentSnapshotScrollRef}
          liveIframeRef={currentLiveIframeRef}
        />
        <PreviewColumn
          label="New"
          pageUrl={newUrl}
          preview={previewMode}
          onPreviewChange={setPreviewMode}
          mobileChrome={mobileChrome}
          snapshotSrc={newSrc}
          snapshotAlt={screenshotAltNew}
          onSnapshotClick={() => onOpenLightbox(1)}
          segmentedAria={segmentedAriaBoth}
          snapshotScrollRef={newSnapshotScrollRef}
          liveIframeRef={newLiveIframeRef}
        />
      </div>
      <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
        Live desktop preview uses a fixed 1500px-wide viewport (scaled to fit);
        mobile uses a 390px-wide frame. If a pane stays blank, the site may
        block embedding — use{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          Snapshot
        </span>{" "}
        or open the link in a new tab. Choosing a band scrolls both columns;
        live scroll works only when the page allows same-origin access.
      </p>
    </div>
  );
}

function PreviewColumn({
  label,
  pageUrl,
  preview,
  onPreviewChange,
  mobileChrome,
  snapshotSrc,
  snapshotAlt,
  onSnapshotClick,
  segmentedAria,
  snapshotScrollRef,
  liveIframeRef,
}: {
  label: string;
  pageUrl: string;
  preview: ColumnPreview;
  onPreviewChange: (v: ColumnPreview) => void;
  mobileChrome: boolean;
  snapshotSrc: string;
  snapshotAlt: string;
  onSnapshotClick: () => void;
  segmentedAria: string;
  snapshotScrollRef: RefObject<HTMLDivElement | null>;
  liveIframeRef: RefObject<HTMLIFrameElement | null>;
}) {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col gap-2 md:min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {label}
          </h2>
          <SegmentedLiveSnapshot
            value={preview}
            onChange={onPreviewChange}
            ariaLabel={segmentedAria}
          />
        </div>
      </div>
      {pageUrl ? (
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={pageUrl}
          className="min-w-0 truncate text-xs font-normal text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200 dark:hover:decoration-zinc-400"
        >
          {pageUrl}
        </a>
      ) : null}

      <div
        className={`relative flex min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 ${
          mobileChrome ? "flex justify-center px-1 pt-1" : "p-1"
        }`}
      >
        <div
          className={
            mobileChrome
              ? "flex h-full w-full max-w-[390px] flex-col min-h-0"
              : "flex h-full w-full min-h-0 flex-col"
          }
        >
          {preview === "live" ? (
            mobileChrome ? (
              <MobileLiveIframe
                ref={liveIframeRef}
                src={pageUrl}
                title={`${label} live preview`}
              />
            ) : (
              <DesktopLiveIframe
                ref={liveIframeRef}
                src={pageUrl}
                title={`${label} live preview`}
              />
            )
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <ScreenshotPanel
                label={label}
                src={snapshotSrc}
                alt={snapshotAlt}
                onImageClick={onSnapshotClick}
                showLabel={false}
                fitContained={mobileChrome}
                scrollContainerRef={snapshotScrollRef}
                fullPageScroll
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
