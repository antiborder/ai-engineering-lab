export type AgentFlowStageId = "trajectory" | "outcome";

/** An agent resolution drawn as Customer request → Plan → Tool calls →
 * Final answer. Reused across this Chapter's Steps with different
 * `highlight` values — same dim/highlight technique RagFlowDiagram uses
 * in the RAG Evaluation Unit, so a reader recognizes the same picture
 * zooming in on a different stage each time. */
export function AgentTrajectoryDiagram({ highlight }: { highlight?: AgentFlowStageId }) {
  const dim = (id: AgentFlowStageId) => (highlight && highlight !== id ? "opacity-30" : "opacity-100");

  const neutral = "border-neutral-200 bg-white text-neutral-700";
  const trajectory = "border-purple-300 bg-purple-50 text-purple-800";
  const outcome = "border-cyan-300 bg-cyan-50 text-cyan-800";

  const box = (className: string, label: string) => (
    <div className={`px-3 py-2 rounded-md border text-sm font-medium whitespace-nowrap ${className}`}>{label}</div>
  );

  return (
    <div className="flex items-center justify-center gap-1.5 flex-wrap">
      {box(neutral, "Customer request")}
      <span className="text-neutral-300">→</span>
      {box(`${trajectory} ${dim("trajectory")}`, "Plan")}
      <span className="text-neutral-300">→</span>
      {box(`${trajectory} ${dim("trajectory")}`, "Tool calls")}
      <span className="text-neutral-300">→</span>
      {box(`${outcome} ${dim("outcome")}`, "Final answer")}
    </div>
  );
}
