const CYAN = "#0891b2";
const PURPLE = "#7c3aed";
const NEUTRAL = "#a1a1aa";

/** The structural difference between a fixed script and an Agent, side by
 * side — used in Step 5 ("Not Every Loop Is 'Agentic'") to make that
 * Step's point with the hardest case, not the easiest one: a script with
 * if/else branches (the left side) still isn't an agent, because a human
 * decided those branches in advance, and running it twice on the same
 * input takes the same path twice. An Agent has no such fixed diagram to
 * point at: it decides its next step from what it currently knows, which
 * is why its own picture is a loop (Decide/Act/Observe) instead of a
 * flowchart with branches. Modeled on real "workflow vs. agent"
 * architecture diagrams. */
export function WorkflowVsAgentDiagram() {
  return (
    <div className="w-full max-w-75 mx-auto space-y-3">
      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-purple-700 text-center mb-1">
          Workflow — a fixed diagram
        </div>
        <svg viewBox="0 0 300 150" className="bg-white rounded-md border border-neutral-200 w-full h-auto">
          <rect x={124} y={6} width={52} height={24} rx={5} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={1.5} />
          <text x={150} y={22} fontSize={14} textAnchor="middle" fill="#3f3f46">Start</text>

          <line x1={150} y1={30} x2={150} y2={44} stroke={NEUTRAL} strokeWidth={1.5} />
          <polygon points="146,44 154,44 150,50" fill={NEUTRAL} />

          <rect x={112} y={50} width={76} height={24} rx={5} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={1.5} />
          <text x={150} y={66} fontSize={14} textAnchor="middle" fill="#3f3f46">Task A</text>

          <line x1={150} y1={74} x2={150} y2={86} stroke={NEUTRAL} strokeWidth={1.5} />
          <polygon points="146,86 154,86 150,92" fill={NEUTRAL} />

          <polygon points="150,92 182,110 150,128 118,110" fill="#fafafa" stroke={CYAN} strokeWidth={1.5} />
          <text x={150} y={114} fontSize={14} textAnchor="middle" fill="#3f3f46">?</text>

          <line x1={118} y1={110} x2={64} y2={110} stroke={NEUTRAL} strokeWidth={1.5} />
          <polygon points="60,106 60,114 54,110" fill={NEUTRAL} />
          <text x={90} y={104} fontSize={14} textAnchor="middle" fill="#737373">yes</text>
          <rect x={4} y={98} width={64} height={24} rx={5} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={1.5} />
          <text x={36} y={114} fontSize={14} textAnchor="middle" fill="#3f3f46">Task B</text>

          <line x1={182} y1={110} x2={236} y2={110} stroke={NEUTRAL} strokeWidth={1.5} />
          <polygon points="240,106 240,114 246,110" fill={NEUTRAL} />
          <text x={210} y={104} fontSize={14} textAnchor="middle" fill="#737373">no</text>
          <rect x={232} y={98} width={64} height={24} rx={5} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={1.5} />
          <text x={264} y={114} fontSize={14} textAnchor="middle" fill="#3f3f46">Task C</text>

          <path d="M 36 122 L 36 138 L 150 138" fill="none" stroke={NEUTRAL} strokeWidth={1.5} />
          <path d="M 264 122 L 264 138 L 150 138" fill="none" stroke={NEUTRAL} strokeWidth={1.5} />
          <polygon points="146,134 154,134 150,141" fill={NEUTRAL} />
          <text x={150} y={148} fontSize={14} fontWeight={700} textAnchor="middle" fill="#3f3f46">End</text>
        </svg>
        <p className="text-sm text-neutral-500 mt-1 text-center">
          Same branches drawn in advance — no matter how many times it runs, it never takes a
          path that isn&rsquo;t already on this diagram.
        </p>
      </div>

      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-cyan-700 text-center mb-1">
          Agent — no fixed diagram
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="px-2 py-1 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800">Goal</span>
            <span className="text-neutral-300">→</span>
            <span className="px-2 py-1.5 rounded-md border-2 border-dashed border-cyan-400 bg-cyan-50 text-cyan-800 text-center">
              Decide → Act → Observe
            </span>
          </div>
          <div className="text-sm text-neutral-500 text-center mt-1.5">
            loops back to &ldquo;Decide&rdquo; with each new observation
          </div>
        </div>
        <p className="text-sm text-neutral-500 mt-1 text-center">
          Which action comes next depends on what was just observed — not on a branch drawn
          ahead of time.
        </p>
      </div>
    </div>
  );
}
