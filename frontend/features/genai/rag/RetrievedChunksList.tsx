import type { RetrievedChunk } from "../api";

export function RetrievedChunksList({ chunks, reranked }: { chunks: RetrievedChunk[]; reranked: boolean }) {
  if (chunks.length === 0) {
    return <p className="text-sm text-neutral-500">No chunks passed the similarity threshold.</p>;
  }
  const maxScore = Math.max(...chunks.map((c) => (reranked ? c.rerank_score ?? c.score : c.score)), 0.001);

  return (
    <ul className="space-y-2">
      {chunks.map((c, i) => {
        const displayScore = reranked ? c.rerank_score ?? c.score : c.score;
        return (
          <li key={i} className="bg-neutral-900 border border-neutral-800 rounded-md p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-neutral-300 font-medium">
                {c.doc_title} <span className="text-neutral-600">#{c.chunk_index}</span>
              </span>
              <span className="text-neutral-500 font-mono">
                {reranked && (
                  <span className="text-neutral-600 mr-1.5">vector {c.score.toFixed(3)} →</span>
                )}
                {displayScore.toFixed(3)}
              </span>
            </div>
            <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-cyan-500/70"
                style={{ width: `${(displayScore / maxScore) * 100}%` }}
              />
            </div>
            <p className="text-xs text-neutral-400">{c.text}</p>
          </li>
        );
      })}
    </ul>
  );
}
