export function TokenChips({ tokens, highlight }: { tokens: string[]; highlight?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tokens.map((tok, i) => (
        <span
          key={i}
          className={`px-2 py-1 rounded-md text-xs font-mono border ${
            i === highlight
              ? "bg-cyan-500/20 border-cyan-500 text-cyan-200"
              : "bg-neutral-900 border-neutral-800 text-neutral-300"
          }`}
        >
          {tok}
        </span>
      ))}
    </div>
  );
}
