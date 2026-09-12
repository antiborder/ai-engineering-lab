import type { ReactNode } from "react";

const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const PURPLE = "#7c3aed";
const NEUTRAL = "#a1a1aa";

/** One directional curved arrow from (x1,y1) to (x2,y2), bowed sideways by
 * `bow` pixels so that drawing both directions between the same two boxes
 * produces two visually separate arcs (a "lens") instead of one line that
 * merely has arrowheads glued to both ends. */
function curvedArrow(x1: number, y1: number, x2: number, y2: number, bow: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2 + (-dy / len) * bow;
  const cy = (y1 + y2) / 2 + (dx / len) * bow;
  const ang = Math.atan2(y2 - cy, x2 - cx);
  const backX = x2 - 8 * Math.cos(ang);
  const backY = y2 - 8 * Math.sin(ang);
  const px = -Math.sin(ang) * 4;
  const py = Math.cos(ang) * 4;
  return {
    d: `M ${x1} ${y1} Q ${cx} ${cy}, ${x2} ${y2}`,
    head: `${backX + px},${backY + py} ${backX - px},${backY - py} ${x2},${y2}`,
  };
}

/** A zoomed-in view of the same "Agent" box drawn in AgentSystemDiagram
 * (Step 2), reused across two Steps with different `focus`: "tools" (the
 * Decide<->Tools loop, in big text — DECIDE, ACT, OBSERVE, since that pair
 * is a clean, closed loop) or "plan" (the Decide<->Plan connection, since
 * that's the pair a Step about what "Plan" actually is needs to zoom into).
 * Whichever side isn't in focus is drawn grey and small — still visible
 * (so this always reads as "the same Agent box as Step 2"), but not
 * competing with whichever pair the current Step is actually teaching.
 * Each two-way connection is drawn as two separate curvedArrow arcs (not
 * one line with an arrowhead glued to each end) so it reads as two
 * distinct arrows, not a single connector.
 *
 * `repeatBadge` and `caption` let a Step reuse this exact picture instead
 * of a disconnected diagram, so readers recognize it as the same loop
 * rather than learning a new one. */
export function ReActLoopDiagram({
  focus = "tools",
  repeatBadge,
  caption,
}: {
  focus?: "tools" | "plan";
  repeatBadge?: boolean;
  caption?: ReactNode;
}) {
  const width = 460;
  const height = 232;

  const llmX = 40, llmY = 102, llmW = 110, llmH = 50;
  const llmCx = llmX + llmW / 2;
  const llmRightX = llmX + llmW;

  const planX = 300, planY = 37, planW = 130, planH = 55;
  const planLeftX = planX;
  const planCy = planY + planH / 2;

  const toolsX = 300, toolsY = 162, toolsW = 130, toolsH = 55;
  const toolsLeftX = toolsX;
  const toolsCy = toolsY + toolsH / 2;

  const toolsOn = focus === "tools";
  const planOn = focus === "plan";
  const toolsColor = toolsOn ? ORANGE : NEUTRAL;
  const planColor = planOn ? PURPLE : NEUTRAL;

  const act = curvedArrow(llmRightX + 3, llmY + 28, toolsLeftX - 3, toolsCy - 14, toolsOn ? -16 : -12);
  const observe = curvedArrow(toolsLeftX - 3, toolsCy + 14, llmRightX + 3, llmY + 44, toolsOn ? -16 : -12);
  const update = curvedArrow(llmRightX + 3, llmY + 4, planLeftX - 3, planCy - 12, planOn ? -16 : -12);
  const reads = curvedArrow(planLeftX - 3, planCy + 12, llmRightX + 3, llmY + 20, planOn ? -16 : -12);

  return (
    <div className="w-full max-w-90 mx-auto">
      <div className="rounded-lg border-2 border-dashed border-neutral-300 p-2 pt-1 bg-white">
        <div className="text-sm font-semibold uppercase tracking-wide text-neutral-500 text-center mb-0.5">
          Agent — zoomed in
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* LLM <-> Tools: two separate arcs, not one bidirectional line */}
          <path d={act.d} fill="none" stroke={toolsColor} strokeWidth={toolsOn ? 2 : 1.5} />
          <polygon points={act.head} fill={toolsColor} />
          <path d={observe.d} fill="none" stroke={toolsColor} strokeWidth={toolsOn ? 2 : 1.5} />
          <polygon points={observe.head} fill={toolsColor} />
          {toolsOn ? (
            <>
              <text x={205} y={toolsCy - 32} fontSize={16} fontWeight={700} textAnchor="middle" fill={ORANGE}>ACT</text>
              <text x={205} y={toolsCy - 18} fontSize={14} textAnchor="middle" fill="#a3a3a3">(tool call)</text>
              <text x={205} y={toolsCy + 20} fontSize={16} fontWeight={700} textAnchor="middle" fill={ORANGE}>OBSERVE</text>
              <text x={205} y={toolsCy + 35} fontSize={14} textAnchor="middle" fill="#a3a3a3">(the result)</text>
            </>
          ) : (
            <>
              <text x={205} y={toolsCy - 4} fontSize={14} textAnchor="middle" fill="#a3a3a3">also: call a tool</text>
              <text x={205} y={toolsCy + 22} fontSize={14} textAnchor="middle" fill="#a3a3a3">gets a real Observe</text>
            </>
          )}

          {/* LLM <-> Plan: two separate arcs, not one bidirectional line */}
          <path d={update.d} fill="none" stroke={planColor} strokeWidth={planOn ? 2 : 1.5} />
          <polygon points={update.head} fill={planColor} />
          <path d={reads.d} fill="none" stroke={planColor} strokeWidth={planOn ? 2 : 1.5} />
          <polygon points={reads.head} fill={planColor} />
          {planOn ? (
            <>
              <text x={205} y={planCy - 20} fontSize={16} fontWeight={700} textAnchor="middle" fill={PURPLE}>ACT</text>
              <text x={205} y={planCy - 6} fontSize={14} textAnchor="middle" fill="#a3a3a3">(update the plan)</text>
              <text x={205} y={planCy + 22} fontSize={16} fontWeight={700} textAnchor="middle" fill={PURPLE}>READS</text>
              <text x={205} y={planCy + 37} fontSize={14} textAnchor="middle" fill="#a3a3a3">(informs next Decide)</text>
            </>
          ) : (
            <>
              <text x={205} y={planCy - 4} fontSize={14} textAnchor="middle" fill="#a3a3a3">also: update plan</text>
              <text x={205} y={planCy + 22} fontSize={14} textAnchor="middle" fill="#a3a3a3">not an Observe</text>
            </>
          )}

          <rect x={llmX} y={llmY} width={llmW} height={llmH} rx={8} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
          <text x={llmCx} y={llmY + llmH / 2 - 2} fontSize={18} fontWeight={700} textAnchor="middle" fill="#3f3f46">DECIDE</text>
          <text x={llmCx} y={llmY + llmH / 2 + 15} fontSize={14} textAnchor="middle" fill="#737373">(the LLM)</text>

          <rect
            x={planX} y={planY} width={planW} height={planH} rx={8}
            fill={planOn ? "rgba(124,58,237,0.1)" : "#fafafa"}
            stroke={planOn ? PURPLE : NEUTRAL}
            strokeWidth={planOn ? 2 : 1.5}
          />
          <text x={planX + planW / 2} y={planY + planH / 2 - 3} fontSize={15} fontWeight={700} textAnchor="middle" fill={planOn ? "#3f3f46" : "#a3a3a3"}>Plan</text>
          <text x={planX + planW / 2} y={planY + planH / 2 + 13} fontSize={14} textAnchor="middle" fill={planOn ? "#3f3f46" : "#a3a3a3"}>(to-do list)</text>

          <rect
            x={toolsX} y={toolsY} width={toolsW} height={toolsH} rx={8}
            fill={toolsOn ? "rgba(234,88,12,0.1)" : "#fafafa"}
            stroke={toolsOn ? ORANGE : NEUTRAL}
            strokeWidth={toolsOn ? 2 : 1.5}
          />
          <text x={toolsX + toolsW / 2} y={toolsY + toolsH / 2 - 3} fontSize={15} fontWeight={700} textAnchor="middle" fill={toolsOn ? "#3f3f46" : "#a3a3a3"}>Tools</text>
          <text x={toolsX + toolsW / 2} y={toolsY + toolsH / 2 + 13} fontSize={14} textAnchor="middle" fill={toolsOn ? "#3f3f46" : "#a3a3a3"}>(act)</text>

          {repeatBadge && (
            <>
              <rect x={15} y={6} width={172} height={24} rx={12} fill="#fff7ed" stroke={ORANGE} strokeWidth={1.5} />
              <text x={101} y={22} fontSize={14} fontWeight={600} textAnchor="middle" fill="#9a3412">
                once per planned tool
              </text>
            </>
          )}
        </svg>
      </div>
      <p className="text-sm text-neutral-500 mt-1 text-center">
        {caption ?? (
          toolsOn ? (
            <>
              Decide → Act → Observe → Decide again: a closed loop. Updating the plan (grey) is
              also a form of Act, but it doesn&rsquo;t come back with an Observe, so it sits outside
              the loop.
            </>
          ) : (
            <>
              Decide reads the plan before choosing an action, and can Act by rewriting it. A
              tool call (grey) is also a form of Act, but it&rsquo;s a separate arrow with its own
              Observe.
            </>
          )
        )}
      </p>
    </div>
  );
}
