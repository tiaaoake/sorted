"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Logical mobile viewport width (CSS px) — iframe is scaled down to fit the column. */
const MOBILE_W = 390;
const MOBILE_H = 820;

/**
 * Live preview that scales the iframe like `object-fit: contain`: the full
 * logical mobile width stays visible without horizontal clipping.
 */
export function MobileLiveIframe({ src, title }: { src: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const pad = 8;
      const sW = Math.max(0, (r.width - pad) / MOBILE_W);
      const sH = Math.max(0, (r.height - pad) / MOBILE_H);
      const raw = Math.min(sW, sH);
      const s = Math.min(1, Math.max(0.2, raw > 0 ? raw : 0.2));
      setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const boxW = MOBILE_W * scale;
  const boxH = MOBILE_H * scale;

  return (
    <div
      ref={wrapRef}
      className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
    >
      <div
        className="shrink-0 overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-900 dark:ring-zinc-700"
        style={{ width: boxW, height: boxH }}
      >
        <iframe
          src={src}
          title={title}
          className="block border-0"
          width={MOBILE_W}
          height={MOBILE_H}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
