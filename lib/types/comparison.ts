import { z } from "zod";

export const navLinkSchema = z.object({
  text: z.string(),
  href: z.string(),
});

export const headingSchema = z.object({
  level: z.number(),
  text: z.string(),
});

export const buttonLinkSchema = z.object({
  text: z.string(),
  href: z.string().optional(),
});

export const heroCandidatesSchema = z.object({
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  ctaTexts: z.array(z.string()),
});

export const sectionOutlineSchema = z.object({
  mainChildCount: z.number(),
  sectionCount: z.number(),
  articleCount: z.number(),
  hasMainLandmark: z.boolean(),
  hasNavLandmark: z.boolean(),
});

export const headerChromeSchemeSchema = z.enum([
  "dark_bar_light_text",
  "light_bar_dark_text",
  "unclear",
]);

export const visualSignalsSchema = z.object({
  bodyBackgroundIsImage: z.boolean(),
  heroBackgroundIsImage: z.boolean(),
  sampledColors: z.array(z.string()),
  hasCarouselMarkers: z.boolean(),
  largeImageCountAboveFold: z.number(),
  /** Heuristic: header background vs first nav link text luminance. */
  headerChromeScheme: headerChromeSchemeSchema.default("unclear"),
});

/** Heuristic: nested lists, ARIA flyouts, or disclosure menus in nav/header. */
export const navMenuSignalsSchema = z.object({
  submenuParentCount: z.number(),
  flyoutOrMenuTriggerCount: z.number(),
  detailsMenuCount: z.number(),
});

export const pageDataSchema = z.object({
  url: z.string(),
  title: z.string(),
  metaDescription: z.string(),
  navLinks: z.array(navLinkSchema),
  headings: z.array(headingSchema),
  buttonsAndLinks: z.array(buttonLinkSchema),
  heroCandidates: heroCandidatesSchema,
  footerSnippet: z.string(),
  sectionOutline: sectionOutlineSchema,
  visualSignals: visualSignalsSchema,
  visibleTextSample: z.string(),
  navMenuSignals: navMenuSignalsSchema.default({
    submenuParentCount: 0,
    flyoutOrMenuTriggerCount: 0,
    detailsMenuCount: 0,
  }),
});

export const findingsSchema = z.object({
  summary: z.array(z.string()),
  visual: z.array(z.string()),
  text: z.array(z.string()),
  structural: z.array(z.string()),
  missing: z.array(z.string()),
  improved: z.array(z.string()),
  rawNotes: z.array(z.string()).optional(),
});

export const visualDiffSeveritySchema = z.enum(["low", "medium", "high"]);

export const visualDiffSectionSchema = z.object({
  sectionIndex: z.number().int().nonnegative(),
  startYRatio: z.number().min(0).max(1),
  endYRatio: z.number().min(0).max(1),
  changedPixelRatio: z.number().min(0).max(1),
  severity: visualDiffSeveritySchema,
});

export const visualDiffGuideSchema = z.object({
  mode: z.enum(["fullPage", "stitched"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Full PNG height for current capture; bands use `height` = min(current, new). */
  currentPngHeight: z.number().int().positive().optional(),
  /** Full PNG height for new capture. */
  newPngHeight: z.number().int().positive().optional(),
  sectionCount: z.number().int().positive(),
  sections: z.array(visualDiffSectionSchema),
});

export const comparisonRunSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  currentUrl: z.string(),
  newUrl: z.string(),
  screenshots: z.object({
    currentDesktop: z.string(),
    newDesktop: z.string(),
    currentMobile: z.string(),
    newMobile: z.string(),
  }),
  currentPageData: pageDataSchema,
  newPageData: pageDataSchema,
  findings: findingsSchema,
  generatedPrompt: z.string(),
  /** Reviewer-authored text appended when copying the combined prompt. */
  userPromptAppend: z.string().default(""),
  /** Set when compare was started from the Projects table (example site id). */
  siteKey: z.string().optional(),
  visualDiffGuide: z
    .object({
      desktop: visualDiffGuideSchema.optional(),
      mobile: visualDiffGuideSchema.optional(),
    })
    .optional(),
});

export type NavLink = z.infer<typeof navLinkSchema>;
export type Heading = z.infer<typeof headingSchema>;
export type ButtonLink = z.infer<typeof buttonLinkSchema>;
export type HeroCandidates = z.infer<typeof heroCandidatesSchema>;
export type SectionOutline = z.infer<typeof sectionOutlineSchema>;
export type VisualSignals = z.infer<typeof visualSignalsSchema>;
export type NavMenuSignals = z.infer<typeof navMenuSignalsSchema>;
export type PageData = z.infer<typeof pageDataSchema>;
export type Findings = z.infer<typeof findingsSchema>;
export type VisualDiffSeverity = z.infer<typeof visualDiffSeveritySchema>;
export type VisualDiffSection = z.infer<typeof visualDiffSectionSchema>;
export type VisualDiffGuide = z.infer<typeof visualDiffGuideSchema>;
export type ComparisonRun = z.infer<typeof comparisonRunSchema>;
