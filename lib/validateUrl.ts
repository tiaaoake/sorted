import { z } from "zod";

const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .superRefine((val, ctx) => {
    let parsed: URL;
    try {
      parsed = new URL(val);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid URL" });
      return;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        message: "Only http and https URLs are allowed",
      });
    }
  });

export type ValidatedUrls = { currentUrl: string; newUrl: string };

export function validateComparisonUrls(
  currentRaw: unknown,
  newRaw: unknown,
): ValidatedUrls {
  const currentUrl = httpUrlSchema.parse(
    typeof currentRaw === "string" ? currentRaw : "",
  );
  const newUrl = httpUrlSchema.parse(
    typeof newRaw === "string" ? newRaw : "",
  );
  return { currentUrl, newUrl };
}

export function tryValidateReferenceUrl(
  raw: unknown,
): { ok: true; href: string } | { ok: false; error: string } {
  const r = httpUrlSchema.safeParse(typeof raw === "string" ? raw : "");
  if (!r.success) {
    return {
      ok: false,
      error: r.error.issues[0]?.message ?? "Invalid URL",
    };
  }
  return { ok: true, href: new URL(r.data).href };
}

/** Normalized `href` for a single http(s) URL. Throws Error if invalid. */
export function validateReferenceUrl(raw: unknown): string {
  const t = tryValidateReferenceUrl(raw);
  if (!t.ok) throw new Error(t.error);
  return t.href;
}
