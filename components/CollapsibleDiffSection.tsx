export function CollapsibleDiffSection({
  title,
  items,
  defaultOpen = false,
}: {
  title: string;
  items: string[];
  /** Native `<details>` open attribute */
  defaultOpen?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <details
      className="group rounded-lg border border-zinc-200 dark:border-zinc-800"
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none px-2.5 py-2 text-xs font-medium text-zinc-900 marker:content-none dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-nowrap items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate font-semibold">{title}</span>
          <span className="flex shrink-0 items-center gap-1 text-zinc-500 dark:text-zinc-400">
            <span className="whitespace-nowrap tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
              {items.length} change{items.length === 1 ? "" : "s"}
            </span>
            <span className="inline-block shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180">
              ▾
            </span>
          </span>
        </span>
      </summary>
      <div className="border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <ul className="list-disc space-y-1.5 pl-4 text-sm text-zinc-700 dark:text-zinc-300">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
