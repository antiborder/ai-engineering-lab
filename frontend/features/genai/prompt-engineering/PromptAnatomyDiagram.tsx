const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

export type PromptPart = "instructions" | "examples" | "reasoning-cue" | "task";

const DIM = 0.22;

const PARTS: { id: PromptPart; label: string; color: string; fill: string }[] = [
  { id: "instructions", label: "Instructions (role, tone, constraints)", color: PURPLE, fill: "rgba(124,58,237,0.1)" },
  { id: "examples", label: "Examples — few-shot", color: CYAN, fill: "rgba(8,145,178,0.1)" },
  { id: "reasoning-cue", label: '"Think step by step" — chain-of-thought', color: "#059669", fill: "rgba(5,150,105,0.1)" },
  { id: "task", label: "The task itself (user prompt)", color: ORANGE, fill: "rgba(234,88,12,0.1)" },
];

/** A single prompt's internal structure, stacked top to bottom in the
 * order it's usually assembled: role/instructions, then optional examples,
 * then an optional reasoning cue, then the actual task. `highlight` dims
 * every other part — same technique as RequestFlowDiagram (LLM API) — so
 * this one diagram is reused across the few-shot and chain-of-thought
 * Steps, each pointing at just the piece that Step is about. Only
 * `instructions` and `task` are required; `examples` and `reasoning-cue`
 * are optional additions a real prompt may or may not include. */
export function PromptAnatomyDiagram({ highlight }: { highlight?: PromptPart[] }) {
  const width = 320;
  const boxH = 32;
  const gap = 10;
  const boxX = 10;
  const boxW = width - 2 * boxX;
  const topMargin = 10;
  const height = topMargin + PARTS.length * boxH + (PARTS.length - 1) * gap + 10;

  const op = (id: PromptPart) => (!highlight || highlight.length === 0 ? 1 : highlight.includes(id) ? 1 : DIM);
  const sw = (id: PromptPart, base: number) => (highlight?.includes(id) ? base + 1.5 : base);

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {PARTS.map((part, i) => {
          const y = topMargin + i * (boxH + gap);
          return (
            <g key={part.id} opacity={op(part.id)}>
              <rect x={boxX} y={y} width={boxW} height={boxH} rx={6} fill={part.fill} stroke={part.color} strokeWidth={sw(part.id, 2)} />
              <text x={boxX + boxW / 2} y={y + boxH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
                {part.label}
              </text>
              {i > 0 && (
                <line
                  x1={boxX + boxW / 2}
                  y1={y - gap}
                  x2={boxX + boxW / 2}
                  y2={y - 2}
                  stroke={NEUTRAL}
                  strokeWidth={1.5}
                  opacity={Math.min(op(PARTS[i - 1].id), op(part.id))}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
