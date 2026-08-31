export interface ScoredChunk {
  label: string;
  score: number;
  rerankScore?: number;
}

/** Ranked bar chart of chunk scores — same visual language as NextTokenBars
 * (Fundamentals) and ConstrainedDecodingDiagram (Structured Output), reused
 * here for retrieval. Bars sort by rerankScore when present, otherwise by
 * score. `topK`/`threshold` dim out chunks that wouldn't make the cut,
 * matching backend/app/genai/rag.py's retrieve()'s own pool + threshold
 * logic. */
export function SimilarityBars({
  chunks,
  topK,
  threshold,
}: {
  chunks: ScoredChunk[];
  topK?: number;
  threshold?: number;
}) {
  const sorted = [...chunks].sort((a, b) => (b.rerankScore ?? b.score) - (a.rerankScore ?? a.score));
  const maxScore = Math.max(...sorted.map((c) => c.rerankScore ?? c.score), 0.001);

  return (
    <div className="space-y-1.5">
      {sorted.map((c, i) => {
        const displayScore = c.rerankScore ?? c.score;
        const passesThreshold = threshold === undefined || c.score >= threshold;
        const withinTopK = topK === undefined || i < topK;
        const active = passesThreshold && withinTopK;
        return (
          <div key={c.label} className={`flex items-center gap-2 text-xs ${active ? "" : "opacity-30"}`}>
            <span className="w-32 shrink-0 truncate text-neutral-700 font-mono">{c.label}</span>
            <div className="flex-1 h-4 bg-neutral-200 rounded overflow-hidden">
              <div className="h-full bg-cyan-600" style={{ width: `${(displayScore / maxScore) * 100}%` }} />
            </div>
            <span className="w-12 text-right text-neutral-500 tabular-nums">{displayScore.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}
