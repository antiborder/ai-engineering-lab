import type { ReactNode } from "react";

const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const PURPLE = "#7c3aed";

/** One directional curved arrow from (x1,y1) to (x2,y2), bowed sideways by
 * `bow` pixels so that drawing both directions of a two-way connection
 * produces two visually separate arcs instead of one line that merely has
 * arrowheads glued to both ends. */
function curvedArrow(x1: number, y1: number, x2: number, y2: number, bow: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 + (-dy / len) * bow;
  const cy = (y1 + y2) / 2 + (dx / len) * bow;
  const ang = Math.atan2(y2 - cy, x2 - cx);
  const backX = x2 - 7 * Math.cos(ang);
  const backY = y2 - 7 * Math.sin(ang);
  const px = -Math.sin(ang) * 3.5;
  const py = Math.cos(ang) * 3.5;
  return {
    d: `M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`,
    head: `${backX + px},${backY + py} ${backX - px},${backY - py} ${x2},${y2}`,
  };
}

function Pill({ label, tone }: { label: ReactNode; tone: "cyan" | "emerald" }) {
  const cls = tone === "cyan" ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-emerald-300 bg-emerald-50 text-emerald-700";
  return <div className={`px-3 py-1.5 rounded-md border text-xs font-medium text-center ${cls}`}>{label}</div>;
}

function Down() {
  return (
    <div className="flex justify-center text-neutral-300 leading-none" aria-hidden>
      ↓
    </div>
  );
}

/** The chapter's "big picture" diagram: what an agent *is* — an LLM as the
 * hub, with Tools and a Plan as two independent, parallel branches off of
 * it (SVG, not stacked divs, specifically so the connections read as a
 * hub-and-spoke, not a sequence: LLM decides, on any given turn, to touch
 * Tools *or* Plan, never a fixed "Plan then Tools" chain, and Plan/Tools
 * never talk to each other directly). LLM sits center-left, vertically
 * between Plan (top-right) and Tools (bottom-right), with a straight
 * vertical line carrying Goal in from above (labeled to show the goal
 * arrives *as part of a prompt*, not as a prompt by itself) and Final
 * Answer out below — so the "main line" (Goal → LLM → Answer) and the two
 * side-branches (Plan, Tools) are visually distinct paths, not one chain.
 * The horizontal gap between LLM and the Plan/Tools column is deliberately
 * wide (a wide viewBox, not a cramped one) so the "reads/updates" and
 * "tool call/observation" labels have room and never overlap the boxes —
 * a real bug in an earlier version of this diagram. Modeled on real-world
 * AI agent architecture diagrams (an LLM plus tools plus a persistent,
 * self-editable plan, inside a bounded "agent" loop, looping until done)
 * rather than this app's own AgentLoopDiagram (deliberately simpler, no
 * plan box, reused with `highlight` across many later Steps) — this one
 * stands alone, on this Step only, as the richest picture of the whole
 * mechanism. The gap between this general picture and this app's own
 * simplified, never-rewritten plan is exactly what later Steps disclose. */
export function AgentSystemDiagram() {
  const width = 440;
  const height = 126;

  const llmX = 186, llmY = 44, llmW = 68, llmH = 32;
  const llmCx = llmX + llmW / 2;
  const llmRightX = llmX + llmW;
  const llmTopY = llmY;
  const llmBottomY = llmY + llmH;

  const planX = 342, planY = 8, planW = 84, planH = 32;
  const planLeftX = planX;
  const planCy = planY + planH / 2;

  const toolsX = 342, toolsY = 80, toolsW = 84, toolsH = 32;
  const toolsLeftX = toolsX;
  const toolsCy = toolsY + toolsH / 2;

  const labelX = llmRightX + 6;

  return (
    <div className="w-full max-w-75 mx-auto space-y-1.5">
      <Pill label={<>Your Goal<br />(typed in)</>} tone="cyan" />
      <Down />
      <div className="rounded-lg border-2 border-dashed border-neutral-300 p-2 pt-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500 text-center mb-0.5">
          Agent
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* main line: Goal -> LLM -> Final Answer */}
          <line x1={llmCx} y1={0} x2={llmCx} y2={llmTopY - 4} stroke="#a1a1aa" strokeWidth={1.5} />
          <polygon points={`${llmCx - 4},${llmTopY - 4} ${llmCx + 4},${llmTopY - 4} ${llmCx},${llmTopY + 1}`} fill="#a1a1aa" />
          <line x1={llmCx} y1={llmBottomY} x2={llmCx} y2={height - 5} stroke="#a1a1aa" strokeWidth={1.5} />
          <polygon points={`${llmCx - 4},${height - 5} ${llmCx + 4},${height - 5} ${llmCx},${height}`} fill="#a1a1aa" />

          {/* LLM <-> Tools: two separate arcs, not one bidirectional line */}
          {(() => {
            const act = curvedArrow(llmRightX + 3, llmY + 16, toolsLeftX - 3, toolsCy - 5, -9);
            const observe = curvedArrow(toolsLeftX - 3, toolsCy + 5, llmRightX + 3, llmY + 24, -9);
            return (
              <>
                <path d={act.d} fill="none" stroke={ORANGE} strokeWidth={1.5} />
                <polygon points={act.head} fill={ORANGE} />
                <path d={observe.d} fill="none" stroke={ORANGE} strokeWidth={1.5} />
                <polygon points={observe.head} fill={ORANGE} />
              </>
            );
          })()}
          <text x={labelX} y={toolsCy - 6} fontSize={12} fill="#737373">tool call</text>
          <text x={labelX} y={toolsCy + 10} fontSize={12} fill="#737373">observation</text>

          {/* LLM <-> Plan: same two-separate-arcs treatment */}
          {(() => {
            const updates = curvedArrow(llmRightX + 3, llmY + 4, planLeftX - 3, planCy - 5, -9);
            const reads = curvedArrow(planLeftX - 3, planCy + 5, llmRightX + 3, llmY + 12, -9);
            return (
              <>
                <path d={updates.d} fill="none" stroke={PURPLE} strokeWidth={1.5} />
                <polygon points={updates.head} fill={PURPLE} />
                <path d={reads.d} fill="none" stroke={PURPLE} strokeWidth={1.5} />
                <polygon points={reads.head} fill={PURPLE} />
              </>
            );
          })()}
          <text x={labelX} y={planCy - 6} fontSize={12} fill="#737373">reads</text>
          <text x={labelX} y={planCy + 10} fontSize={12} fill="#737373">updates</text>

          <rect x={llmX} y={llmY} width={llmW} height={llmH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
          <text x={llmCx} y={llmY + llmH / 2 - 2} fontSize={12} fontWeight={700} textAnchor="middle" fill="#3f3f46">LLM</text>
          <text x={llmCx} y={llmY + llmH / 2 + 12} fontSize={12} textAnchor="middle" fill="#3f3f46">(decide)</text>

          <rect x={planX} y={planY} width={planW} height={planH} rx={6} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={2} />
          <text x={planX + planW / 2} y={planY + planH / 2 - 2} fontSize={12} fontWeight={700} textAnchor="middle" fill="#3f3f46">Plan</text>
          <text x={planX + planW / 2} y={planY + planH / 2 + 12} fontSize={12} textAnchor="middle" fill="#3f3f46">(to-do list)</text>

          <rect x={toolsX} y={toolsY} width={toolsW} height={toolsH} rx={6} fill="rgba(234,88,12,0.1)" stroke={ORANGE} strokeWidth={2} />
          <text x={toolsX + toolsW / 2} y={toolsY + toolsH / 2 - 2} fontSize={12} fontWeight={700} textAnchor="middle" fill="#3f3f46">Tools</text>
          <text x={toolsX + toolsW / 2} y={toolsY + toolsH / 2 + 12} fontSize={12} textAnchor="middle" fill="#3f3f46">(act)</text>
        </svg>
        <p className="text-xs text-neutral-500 text-center mt-1">
          Each turn, the LLM picks Tools <em>or</em> Plan — never a fixed order — and repeats
          until it has enough to answer, or hits a set limit.
        </p>
      </div>
      <Down />
      <Pill label="Final Answer" tone="emerald" />
    </div>
  );
}
