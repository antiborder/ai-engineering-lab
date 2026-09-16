export type ServingStageId = "client" | "server" | "model" | "tokens";

const STAGES: { id: ServingStageId; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "server", label: "Inference Server" },
  { id: "model", label: "Model" },
  { id: "tokens", label: "Tokens" },
];

/** The request path spec.txt 19.1 draws as Client → Inference Server →
 * Model → Tokens. Same dim/highlight pill-chain technique every other
 * GenAI Systems / Evaluation diagram uses (see ToolCallFlowDiagram,
 * RagFlowDiagram), so this Unit's Steps can each zoom in on one stage. */
export function ModelServingDiagram({ highlight }: { highlight?: ServingStageId[] }) {
  const noHighlight = !highlight || highlight.length === 0;
  const active = (id: ServingStageId) => noHighlight || highlight!.includes(id);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {STAGES.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1.5">
          <span
            className={`px-3 py-2 rounded-md border text-sm font-medium whitespace-nowrap ${
              active(s.id) ? "border-cyan-600 bg-cyan-50 text-cyan-800" : "border-neutral-200 bg-white text-neutral-400"
            }`}
          >
            {s.label}
          </span>
          {i < STAGES.length - 1 && <span className="text-neutral-300">→</span>}
        </span>
      ))}
    </div>
  );
}
