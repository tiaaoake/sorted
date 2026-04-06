export function ScreenshotPanel({
  label,
  pageUrl,
  src,
  alt,
  onImageClick,
  showLabel = true,
  /** Full screenshot visible (like background-size: contain) — e.g. mobile review column. */
  fitContained = false,
}: {
  label: string;
  /** Live page URL shown next to the label (opens in a new tab). */
  pageUrl?: string;
  src: string;
  alt: string;
  /** Opens fullscreen preview when set (e.g. comparison lightbox). */
  onImageClick?: () => void;
  /** When false, only the image area is rendered (e.g. embedded in review columns). */
  showLabel?: boolean;
  fitContained?: boolean;
}) {
  return (
    <div
      className={`flex min-h-0 flex-col gap-2 ${showLabel ? "" : "h-full min-h-0 flex-1"}`}
    >
      {showLabel ? (
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <h2 className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {label}
          </h2>
          {pageUrl ? (
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={pageUrl}
              className="min-w-0 truncate text-xs font-normal normal-case text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200 dark:hover:decoration-zinc-400"
            >
              {pageUrl}
            </a>
          ) : null}
        </div>
      ) : null}
      <div
        className={`relative flex min-h-[200px] flex-1 items-center justify-center overflow-auto ${
          showLabel
            ? "rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950"
            : "min-h-0 h-full max-h-full rounded-none border-0 bg-transparent dark:bg-transparent"
        }`}
      >
        {onImageClick ? (
          <button
            type="button"
            onClick={onImageClick}
            className={`group cursor-zoom-in border-0 bg-transparent p-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 ${
              fitContained
                ? "flex h-full min-h-0 w-full max-w-full flex-1 items-center justify-center"
                : `flex w-full flex-col items-stretch ${
                    showLabel ? "max-h-[70vh]" : "max-h-full min-h-0 flex-1"
                  }`
            }`}
            aria-label={`View ${label} screenshot fullscreen`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className={`pointer-events-none object-contain transition-opacity group-hover:opacity-95 ${
                fitContained
                  ? "max-h-full max-w-full object-center"
                  : `w-full object-top ${
                      showLabel ? "max-h-[70vh]" : "max-h-full"
                    }`
              }`}
            />
          </button>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={alt}
            className={
              fitContained
                ? "max-h-full max-w-full object-contain object-center"
                : `w-full object-contain object-top ${
                    showLabel ? "max-h-[70vh]" : "max-h-full"
                  }`
            }
          />
        )}
      </div>
    </div>
  );
}
