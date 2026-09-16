export type VllmPieceId = "scheduling" | "memory" | "prefix-cache" | "speculative-decoding";

const PIECES: { id: VllmPieceId; label: string }[] = [
  { id: "scheduling", label: "Continuous Batching" },
  { id: "memory", label: "PagedAttention" },
  { id: "prefix-cache", label: "Prefix Caching" },
  { id: "speculative-decoding", label: "Speculative Decoding" },
];

/** Requests → [vLLM: the four mechanisms] → GPU. Same dim/highlight pill
 * technique every other GenAI Systems/Evaluation/Inference diagram uses.
 * "Continuous Batching" is included for the map even though its own deep
 * dive is the next Unit, not this one — dimmed by default via `highlight`
 * on Steps that aren't about it, same as every other piece.
 * The 4 pieces render as a 2×2 grid, not a single left-to-right row: a
 * user read a single row inside a box already flanked by real left-to-right
 * arrows (Requests → vLLM → GPU) as implying the 4 pieces run in that same
 * sequence, which they don't — they're independent techniques vLLM applies
 * together, not pipeline stages. A grid breaks that reading-order cue. */
export function VllmDiagram({ highlight }: { highlight?: VllmPieceId[] }) {
  const noHighlight = !highlight || highlight.length === 0;
  const active = (id: VllmPieceId) => noHighlight || highlight!.includes(id);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span className="px-3 py-2 rounded-md border border-neutral-200 bg-white text-sm font-medium whitespace-nowrap">
        Requests
      </span>
      <span className="text-neutral-300">→</span>
      <div className="rounded-lg border border-cyan-300 bg-cyan-50/40 p-2">
        <div className="text-sm text-cyan-700 font-medium mb-1.5 text-center">vLLM</div>
        <div className="grid grid-cols-2 gap-1.5">
          {PIECES.map((p) => (
            <span
              key={p.id}
              className={`px-2.5 py-1.5 rounded-full border text-sm font-medium text-center ${
                active(p.id) ? "border-cyan-600 bg-white text-cyan-800" : "border-neutral-200 bg-white text-neutral-400"
              }`}
            >
              {p.label}
            </span>
          ))}
        </div>
      </div>
      <span className="text-neutral-300">→</span>
      <span className="px-3 py-2 rounded-md border border-neutral-200 bg-white text-sm font-medium whitespace-nowrap">
        GPU
      </span>
    </div>
  );
}
