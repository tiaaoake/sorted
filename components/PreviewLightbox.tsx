"use client";

import { useCallback, useEffect } from "react";

export type PreviewSlide = {
  src: string;
  alt: string;
  label: string;
};

export function PreviewLightbox({
  open,
  onClose,
  slides,
  index,
  onIndexChange,
}: {
  open: boolean;
  onClose: () => void;
  slides: PreviewSlide[];
  index: number;
  onIndexChange: (i: number) => void;
}) {
  const go = useCallback(
    (delta: -1 | 1) => {
      if (slides.length === 0) return;
      onIndexChange((index + delta + slides.length) % slides.length);
    },
    [index, slides.length, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || slides.length === 0) return null;

  const slide = slides[Math.min(index, slides.length - 1)]!;
  const showArrows = slides.length > 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition hover:bg-white/20"
        aria-label="Close fullscreen"
      >
        ×
      </button>

      {showArrows ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-4 sm:h-14 sm:w-14"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-4 sm:h-14 sm:w-14"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      ) : null}

      <div
        className="relative z-10 flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-center text-sm font-medium text-white/90">
          {slide.label}
          {showArrows ? (
            <span className="ml-2 text-white/50">
              ({index + 1} / {slides.length})
            </span>
          ) : null}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.src}
          alt={slide.alt}
          className="max-h-[85vh] max-w-full object-contain object-top shadow-2xl"
        />
        {showArrows ? (
          <p className="text-center text-xs text-white/45">
            Arrow keys to switch · Escape to close
          </p>
        ) : null}
      </div>
    </div>
  );
}
