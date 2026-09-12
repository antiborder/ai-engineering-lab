export type ToolCallStageId =
  | "user"
  | "llm-decide"
  | "tool-selection"
  | "tool-execution"
  | "tool-result"
  | "llm-answer"
  | "answer";

const STAGES: { id: ToolCallStageId; label: string }[] = [
  { id: "user", label: "User" },
  { id: "llm-decide", label: "LLM" },
  { id: "tool-selection", label: "Tool Selection" },
  { id: "tool-execution", label: "Tool Execution" },
  { id: "tool-result", label: "Tool Result" },
  { id: "llm-answer", label: "LLM" },
  { id: "answer", label: "Answer" },
];

const TOOL_STAGE_IDS: ToolCallStageId[] = ["tool-selection", "tool-execution", "tool-result"];

/** The one round trip a tool call is (matches ToolCallingLab.tsx's own
 * pipeline strip exactly, so the walkthrough and the real sandbox agree
 * visually). `highlight` dims every other stage, same technique every
 * other GenAI Systems diagram uses. `skipTool` additionally dims and
 * strikes through the three tool stages, for the "no tool was needed"
 * case — the model still goes LLM -> LLM, just without a detour through a
 * tool. */
export function ToolCallFlowDiagram({
  highlight,
  skipTool = false,
}: {
  highlight?: ToolCallStageId[];
  skipTool?: boolean;
}) {
  const noHighlight = !highlight || highlight.length === 0;
  const active = (id: ToolCallStageId) => noHighlight || highlight!.includes(id);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {STAGES.map((s, i) => {
          const dimmed = skipTool && TOOL_STAGE_IDS.includes(s.id);
          return (
            <span key={s.id + i} className="flex items-center gap-1.5">
              <span
                className={`px-2 py-1 rounded-full border text-sm font-medium ${
                  dimmed
                    ? "border-neutral-100 bg-neutral-50 text-neutral-300 line-through"
                    : active(s.id)
                      ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                      : "border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {s.label}
              </span>
              {i < STAGES.length - 1 && <span className="text-neutral-300">→</span>}
            </span>
          );
        })}
      </div>
      {skipTool && (
        <p className="text-sm text-neutral-500">No tool matched, so these steps are skipped entirely.</p>
      )}
    </div>
  );
}
