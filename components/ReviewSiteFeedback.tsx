"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveSiteReview } from "@/app/actions/siteReview";
import { reviewStatusUiLabel } from "@/lib/reviewLabels";
import type { ReviewStatus, SiteReviewEntry } from "@/lib/storage/siteReview";

function effectiveDraft(
  siteLatestRunId: string | undefined,
  stored: SiteReviewEntry | undefined,
): { status: ReviewStatus; notes: string } {
  const stale =
    Boolean(siteLatestRunId) &&
    stored?.reviewedRunId != null &&
    stored.reviewedRunId !== siteLatestRunId;
  if (stale) return { status: "empty", notes: "" };
  return {
    status: stored?.status ?? "empty",
    notes: stored?.notes ?? "",
  };
}

export function ReviewSiteFeedback({
  siteKey,
  runId,
  siteLatestRunId,
  initialEntry,
}: {
  siteKey: string;
  runId: string;
  siteLatestRunId: string | undefined;
  initialEntry: SiteReviewEntry | undefined;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(() =>
    effectiveDraft(siteLatestRunId, initialEntry),
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setDraft(effectiveDraft(siteLatestRunId, initialEntry));
  }, [
    siteLatestRunId,
    initialEntry?.status,
    initialEntry?.notes,
    initialEntry?.reviewedRunId,
  ]);

  async function handleSave() {
    setErr(null);
    setSaving(true);
    const r = await saveSiteReview(
      siteKey,
      draft.status,
      draft.notes,
      runId,
    );
    setSaving(false);
    if (r.ok) {
      router.refresh();
    } else {
      setErr(r.error);
    }
  }

  const canPickPassFail = Boolean(siteLatestRunId);
  const warnFailedNoNotes = draft.status === "failed" && !draft.notes.trim();
  const notLatestCapture =
    siteLatestRunId !== undefined && siteLatestRunId !== runId;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/90 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
      {notLatestCapture ? (
        <p
          className="text-[9px] leading-snug text-amber-800 dark:text-amber-200"
          role="status"
        >
          This capture is not the latest for this row — saving ties the review
          to this run id.
        </p>
      ) : null}
      <div>
        <label
          htmlFor="review-site-status"
          className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          Status
        </label>
        <select
          id="review-site-status"
          value={draft.status}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              status: e.target.value as ReviewStatus,
            }))
          }
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="empty">{reviewStatusUiLabel.empty}</option>
          <option value="failed" disabled={!canPickPassFail}>
            {reviewStatusUiLabel.failed}
          </option>
          <option value="passed" disabled={!canPickPassFail}>
            {reviewStatusUiLabel.passed}
          </option>
        </select>
      </div>
      <div>
        <label
          htmlFor="review-site-notes"
          className="mb-0.5 block text-[9px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          Comments
        </label>
        <textarea
          id="review-site-notes"
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          rows={3}
          placeholder="Feedback for redesign…"
          maxLength={4000}
          className="w-full resize-y rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs leading-relaxed text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
      {warnFailedNoNotes ? (
        <p className="text-[9px] text-amber-700 dark:text-amber-300">
          Tip: add notes when marking Failed.
        </p>
      ) : null}
      {err ? (
        <p className="text-[9px] text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="button"
        disabled={saving}
        onClick={() => void handleSave()}
        className="w-full rounded-md bg-zinc-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {saving ? "Saving…" : "Save review"}
      </button>
    </div>
  );
}
