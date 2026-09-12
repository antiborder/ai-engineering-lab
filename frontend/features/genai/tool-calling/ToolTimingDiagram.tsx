// Illustrative durations — not measured, just distinct enough to make
// "runs at the same time" visibly shorter than "runs one after another."
const TOOL_A_MS = 400;
const TOOL_B_MS = 300;

/** Small Gantt-style timeline: two tool calls placed on a labeled time
 * axis, either back to back (`mode="sequential"`, this app's own agent
 * loop) or starting together (`mode="parallel"`, what real 2026 APIs
 * allow a model to request in one turn). Total time is called out
 * explicitly so the difference isn't just visual. */
export function ToolTimingDiagram({ mode }: { mode: "sequential" | "parallel" }) {
  const width = 320;
  const height = 110;
  const padding = { top: 14, right: 30, bottom: 26, left: 70 };
  const innerW = width - padding.left - padding.right;

  const totalMs = mode === "sequential" ? TOOL_A_MS + TOOL_B_MS : Math.max(TOOL_A_MS, TOOL_B_MS);
  const scale = innerW / (TOOL_A_MS + TOOL_B_MS);

  const aStart = 0;
  const bStart = mode === "sequential" ? TOOL_A_MS : 0;

  const rowH = 22;
  const rowGap = 12;
  const rowAY = padding.top;
  const rowBY = rowAY + rowH + rowGap;
  const axisY = rowBY + rowH + 10;

  const ticks = [0, TOOL_A_MS, TOOL_A_MS + TOOL_B_MS];

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={padding.left - 6} y={rowAY + rowH / 2 + 4} fontSize={14} textAnchor="end" fill="#525252">
          calculator
        </text>
        <rect
          x={padding.left + aStart * scale}
          y={rowAY}
          width={TOOL_A_MS * scale}
          height={rowH}
          rx={4}
          fill="rgba(8,145,178,0.15)"
          stroke="#0891b2"
          strokeWidth={1.5}
        />

        <text x={padding.left - 6} y={rowBY + rowH / 2 + 4} fontSize={14} textAnchor="end" fill="#525252">
          weather
        </text>
        <rect
          x={padding.left + bStart * scale}
          y={rowBY}
          width={TOOL_B_MS * scale}
          height={rowH}
          rx={4}
          fill="rgba(124,58,237,0.15)"
          stroke="#7c3aed"
          strokeWidth={1.5}
        />

        <line x1={padding.left} x2={width - padding.right} y1={axisY} y2={axisY} stroke="#a3a3a3" strokeWidth={1.5} />
        {ticks.map((t) => (
          <text key={t} x={padding.left + t * scale} y={axisY + 13} fontSize={14} textAnchor="middle" fill="#737373">
            {t}ms
          </text>
        ))}
        <text x={padding.left + innerW / 2} y={height - 2} fontSize={14} textAnchor="middle" fill="#525252">
          time
        </text>
      </svg>
      <p className="text-sm text-neutral-500 mt-1 text-center">
        Total time: <strong>{totalMs}ms</strong> {mode === "sequential" ? "(sum of both)" : "(the slower of the two)"}
      </p>
    </div>
  );
}
