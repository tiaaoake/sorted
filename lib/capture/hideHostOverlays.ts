import type { Page } from "playwright";

/**
 * Best-effort: hide third-party preview chrome (e.g. Lovable “Edit with Lovable”)
 * so comparison screenshots match what a normal visitor sees.
 *
 * Hosts may change markup; this uses loose heuristics and is safe to no-op.
 */
export async function hideHostPlatformOverlays(page: Page): Promise<void> {
  await page
    .evaluate(() => {
      const styleTagId = "sorted-capture-hide-host-overlays";
      if (!document.getElementById(styleTagId)) {
        const style = document.createElement("style");
        style.id = styleTagId;
        style.textContent = `
          /* Lovable / similar floating CTAs — attribute & class guesses */
          [class*="LovableBadge" i],
          [class*="lovable-badge" i],
          [class*="lovable_banner" i],
          [data-lovable-edit-banner],
          iframe[src*="lovable.app"][src*="embed" i] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `;
        document.documentElement.appendChild(style);
      }

      function hide(el: Element | null) {
        if (!(el instanceof HTMLElement)) return;
        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
      }

      document.querySelectorAll('a[href*="lovable.app"]').forEach((a) => {
        const t = (a.textContent || "").toLowerCase();
        if (!t.includes("lovable")) return;
        if (!/edit|open in/i.test(t)) return;
        let n: Element | null = a;
        for (let d = 0; d < 8 && n; d++) {
          const st = window.getComputedStyle(n as HTMLElement);
          if (st.position === "fixed" || st.position === "sticky") {
            hide(n);
            return;
          }
          n = n.parentElement;
        }
        hide(a);
      });

      document.querySelectorAll("a, button, span, div, p").forEach((el) => {
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (text.length > 56) return;
        if (!/edit\s+with\s+lovable/i.test(text)) return;
        const r = el.getBoundingClientRect();
        if (r.width > 360 || r.height > 100) return;
        let n: Element | null = el;
        for (let d = 0; d < 10 && n; d++) {
          const st = window.getComputedStyle(n as HTMLElement);
          if (st.position === "fixed" || st.position === "sticky") {
            hide(n);
            return;
          }
          n = n.parentElement;
        }
        hide(el);
      });
    })
    .catch(() => {
      /* ignore */
    });
}

/** Best-effort deterministic capture prep to reduce diff noise. */
export async function normalizePageForDeterministicCapture(
  page: Page,
): Promise<void> {
  await page
    .evaluate(() => {
      const styleTagId = "sorted-capture-deterministic-style";
      if (!document.getElementById(styleTagId)) {
        const style = document.createElement("style");
        style.id = styleTagId;
        style.textContent = `
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            caret-color: transparent !important;
          }
          video, audio {
            animation: none !important;
          }
        `;
        document.documentElement.appendChild(style);
      }

      document.querySelectorAll("video, audio").forEach((el) => {
        if (!(el instanceof HTMLMediaElement)) return;
        try {
          el.pause();
          el.currentTime = 0;
        } catch {
          /* ignore */
        }
      });

      const overlaySelectors = [
        '[id*="cookie" i]',
        '[class*="cookie" i]',
        '[id*="consent" i]',
        '[class*="consent" i]',
        '[id*="chat" i]',
        '[class*="chat" i]',
        '[class*="intercom" i]',
        '[class*="hubspot" i]',
      ];

      for (const sel of overlaySelectors) {
        document.querySelectorAll(sel).forEach((el) => {
          if (!(el instanceof HTMLElement)) return;
          const st = window.getComputedStyle(el);
          if (st.position !== "fixed" && st.position !== "sticky") return;
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("pointer-events", "none", "important");
        });
      }
    })
    .catch(() => {
      /* ignore */
    });
}
