"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Fixed “real desktop” viewport width — iframe is scaled down to fit the pane. */
const DESKTOP_W = 1500;
const DESKTOP_H = 1400;

/**
 * Live preview at a fixed desktop width (not a fluid responsive column).
 * Scales like contain so the full 1500px-wide frame stays visible.
 */
export function DesktopLiveIframe({ src, title }: { src: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const pad = 8;
      const sW = (r.width - pad) / DESKTOP_W;
      const sH = (r.height - pad) / DESKTOP_H;
      const s = Math.min(1, Math.max(0.06, Math.min(sW, sH)));
      setScale(s);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const boxW = DESKTOP_W * scale;
  const boxH = DESKTOP_H * scale;

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
          width={DESKTOP_W}
          height={DESKTOP_H}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
