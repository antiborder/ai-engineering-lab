export function NextTokenBars({
  predictions,
}: {
  predictions: { token: string; prob: number }[];
}) {
  const top = predictions.slice(0, 6);
  const maxProb = Math.max(...top.map((p) => p.prob), 0.001);

  return (
    <div className="space-y-1.5">
      {top.map((p) => (
        <div key={p.token} className="flex items-center gap-2 text-xs">
          <span className="w-16 shrink-0 font-mono text-neutral-600 truncate">{p.token}</span>
          <div className="flex-1 h-4 bg-neutral-200 rounded overflow-hidden">
            <div
              className="h-full bg-cyan-600"
              style={{ width: `${(p.prob / maxProb) * 100}%` }}
            />
          </div>
          <span className="w-12 text-right text-neutral-500 tabular-nums">
            {(p.prob * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}
