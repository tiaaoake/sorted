"use client";

type ViewMode = "desktop" | "mobile";

export function ViewToggle({
  mode,
  onChange,
  size = "default",
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  size?: "default" | "compact";
}) {
  const base =
    size === "compact"
      ? "rounded-md px-2 py-1 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      : "rounded-md px-3 py-1.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400";
  const active =
    "bg-zinc-900 text-white shadow dark:bg-zinc-100 dark:text-zinc-900";
  const idle =
    "text-zinc-600 hover:bg-zinc-200/80 dark:text-zinc-400 dark:hover:bg-zinc-800";

  return (
    <div
      className={`inline-flex gap-1 rounded-lg border border-zinc-200 bg-zinc-100/80 dark:border-zinc-700 dark:bg-zinc-900/80 ${size === "compact" ? "p-0.5" : "p-1"}`}
      role="group"
      aria-label="Viewport"
    >
      <button
        type="button"
        className={`${base} ${mode === "desktop" ? active : idle}`}
        onClick={() => onChange("desktop")}
        aria-pressed={mode === "desktop"}
      >
        Desktop
      </button>
      <button
        type="button"
        className={`${base} ${mode === "mobile" ? active : idle}`}
        onClick={() => onChange("mobile")}
        aria-pressed={mode === "mobile"}
      >
        Mobile
      </button>
    </div>
  );
}
