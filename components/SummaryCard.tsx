export function SummaryCard({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <h3 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
        Summary
      </h3>
      <ul className="list-disc space-y-1 pl-4 text-sm text-amber-950/90 dark:text-amber-100/90">
        {lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
