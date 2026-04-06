import type { Page } from "playwright";
import { pageDataSchema, type PageData } from "@/lib/types/comparison";

/**
 * In-browser extraction (single evaluate). Helper names mirror lib/extract/* conceptually.
 */
export async function extractPageData(page: Page): Promise<PageData> {
  const raw = await page.evaluate(() => {
    const MAX_SAMPLE = 12_000;

    function norm(s: string): string {
      return s.replace(/\s+/g, " ").trim();
    }

    function isVisible(el: Element | null): el is HTMLElement {
      if (!el || !(el instanceof HTMLElement)) return false;
      const st = window.getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden") return false;
      const op = parseFloat(st.opacity);
      if (Number.isFinite(op) && op === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }

    function toAbsHref(href: string): string {
      try {
        return new URL(href, window.location.href).href;
      } catch {
        return href;
      }
    }

    function rgbToHex(rgb: string): string | null {
      const m = rgb.match(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
      );
      if (!m) return null;
      const r = Number(m[1]);
      const g = Number(m[2]);
      const b = Number(m[3]);
      const hx = (n: number) => n.toString(16).padStart(2, "0");
      return `#${hx(r)}${hx(g)}${hx(b)}`;
    }

    function sampleColor(
      el: Element | null | undefined,
      prop: "color" | "backgroundColor",
    ): string | null {
      if (!el) return null;
      const v = window.getComputedStyle(el)[prop];
      return rgbToHex(v);
    }

    function bgIsImage(el: Element | null): boolean {
      if (!el) return false;
      const bi = window.getComputedStyle(el).backgroundImage;
      return Boolean(bi && bi !== "none" && bi.includes("url("));
    }

    // --- extractNav (conceptual) ---
    const navSeen = new Set<string>();
    const navLinks: { text: string; href: string }[] = [];
    document.querySelectorAll("nav a[href], header a[href]").forEach((a) => {
      if (!isVisible(a)) return;
      const href = toAbsHref((a as HTMLAnchorElement).href);
      if (navSeen.has(href)) return;
      navSeen.add(href);
      const text = norm(a.textContent || "");
      if (text.length > 0 && text.length < 120) navLinks.push({ text, href });
    });

    // --- extractHeadings ---
    const headings: { level: number; text: string }[] = [];
    for (let level = 1; level <= 6; level++) {
      document.querySelectorAll(`h${level}`).forEach((h) => {
        if (!isVisible(h)) return;
        const text = norm(h.textContent || "");
        if (text.length > 0) headings.push({ level, text });
      });
    }

    // --- extractCTAs ---
    const ctaSeen = new Set<string>();
    const buttonsAndLinks: { text: string; href?: string }[] = [];

    function addCta(text: string, href?: string) {
      const key = `${text}|${href ?? ""}`;
      if (ctaSeen.has(key)) return;
      ctaSeen.add(key);
      buttonsAndLinks.push(href ? { text, href } : { text });
    }

    document.querySelectorAll("button, [role='button']").forEach((el) => {
      if (!isVisible(el)) return;
      const text = norm(el.textContent || "");
      if (text.length > 0 && text.length < 80) addCta(text);
    });

    for (const a of document.querySelectorAll("a[href]")) {
      if (buttonsAndLinks.length >= 60) break;
      if (!isVisible(a)) continue;
      const text = norm(a.textContent || "");
      if (text.length === 0 || text.length >= 80) continue;
      addCta(text, toAbsHref((a as HTMLAnchorElement).href));
    }

    // --- hero candidates ---
    const h1 = Array.from(document.querySelectorAll("h1")).find(isVisible);
    let headline: string | undefined;
    let subheadline: string | undefined;
    const ctaTexts: string[] = [];
    if (h1) {
      headline = norm(h1.textContent || "");
      let sib = h1.nextElementSibling;
      let hops = 0;
      while (sib && hops < 4) {
        if (isVisible(sib)) {
          const tag = sib.tagName.toLowerCase();
          if (tag === "p" || tag === "h2" || tag === "h3") {
            const t = norm(sib.textContent || "");
            if (t.length > 12 && t.length < 400) {
              subheadline = t;
              break;
            }
          }
        }
        sib = sib.nextElementSibling;
        hops++;
      }
      const heroTop = h1.getBoundingClientRect().top;
      document.querySelectorAll("a[href], button").forEach((el) => {
        if (!isVisible(el)) return;
        const r = el.getBoundingClientRect();
        if (r.top >= heroTop - 20 && r.bottom <= heroTop + 420) {
          const t = norm(el.textContent || "");
          if (t.length > 0 && t.length < 60 && !ctaTexts.includes(t))
            ctaTexts.push(t);
        }
      });
    }

    // --- footer ---
    const footerEl =
      document.querySelector("footer") ||
      document.querySelector("[role='contentinfo']");
    const footerSnippet = footerEl
      ? norm(footerEl.textContent || "").slice(0, 2000)
      : "";

    // --- section outline ---
    const main = document.querySelector("main");
    const mainEl = main ?? document.body;
    const sectionCount = document.querySelectorAll("section").length;
    const articleCount = document.querySelectorAll("article").length;

    // --- detectSlider / carousel markers ---
    const carouselSelectors =
      ".swiper,[class*='swiper'],[class*='carousel'],[id*='carousel'],[class*='slick'],[id*='slider'],[class*='slider']";
    const hasCarouselMarkers = Boolean(
      document.querySelector(carouselSelectors),
    );

    // --- hero / visual ---
    const heroEl =
      document.querySelector("[class*='hero'], [id*='hero']") ||
      document.querySelector("header") ||
      mainEl?.firstElementChild;

    const body = document.body;
    const header = document.querySelector("header");

    function parseRgb(cssVal: string): { r: number; g: number; b: number } | null {
      const m = cssVal.match(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i,
      );
      if (!m) return null;
      const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
      if (!Number.isFinite(a) || a < 0.15) return null;
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
    }

    function relLumChannel(c: number) {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    function relativeLuminance(rgb: { r: number; g: number; b: number }) {
      return (
        0.2126 * relLumChannel(rgb.r) +
        0.7152 * relLumChannel(rgb.g) +
        0.0722 * relLumChannel(rgb.b)
      );
    }

    let headerChromeScheme:
      | "dark_bar_light_text"
      | "light_bar_dark_text"
      | "unclear" = "unclear";
    if (header && isVisible(header)) {
      const bgRgb = parseRgb(window.getComputedStyle(header).backgroundColor);
      const linkEl = header.querySelector("nav a[href], a[href]");
      const navLink =
        linkEl && isVisible(linkEl)
          ? linkEl
          : document.querySelector("nav a[href]");
      const fgRgb =
        navLink && isVisible(navLink)
          ? parseRgb(window.getComputedStyle(navLink).color)
          : null;
      if (bgRgb && fgRgb) {
        const Lbg = relativeLuminance(bgRgb);
        const Lfg = relativeLuminance(fgRgb);
        if (Lbg < 0.4 && Lfg > 0.55) headerChromeScheme = "dark_bar_light_text";
        else if (Lbg > 0.55 && Lfg < 0.42)
          headerChromeScheme = "light_bar_dark_text";
      }
    }

    const sampledColors: string[] = [];
    const pushColor = (c: string | null) => {
      if (c && !sampledColors.includes(c)) sampledColors.push(c);
    };
    pushColor(sampleColor(body, "color"));
    pushColor(sampleColor(body, "backgroundColor"));
    pushColor(sampleColor(header, "backgroundColor"));
    pushColor(sampleColor(h1, "color"));
    const firstBtn = Array.from(
      document.querySelectorAll("button, a[class*='btn'], a.button"),
    ).find(isVisible);
    pushColor(sampleColor(firstBtn, "backgroundColor"));

    let largeImageCountAboveFold = 0;
    const fold = window.innerHeight;
    document.querySelectorAll("img").forEach((img) => {
      if (!isVisible(img)) return;
      const r = img.getBoundingClientRect();
      if (r.top < fold && r.width >= 120 && r.height >= 120)
        largeImageCountAboveFold++;
    });

    const metaDesc =
      document.querySelector("meta[name='description']")?.getAttribute(
        "content",
      ) || "";

    const visibleTextSample = norm(document.body?.innerText || "").slice(
      0,
      MAX_SAMPLE,
    );

    // --- nav menu / dropdown heuristics (nav + header-only menus) ---
    const navMenuRoots: Element[] = [];
    document.querySelectorAll("nav, [role='navigation']").forEach((el) => {
      navMenuRoots.push(el);
    });
    if (navMenuRoots.length === 0) {
      const h = document.querySelector("header");
      if (h) navMenuRoots.push(h);
    }

    let submenuParentCount = 0;
    const countedLi = new Set<Element>();
    for (const root of navMenuRoots) {
      root.querySelectorAll("li").forEach((li) => {
        if (!isVisible(li)) return;
        const directList = li.querySelector(":scope > ul, :scope > ol");
        if (directList && !countedLi.has(li)) {
          countedLi.add(li);
          submenuParentCount++;
        }
      });
    }

    let flyoutOrMenuTriggerCount = 0;
    const countedTriggers = new Set<Element>();
    for (const root of navMenuRoots) {
      root
        .querySelectorAll(
          "button[aria-expanded], [aria-haspopup='true'], [aria-haspopup='menu'], [data-toggle='dropdown'], [data-bs-toggle='dropdown']",
        )
        .forEach((el) => {
          if (!isVisible(el)) return;
          if (!countedTriggers.has(el)) {
            countedTriggers.add(el);
            flyoutOrMenuTriggerCount++;
          }
        });
    }

    let detailsMenuCount = 0;
    for (const root of navMenuRoots) {
      root.querySelectorAll("details").forEach((d) => {
        if (isVisible(d)) detailsMenuCount++;
      });
    }

    return {
      url: window.location.href,
      title: norm(document.title || ""),
      metaDescription: norm(metaDesc),
      navLinks,
      headings,
      buttonsAndLinks: buttonsAndLinks.slice(0, 50),
      heroCandidates: {
        headline,
        subheadline,
        ctaTexts: ctaTexts.slice(0, 8),
      },
      footerSnippet,
      sectionOutline: {
        mainChildCount: mainEl?.children.length ?? 0,
        sectionCount,
        articleCount,
        hasMainLandmark: Boolean(main),
        hasNavLandmark: Boolean(document.querySelector("nav")),
      },
      visualSignals: {
        bodyBackgroundIsImage: bgIsImage(body),
        heroBackgroundIsImage: bgIsImage(heroEl),
        sampledColors: sampledColors.slice(0, 8),
        hasCarouselMarkers,
        largeImageCountAboveFold,
        headerChromeScheme,
      },
      visibleTextSample,
      navMenuSignals: {
        submenuParentCount,
        flyoutOrMenuTriggerCount,
        detailsMenuCount,
      },
    };
  });

  const parsed = pageDataSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `PageData validation failed: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
