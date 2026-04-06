"use client";

import { useState } from "react";
import type { ComparisonRun } from "@/lib/types/comparison";
import { copyImageToClipboard } from "@/lib/email/copyImageToClipboard";

type TileDef = {
  key: string;
  src: string;
  label: string;
  lightboxIndex: 0 | 1 | 2 | 3;
};

type SectionDef = { title: string; tiles: TileDef[] };

function sectionsForRun(run: ComparisonRun): SectionDef[] {
  return [
    {
      title: "Mobile (first)",
      tiles: [
        {
          key: "m-before",
          label: "Before — current site",
          src: run.screenshots.currentMobile,
          lightboxIndex: 0,
        },
        {
          key: "m-after",
          label: "After — new site",
          src: run.screenshots.newMobile,
          lightboxIndex: 1,
        },
      ],
    },
    {
      title: "Desktop",
      tiles: [
        {
          key: "d-before",
          label: "Before — current site",
          src: run.screenshots.currentDesktop,
          lightboxIndex: 2,
        },
        {
          key: "d-after",
          label: "After — new site",
          src: run.screenshots.newDesktop,
          lightboxIndex: 3,
        },
      ],
    },
  ];
}

function ScreenshotTile({
  tile,
  copyingKey,
  onCopy,
  onView,
}: {
  tile: TileDef;
  copyingKey: string | null;
  onCopy: (src: string, key: string) => void;
  onView: (index: 0 | 1 | 2 | 3) => void;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
      <button
        type="button"
        onClick={() => onView(tile.lightboxIndex)}
        className="flex min-h-[160px] w-full items-center justify-center border-0 bg-zinc-100 p-2 dark:bg-zinc-800/70"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tile.src}
          alt={tile.label}
          className="max-h-52 w-full cursor-zoom-in object-contain object-center"
        />
      </button>
      <div className="flex flex-col gap-1.5 border-t border-zinc-200 p-2 dark:border-zinc-700">
        <p className="text-[10px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
          {tile.label}
        </p>
        <div className="flex flex-row flex-wrap gap-1.5">
          <button
            type="button"
            disabled={copyingKey === tile.key}
            onClick={() => onCopy(tile.src, tile.key)}
            className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {copyingKey === tile.key ? "Copying…" : "Copy image"}
          </button>
          <button
            type="button"
            onClick={() => onView(tile.lightboxIndex)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}

export function DraftEmailImageSidebar({
  run,
  onOpenLightbox,
}: {
  run: ComparisonRun;
  onOpenLightbox: (index: 0 | 1 | 2 | 3) => void;
}) {
  const [copyingKey, setCopyingKey] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const sections = sectionsForRun(run);

  async function handleCopyImage(src: string, key: string) {
    setCopyError(null);
    setCopyingKey(key);
    try {
      await copyImageToClipboard(src);
    } catch (e) {
      setCopyError(
        e instanceof Error ? e.message : "Could not copy image. Try View, then save.",
      );
    } finally {
      setCopyingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          Screenshots for email
        </p>
        <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          Mobile first, then desktop. Use{" "}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            Copy image
          </span>{" "}
          and paste at the matching line in your draft.
        </p>
      </div>

      {copyError ? (
        <p className="text-[11px] text-red-600 dark:text-red-400" role="alert">
          {copyError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        {sections.map((sec) => (
          <div key={sec.title} className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {sec.title}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {sec.tiles.map((t) => (
                <ScreenshotTile
                  key={t.key}
                  tile={t}
                  copyingKey={copyingKey}
                  onCopy={(src, key) => void handleCopyImage(src, key)}
                  onView={onOpenLightbox}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
