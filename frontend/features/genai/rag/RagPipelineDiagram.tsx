interface PipelineStage {
  id: string;
  label: string;
}
interface PipelineGroup {
  label: string;
  stages: PipelineStage[];
}
interface PipelinePhase {
  label: string;
  accent: "purple" | "orange";
  groups: PipelineGroup[];
}

// The full RAG pipeline (spec section 13), nested into the two phases that
// actually matter for when each part runs: documents are chunked and
// embedded once, ahead of time; a question gets embedded and searched
// against that index fresh, every single time it's asked. Grouped further
// within each phase (e.g. "Vector Search + Top-K + Reranking" as one
// "finding the relevant chunks" step) so the diagram reads as a small
// number of big ideas, not ten equally-weighted boxes.
const PHASES: PipelinePhase[] = [
  {
    label: "Preparing your documents (done once, ahead of time)",
    accent: "purple",
    groups: [
      {
        label: "Turn text into pieces",
        stages: [
          { id: "document", label: "Document" },
          { id: "parsing", label: "Parsing" },
          { id: "chunking", label: "Chunking" },
        ],
      },
      {
        label: "Turn pieces into vectors",
        stages: [{ id: "embedding", label: "Embedding" }],
      },
    ],
  },
  {
    label: "Answering a question (every time you ask)",
    accent: "orange",
    groups: [
      {
        label: "Turn the question into a vector",
        stages: [
          { id: "query", label: "Query" },
          { id: "query-embedding", label: "Embedding" },
        ],
      },
      {
        label: "Find the relevant chunks",
        stages: [
          { id: "vector-search", label: "Vector Search" },
          { id: "top-k", label: "Top-K" },
          { id: "reranking", label: "Reranking" },
        ],
      },
      {
        label: "Hand the chunks to the model",
        stages: [
          { id: "context", label: "Context" },
          { id: "llm", label: "LLM" },
        ],
      },
      {
        label: "The model's answer",
        stages: [{ id: "answer", label: "Answer" }],
      },
    ],
  },
];

const ACCENT_WRAPPER: Record<PipelinePhase["accent"], string> = {
  purple: "border-purple-200 bg-purple-50/40",
  orange: "border-orange-200 bg-orange-50/40",
};
const ACCENT_TEXT: Record<PipelinePhase["accent"], string> = {
  purple: "text-purple-700",
  orange: "text-orange-700",
};

const DIM = 0.32;

/** The RAG pipeline as two nested phases (see PHASES above), each phase a
 * stack of labeled groups, each group a short run of stage pills — same
 * `highlight` technique every other GenAI Systems diagram uses (dim
 * everything except the named stage ids), so this one diagram is reused
 * across the whole Chapter, each Step pointing at just the stage(s) it's
 * about. */
export function RagPipelineDiagram({ highlight }: { highlight?: string[] }) {
  const noHighlight = !highlight || highlight.length === 0;
  const stageActive = (id: string) => noHighlight || highlight!.includes(id);
  const groupActive = (group: PipelineGroup) => noHighlight || group.stages.some((s) => stageActive(s.id));
  const phaseActive = (phase: PipelinePhase) => noHighlight || phase.groups.some((g) => groupActive(g));

  return (
    <div>
      <div className="space-y-2">
        {PHASES.map((phase, pi) => (
          <div key={phase.label}>
            <div
              className={`rounded-lg border p-2.5 space-y-2 ${ACCENT_WRAPPER[phase.accent]}`}
              style={{ opacity: phaseActive(phase) ? 1 : DIM }}
            >
              <div className={`text-xs font-semibold uppercase tracking-wide ${ACCENT_TEXT[phase.accent]}`}>
                {phase.label}
              </div>
              {phase.groups.map((group, gi) => (
                <div key={group.label}>
                  <div
                    className="rounded-md border border-neutral-200 bg-white p-2"
                    style={{ opacity: groupActive(group) ? 1 : DIM }}
                  >
                    <div className="text-xs text-neutral-500 mb-1">{group.label}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {group.stages.map((stage, si) => (
                        <span key={stage.id} className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-1 rounded-full border text-xs font-medium ${
                              stageActive(stage.id)
                                ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                                : "border-neutral-200 bg-white text-neutral-400"
                            }`}
                          >
                            {stage.label}
                          </span>
                          {si < group.stages.length - 1 && <span className="text-neutral-300">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  {gi < phase.groups.length - 1 && (
                    <div className="flex justify-center py-0.5 text-neutral-300">↓</div>
                  )}
                </div>
              ))}
            </div>
            {pi < PHASES.length - 1 && <div className="flex justify-center py-1 text-neutral-400">↓</div>}
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500 mt-1.5 text-center">
        Purple = prepared once, ahead of time. Orange = repeated every time you ask a question.
      </p>
    </div>
  );
}
