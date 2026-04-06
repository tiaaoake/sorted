import type { Browser, Page } from "playwright";
import { extractPageData } from "@/lib/extract/extractPageData";
import type { PageData } from "@/lib/types/comparison";
import { hideHostPlatformOverlays } from "@/lib/capture/hideHostOverlays";
import { DEFAULT_USER_AGENT } from "./playwright";

export const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
export const VIEWPORT_MOBILE = { width: 390, height: 844 };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Best-effort: resolve decode / load for visible images so screenshots aren’t
 * taken on empty placeholders (common on JS-heavy sites like Lovable).
 */
async function waitForVisibleImages(page: Page, budgetMs: number): Promise<void> {
  const start = Date.now();
  await page
    .evaluate(async (deadlineMs) => {
      function isLikelyAboveFoldHeroImage(img: HTMLImageElement): boolean {
        const r = img.getBoundingClientRect();
        if (r.width < 80 || r.height < 80) return false;
        if (r.bottom < 0 || r.top > window.innerHeight) return false;
        return true;
      }

      const imgs = Array.from(document.images).filter(isLikelyAboveFoldHeroImage);
      const perImgMs = Math.min(
        12_000,
        Math.max(3000, deadlineMs / Math.max(1, imgs.length)),
      );

      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              const done = () => resolve();
              if (img.complete && img.naturalWidth > 0) {
                if (typeof img.decode === "function") {
                  img.decode().then(done).catch(done);
                  return;
                }
                done();
                return;
              }
              const t = window.setTimeout(done, perImgMs);
              img.addEventListener(
                "load",
                () => {
                  window.clearTimeout(t);
                  done();
                },
                { once: true },
              );
              img.addEventListener(
                "error",
                () => {
                  window.clearTimeout(t);
                  done();
                },
                { once: true },
              );
            }),
        ),
      );
    }, budgetMs)
    .catch(() => {
      /* page closed or evaluate failed */
    });

  const elapsed = Date.now() - start;
  const remaining = Math.max(0, budgetMs - elapsed);
  if (remaining > 0) {
    await delay(Math.min(remaining, 1500));
  }
}

/**
 * After navigation: `load` + image waits + final paint buffer.
 */
async function waitForCaptureReady(
  page: Page,
  opts: { imageBudgetMs: number; settleMs: number },
): Promise<void> {
  await page.waitForLoadState("load", { timeout: 45_000 }).catch(() => {
    /* some SPAs never settle; domcontentloaded already passed */
  });
  await waitForVisibleImages(page, opts.imageBudgetMs);
  await delay(opts.settleMs);
  await page
    .evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        }),
    )
    .catch(() => {});
}

export type CaptureResult = {
  desktopPng: Buffer;
  mobilePng: Buffer;
  pageData: PageData;
};

/**
 * One navigation per URL: desktop screenshot + extraction, then mobile screenshot.
 */
export async function captureSite(
  browser: Browser,
  url: string,
  settleMsDesktop = 2200,
  settleMsMobile = 1200,
): Promise<CaptureResult> {
  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    userAgent: DEFAULT_USER_AGENT,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 90_000,
    });
    await waitForCaptureReady(page, {
      imageBudgetMs: 18_000,
      settleMs: settleMsDesktop,
    });
    await hideHostPlatformOverlays(page);
    await delay(150);
    const desktopPng = await page.screenshot({ type: "png", fullPage: false });
    const pageData = await extractPageData(page);
    await page.setViewportSize(VIEWPORT_MOBILE);
    await waitForCaptureReady(page, {
      imageBudgetMs: 14_000,
      settleMs: settleMsMobile,
    });
    await hideHostPlatformOverlays(page);
    await delay(150);
    const mobilePng = await page.screenshot({ type: "png", fullPage: false });
    return { desktopPng, mobilePng, pageData };
  } finally {
    await context.close();
  }
}
