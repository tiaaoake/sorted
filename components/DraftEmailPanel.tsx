"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComparisonRun } from "@/lib/types/comparison";
import {
  buildCustomerEmailDraft,
  EMAIL_IMAGE_PLACEHOLDERS,
  plainTextForClipboard,
} from "@/lib/email/buildCustomerEmailDraft";

export function DraftEmailPanel({ run }: { run: ComparisonRun }) {
  const baseOrigin =
    typeof window !== "undefined" ? window.location.origin : null;

  const freshDraft = useMemo(
    () => buildCustomerEmailDraft(run, { baseOrigin }),
    [run, baseOrigin],
  );

  const [subject, setSubject] = useState(freshDraft.subject);
  const [body, setBody] = useState(freshDraft.plainBody);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    const d = buildCustomerEmailDraft(run, {
      baseOrigin:
        typeof window !== "undefined" ? window.location.origin : null,
    });
    setSubject(d.subject);
    setBody(d.plainBody);
    // Only reset the editor when opening a different comparison run.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid wiping edits on parent re-render
  }, [run.id]);

  async function copyFullEmail() {
    setCopyError(null);
    try {
      await navigator.clipboard.writeText(plainTextForClipboard(subject, body));
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch {
      setCopyError("Could not copy. Check clipboard permissions.");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-zinc-100 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-300/25 dark:bg-white dark:shadow-zinc-950/40">
          <div className="shrink-0 border-b border-zinc-100 pb-4 dark:border-zinc-200">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Subject
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              spellCheck
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Email body
              </p>
              <button
                type="button"
                onClick={() => void copyFullEmail()}
                className="rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-zinc-800"
              >
                {copiedFull ? "Copied" : "Copy subject + body"}
              </button>
            </div>
            {copyError ? (
              <p className="text-xs text-red-600" role="alert">
                {copyError}
              </p>
            ) : null}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck
              className="min-h-[min(55vh,480px)] w-full flex-1 resize-y rounded-md border border-zinc-200 bg-white p-3 text-[13px] leading-relaxed text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
              aria-label="Editable email draft"
            />
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
          Lines like{" "}
          <code className="rounded bg-zinc-200/90 px-1 py-0.5 text-[10px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            {EMAIL_IMAGE_PLACEHOLDERS.mobileBefore}
          </code>{" "}
          mark where to paste from the sidebar — mobile before/after first, then
          desktop. Replace{" "}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            [Name]
          </span>{" "}
          and{" "}
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            [Your name]
          </span>{" "}
          before sending.
        </p>
      </div>
    </div>
  );
}
