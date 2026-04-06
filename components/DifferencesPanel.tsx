"use client";

import { useCallback, useState } from "react";
import { saveUserPromptAppend } from "@/app/actions/runPatch";
import { computePassScore } from "@/lib/compare/computePassScore";
import { buildCombinedPrompt } from "@/lib/prompt/combinedPrompt";
import { buildMasterLovablePrompt } from "@/lib/prompt/masterLovablePrompt";
import type { Findings } from "@/lib/types/comparison";
import { tryValidateReferenceUrl } from "@/lib/validateUrl";
import { CollapsibleDiffSection } from "./CollapsibleDiffSection";

export function DifferencesPanel({
  runId,
  findings,
  generatedPrompt,
  initialUserPromptAppend = "",
  referenceSiteUrl,
  compact = false,
  showOnly = "all",
}: {
  runId: string;
  findings: Findings;
  generatedPrompt: string;
  initialUserPromptAppend?: string;
  /** Original / current site URL for the Lovable master redesign brief. */
  referenceSiteUrl?: string;
  /** Tighter padding and type scale for dense sidebars. */
  compact?: boolean;
  /** Split sidebar: suggested diffs only vs prompt copy tools only. */
  showOnly?: "all" | "suggested" | "promptTools";
}) {
  const [custom, setCustom] = useState(initialUserPromptAppend);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [masterCopied, setMasterCopied] = useState(false);
  const [masterError, setMasterError] = useState<string | null>(null);

  const scoreResult = computePassScore(findings);
  const combined = buildCombinedPrompt(generatedPrompt, custom);

  const persist = useCallback(async () => {
    setSaveError(null);
    const r = await saveUserPromptAppend(runId, custom);
    if (!r.ok) setSaveError(r.error);
  }, [runId, custom]);

  async function handleCopy() {
    setSaveError(null);
    const r = await saveUserPromptAppend(runId, custom);
    if (!r.ok) {
      setSaveError(r.error);
      return;
    }
    try {
      await navigator.clipboard.writeText(combined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function handleCopyMasterPrompt() {
    setMasterError(null);
    const v = tryValidateReferenceUrl(referenceSiteUrl ?? "");
    if (!v.ok) {
      setMasterError(v.error);
      return;
    }
    try {
      await navigator.clipboard.writeText(buildMasterLovablePrompt(v.href));
      setMasterCopied(true);
      setTimeout(() => setMasterCopied(false), 2000);
    } catch {
      setMasterCopied(false);
      setMasterError("Could not copy to clipboard");
    }
  }

  const gap = compact ? "gap-2" : "gap-3";
  const cardPad = compact ? "p-3" : "p-4";
  const scorePad = compact ? "px-3 py-2" : "px-4 py-3";
  const scoreNum = compact ? "text-xl" : "text-2xl";
  const scoreDenom = compact ? "text-xs" : "text-sm";
  const h3 = compact
    ? "text-xs font-semibold text-zinc-900 dark:text-zinc-100"
    : "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
  const sectionGap = compact ? "gap-1.5" : "gap-2";
  const diffIntro = compact ? "mt-2" : "mt-3";

  const showScore = showOnly === "all";
  const showSuggested = showOnly === "all" || showOnly === "suggested";
  const showPromptTools = showOnly === "all" || showOnly === "promptTools";

  return (
    <div className={`flex flex-col ${gap}`}>
      {showScore ? (
        <section
          className={`rounded-xl border border-zinc-200 bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-900/40 ${scorePad}`}
          aria-label="Score"
        >
          <p
            className={`font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 ${compact ? "text-[10px]" : "text-xs"}`}
          >
            Score
          </p>
          <p className="mt-0.5 flex items-baseline gap-1 tabular-nums">
            <span
              className={`font-bold text-zinc-900 dark:text-zinc-50 ${scoreNum}`}
            >
              {scoreResult.score}
            </span>
            <span className={`text-zinc-500 dark:text-zinc-400 ${scoreDenom}`}>
              / 100
            </span>
          </p>
        </section>
      ) : null}

      {showPromptTools && referenceSiteUrl ? (
        <section
          className={`flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50 ${cardPad} ${sectionGap}`}
        >
          <h3 className={h3}>Lovable master prompt</h3>
          <p
            className={`leading-relaxed text-zinc-600 dark:text-zinc-400 ${compact ? "text-[10px]" : "text-xs"}`}
          >
            Full redesign brief with the <strong className="font-medium text-zinc-800 dark:text-zinc-200">current</strong>{" "}
            site as the reference URL (same as the homepage tool).
          </p>
          <button
            type="button"
            onClick={() => void handleCopyMasterPrompt()}
            className={`w-full rounded-lg border border-zinc-300 bg-white font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
          >
            {masterCopied ? "Copied" : "Copy master prompt"}
          </button>
          {masterError ? (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {masterError}
            </p>
          ) : null}
        </section>
      ) : null}

      {showSuggested ? (
      <section
        className={`rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50 ${cardPad}`}
      >
        <h3 className={h3}>Suggested changes</h3>
        <p
          className={`mt-0.5 text-zinc-500 dark:text-zinc-400 ${compact ? "text-[10px]" : "text-xs"}`}
        >
          Counts show on each row — expand to read details
        </p>
        <div className={`flex flex-col gap-2 ${diffIntro}`}>
          <CollapsibleDiffSection
            title="Visual differences"
            items={findings.visual}
          />
          <CollapsibleDiffSection
            title="Text differences"
            items={findings.text}
          />
          <CollapsibleDiffSection
            title="Structural differences"
            items={findings.structural}
          />
          <CollapsibleDiffSection
            title="Missing elements"
            items={findings.missing}
          />
          <CollapsibleDiffSection
            title="What improved"
            items={findings.improved}
          />
        </div>
      </section>
      ) : null}

      {showPromptTools ? (
      <>
      <section
        className={`flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/50 ${cardPad} ${compact ? "gap-2" : "gap-3"}`}
      >
        <div>
          <label
            htmlFor="user-prompt-append"
            className={
              compact
                ? "mb-1 block text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                : "mb-1.5 block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            }
          >
            Custom changes
          </label>
          <textarea
            id="user-prompt-append"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={() => void persist()}
            rows={compact ? 4 : 5}
            maxLength={4000}
            placeholder="Your extra instructions (layout, copy, brand)…"
            className={`w-full resize-y rounded-lg border border-zinc-300 bg-white text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 ${compact ? "px-2.5 py-2 text-xs" : "px-3 py-2.5 text-sm"}`}
          />
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className={`w-full rounded-lg bg-zinc-900 font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
        >
          {copied ? "Copied" : "Copy prompt"}
        </button>

        <p
          className={`leading-relaxed text-zinc-500 dark:text-zinc-400 ${compact ? "text-[10px]" : "text-xs"}`}
        >
          Copies the full automated update prompt{" "}
          <strong className="font-medium text-zinc-600 dark:text-zinc-300">
            plus
          </strong>{" "}
          your custom changes above.
        </p>

        {saveError ? (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {saveError}
          </p>
        ) : null}
      </section>

      <details className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-zinc-600 marker:content-none dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            <span>Full automated prompt (reference)</span>
            <span className="text-zinc-400 transition-transform group-open:rotate-180">
              ▾
            </span>
          </span>
        </summary>
        <div className="border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
          <p className="max-h-48 overflow-y-auto text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {generatedPrompt}
          </p>
        </div>
      </details>
      </>
      ) : null}

    </div>
  );
}
