export type RagFlowStageId = "retrieve" | "generate";

/** A RAG pipeline drawn as Question → Retrieve → Retrieved doc(s) →
 * Generate → Answer. Reused across this Chapter's Steps with different
 * `highlight` values — same dim/highlight technique PipelineDiagram uses
 * in the Evaluation Basics Unit, so a reader recognizes the same picture
 * zooming in on a different stage each time. */
export function RagFlowDiagram({ highlight }: { highlight?: RagFlowStageId }) {
  const dim = (id: RagFlowStageId) => (highlight && highlight !== id ? "opacity-30" : "opacity-100");

  const neutral = "border-neutral-200 bg-white text-neutral-700";
  const retrieve = "border-purple-300 bg-purple-50 text-purple-800";
  const generate = "border-cyan-300 bg-cyan-50 text-cyan-800";

  const box = (className: string, label: string) => (
    <div className={`px-3 py-2 rounded-md border text-sm font-medium whitespace-nowrap ${className}`}>{label}</div>
  );

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      {box(neutral, "Question")}
      <span className="text-neutral-300">→</span>
      {box(`${retrieve} ${dim("retrieve")}`, "Retrieve")}
      <span className="text-neutral-300">→</span>
      {box(neutral, "Retrieved doc(s)")}
      <span className="text-neutral-300">→</span>
      {box(`${generate} ${dim("generate")}`, "Generate")}
      <span className="text-neutral-300">→</span>
      {box(neutral, "Answer")}
    </div>
  );
}
