"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { runComparison, type CompareResult } from "@/app/actions/compare";

export type CompareFormProps = {
  defaultCurrentUrl?: string;
  defaultNewUrl?: string;
};

export function CompareForm({
  defaultCurrentUrl = "",
  defaultNewUrl = "",
}: CompareFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const r: CompareResult = await runComparison(fd);
    setPending(false);
    if (r.success) {
      router.push(`/review/${r.id}`);
    } else {
      setError(r.error);
    }
  }

  const labelCls =
    "mb-0.5 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400";
  const inputCls =
    "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900 shadow-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-3.5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="currentUrl" className={labelCls}>
            Current URL
          </label>
          <input
            id="currentUrl"
            name="currentUrl"
            type="url"
            required
            defaultValue={defaultCurrentUrl}
            placeholder="https://example.com"
            className={inputCls}
          />
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor="newUrl" className={labelCls}>
            New URL
          </label>
          <input
            id="newUrl"
            name="newUrl"
            type="url"
            required
            defaultValue={defaultNewUrl}
            placeholder="https://staging.example.com"
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full shrink-0 rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-end dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "Comparing…" : "Compare"}
        </button>
      </div>
      {error ? (
        <p
          className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </form>
  );
}
