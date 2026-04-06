"use client";

import { useState } from "react";
import { DesktopLiveIframe } from "@/components/DesktopLiveIframe";
import { MobileLiveIframe } from "@/components/MobileLiveIframe";
import { ScreenshotPanel } from "@/components/ScreenshotPanel";

type ViewportMode = "desktop" | "mobile";
type ColumnPreview = "live" | "snapshot";

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

export function ReviewLiveSplit({
  viewportMode,
  currentUrl,
  newUrl,
  currentSrc,
  newSrc,
  screenshotAltCurrent,
  screenshotAltNew,
  onOpenLightbox,
}: {
  viewportMode: ViewportMode;
  currentUrl: string;
  newUrl: string;
  currentSrc: string;
  newSrc: string;
  screenshotAltCurrent: string;
  screenshotAltNew: string;
  onOpenLightbox: (index: 0 | 1) => void;
}) {
  const [previewMode, setPreviewMode] = useState<ColumnPreview>("snapshot");

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
        />
      </div>
      <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
        Live desktop preview uses a fixed 1500px-wide viewport (scaled to fit);
        mobile uses a 390px-wide frame. If a pane stays blank, the site may
        block embedding — use{" "}
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          Snapshot
        </span>{" "}
        or open the link in a new tab.
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
              <MobileLiveIframe src={pageUrl} title={`${label} live preview`} />
            ) : (
              <DesktopLiveIframe src={pageUrl} title={`${label} live preview`} />
            )
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-auto">
              <ScreenshotPanel
                label={label}
                src={snapshotSrc}
                alt={snapshotAlt}
                onImageClick={onSnapshotClick}
                showLabel={false}
                fitContained={mobileChrome}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
