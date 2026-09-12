// Same mock-small pricing LLM API used ($0.0001/1k input, $0.0002/1k
// output) and the same illustrative 50-input/80-output-token call size
// from LlmApiWalkthrough's own worked example — one "decide" call costs:
const COST_PER_CALL = (50 / 1000) * 0.0001 + (80 / 1000) * 0.0002;
const STEPS = [1, 2, 3, 4, 5];

/** Axis-labeled bar chart: cumulative cost of a step-by-step (ReAct-style)
 * agent that calls the model once per "Decide" — matches
 * ReActLoopDiagram's loop, not this app's own agent (which only ever
 * makes one model call, since planning is rule-based — the gap the Step's
 * own text discloses). Same SVG-chart conventions as LossChart
 * (Fundamentals): labeled x/y axes, gridlines, padding. */
export function AgentCostChart() {
  const width = 350;
  const height = 170;
  const padding = { top: 10, right: 10, bottom: 34, left: 90 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const cumulative = STEPS.map((s) => s * COST_PER_CALL);
  const maxY = cumulative[cumulative.length - 1];
  const barW = innerW / STEPS.length;
  const axisY = padding.top + innerH;

  const yTicks = [0, 0.5, 1].map((t) => t * maxY);

  return (
    <div className="w-full max-w-87.5 mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {yTicks.map((t, i) => {
          const y = padding.top + innerH - (t / maxY) * innerH;
          return (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5e5e5" strokeWidth={1} />
              <text x={padding.left - 6} y={y + 3} fontSize={14} textAnchor="end" fill="#737373">
                ${t.toFixed(6)}
              </text>
            </g>
          );
        })}
        {STEPS.map((s, i) => {
          const h = (cumulative[i] / maxY) * innerH;
          const x = padding.left + i * barW;
          const y = axisY - h;
          return (
            <rect key={s} x={x + barW * 0.15} y={y} width={barW * 0.7} height={h} fill="#0891b2" rx={2} />
          );
        })}
        <line x1={padding.left} x2={width - padding.right} y1={axisY} y2={axisY} stroke="#a3a3a3" strokeWidth={1.5} />
        {STEPS.map((s, i) => (
          <text key={s} x={padding.left + i * barW + barW / 2} y={axisY + 14} fontSize={14} textAnchor="middle" fill="#525252">
            {s}
          </text>
        ))}
        <text x={padding.left + innerW / 2} y={height - 2} fontSize={14} textAnchor="middle" fill="#525252">
          steps decided so far
        </text>
        <text
          x={10}
          y={padding.top + innerH / 2}
          fontSize={14}
          textAnchor="middle"
          fill="#525252"
          transform={`rotate(-90, 10, ${padding.top + innerH / 2})`}
        >
          cumulative cost
        </text>
      </svg>
      <p className="text-sm text-neutral-500 mt-1 text-center">
        Illustrative: a step-by-step agent calling the model once per decision, at LLM
        API&rsquo;s own mock-small pricing.
      </p>
    </div>
  );
}
