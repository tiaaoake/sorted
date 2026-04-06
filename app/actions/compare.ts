"use server";

import { ZodError } from "zod";
import { launchBrowser } from "@/lib/capture/playwright";
import { captureSite } from "@/lib/capture/screenshot";
import { buildFindings } from "@/lib/compare/buildFindings";
import { computePassScore } from "@/lib/compare/computePassScore";
import { createPromptService } from "@/lib/prompt/promptService";
import { saveRun } from "@/lib/storage/saveRun";
import { setSiteLatest } from "@/lib/storage/siteLatest";
import { validateComparisonUrls } from "@/lib/validateUrl";

export type CompareResult =
  | { success: true; id: string; score: number }
  | { success: false; error: string };

export async function runComparison(formData: FormData): Promise<CompareResult> {
  try {
    const { currentUrl, newUrl } = validateComparisonUrls(
      formData.get("currentUrl"),
      formData.get("newUrl"),
    );

    const siteKeyRaw = formData.get("siteKey");
    const siteKey =
      typeof siteKeyRaw === "string" && siteKeyRaw.trim().length > 0
        ? siteKeyRaw.trim()
        : undefined;

    const browser = await launchBrowser();
    let current;
    let next;
    try {
      current = await captureSite(browser, currentUrl);
      next = await captureSite(browser, newUrl);
    } finally {
      await browser.close();
    }

    const findings = buildFindings(current.pageData, next.pageData);
    const promptSvc = createPromptService();
    const generatedPrompt = await promptSvc.generate(
      findings,
      current.pageData,
      next.pageData,
    );

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await saveRun(
      {
        id,
        createdAt,
        currentUrl,
        newUrl,
        currentPageData: current.pageData,
        newPageData: next.pageData,
        findings,
        generatedPrompt,
        userPromptAppend: "",
        ...(siteKey ? { siteKey } : {}),
      },
      {
        currentDesktop: current.desktopPng,
        newDesktop: next.desktopPng,
        currentMobile: current.mobilePng,
        newMobile: next.mobilePng,
      },
    );

    const score = computePassScore(findings).score;

    if (siteKey) {
      await setSiteLatest(siteKey, {
        runId: id,
        currentUrl,
        newUrl,
      });
    }

    return { success: true, id, score };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        success: false,
        error: e.issues.map((i) => i.message).join("; "),
      };
    }
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}
