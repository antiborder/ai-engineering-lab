export type AgentStageId = "goal" | "plan" | "tool-observation" | "answer";

/** Goal -> Plan -> (Act -> Observe, repeated) -> Final Answer (spec
 * section 15's agent loop). The dashed "Act -> Observe" box stands for
 * however many steps the plan actually has (this app caps it at 5) —
 * drawn once, annotated "repeat", rather than as N literal boxes, since N
 * varies goal to goal. `highlight` dims every other stage, same technique
 * every other GenAI Systems diagram uses. */
export function AgentLoopDiagram({ highlight }: { highlight?: AgentStageId[] }) {
  const noHighlight = !highlight || highlight.length === 0;
  const active = (id: AgentStageId) => noHighlight || highlight!.includes(id);

  const boxCls = (id: AgentStageId) =>
    `rounded-md border p-2.5 text-center text-sm font-medium ${
      active(id) ? "border-cyan-600 bg-cyan-50 text-cyan-800" : "border-neutral-200 bg-white text-neutral-400"
    }`;
  const arrow = (
    <div className="flex justify-center text-neutral-300" aria-hidden>
      ↓
    </div>
  );

  return (
    <div className="max-w-[260px] mx-auto space-y-1">
      <div className={boxCls("goal")}>Goal</div>
      {arrow}
      <div className={boxCls("plan")}>Plan (list of tool calls)</div>
      {arrow}
      <div
        className={`rounded-md border-2 border-dashed p-2.5 text-center ${
          active("tool-observation") ? "border-cyan-600 bg-cyan-50" : "border-neutral-200 bg-white"
        }`}
      >
        <div className={`text-sm font-medium ${active("tool-observation") ? "text-cyan-800" : "text-neutral-400"}`}>
          Act → Observe
        </div>
        <div className="text-sm text-neutral-500 mt-0.5">repeat, up to 5 times</div>
      </div>
      {arrow}
      <div className={boxCls("answer")}>Final Answer</div>
    </div>
  );
}
