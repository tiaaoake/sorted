"use client";

import { useMemo, useState } from "react";

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

type Stage = "shot" | "favicon" | "letter";

/**
 * Small visual for a site row: last capture desktop (if run exists), else favicon.
 */
export function SitePreviewThumbnail({
  label,
  currentSiteUrl,
  runId,
  cacheBust,
  sizeClassName = "h-12 w-12",
}: {
  label: string;
  currentSiteUrl: string;
  runId?: string;
  /** e.g. updatedAt so refreshed captures reload the image */
  cacheBust?: string;
  sizeClassName?: string;
}) {
  const host = hostnameFromUrl(currentSiteUrl);
  const faviconUrl = host
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`
    : "";

  const [stage, setStage] = useState<Stage>(() =>
    runId ? "shot" : faviconUrl ? "favicon" : "letter",
  );

  const shotSrc = useMemo(() => {
    if (!runId) return null;
    const q = cacheBust ? `?t=${encodeURIComponent(cacheBust)}` : "";
    return `/data/runs/${runId}/current-desktop.png${q}`;
  }, [runId, cacheBust]);

  const src = useMemo(() => {
    if (stage === "shot" && shotSrc) return shotSrc;
    if (stage === "favicon" && faviconUrl) return faviconUrl;
    return null;
  }, [stage, shotSrc, faviconUrl]);

  return (
    <div
      className={`${sizeClassName} shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800`}
      title={host || label}
    >
      {stage === "letter" || !src ? (
        <div className="flex h-full w-full items-center justify-center bg-zinc-200 text-[10px] font-semibold leading-none text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {label.slice(0, 1).toUpperCase()}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="h-full w-full object-cover object-top"
          onError={() => {
            if (stage === "shot" && faviconUrl) setStage("favicon");
            else setStage("letter");
          }}
        />
      )}
    </div>
  );
}
