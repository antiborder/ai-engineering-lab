export function TokenChips({ tokens, highlight }: { tokens: string[]; highlight?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((tok, i) => (
        <span
          key={i}
          className={`px-2 py-1 rounded-md text-xs font-mono border ${
            i === highlight
              ? "bg-cyan-50 border-cyan-600 text-cyan-700"
              : "bg-white border-neutral-200 text-neutral-400"
          }`}
        >
          {tok}
        </span>
      ))}
    </div>
  );
}
