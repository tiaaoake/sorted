"use client";

import { useState } from "react";
import { buildMasterLovablePrompt } from "@/lib/prompt/masterLovablePrompt";
import { tryValidateReferenceUrl } from "@/lib/validateUrl";

export function MasterPromptCopyCard() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const labelCls =
    "mb-0.5 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400";
  const inputCls =
    "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

  async function handleCopy() {
    setError(null);
    const v = tryValidateReferenceUrl(url);
    if (!v.ok) {
      setError(v.error);
      return;
    }
    try {
      await navigator.clipboard.writeText(buildMasterLovablePrompt(v.href));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setError("Could not copy to clipboard");
    }
  }

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-3.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="masterPromptUrl" className={labelCls}>
            Reference website URL
          </label>
          <input
            id="masterPromptUrl"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://example.com"
            className={inputCls}
            autoComplete="url"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {copied ? "Copied" : "Copy master prompt"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
