const PURPLE = "#7c3aed";
const GREEN = "#059669";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

export type PipelinePart = "task" | "schema" | "model" | "output" | "validation";

const DIM = 0.22;

/** Schematic shape of the Structured Output pipeline: a natural-language
 * task and a JSON Schema both go into the model, the model's output comes
 * out, and a validator checks that output against the schema. `highlight`
 * dims every other part, the same technique RequestFlowDiagram (LLM API)
 * uses, so this one diagram is reused across several Steps. `outcome` only
 * affects the validation box's icon — "neutral" (not checked yet), "valid",
 * or "invalid". */
export function StructuredOutputFlowDiagram({
  highlight,
  outcome = "neutral",
}: {
  highlight?: PipelinePart[];
  outcome?: "neutral" | "valid" | "invalid";
}) {
  const width = 320;
  const boxH = 32;
  const topY = 10;
  const leftX = 8;
  const rightX = 168;
  const inputW = 144;

  const modelW = 170;
  const modelX = (width - modelW) / 2;
  const modelY = 66;
  const modelH = 34;

  const outputW = 200;
  const outputX = (width - outputW) / 2;
  const outputY = modelY + modelH + 26;
  const outputH = 32;

  const validationW = 200;
  const validationX = (width - validationW) / 2;
  const validationY = outputY + outputH + 26;
  const validationH = 40;

  const height = validationY + validationH + 10;
  const midX = width / 2;

  const op = (part: PipelinePart) => (!highlight || highlight.length === 0 ? 1 : highlight.includes(part) ? 1 : DIM);
  const sw = (part: PipelinePart, base: number) => (highlight?.includes(part) ? base + 1.5 : base);

  const icon = outcome === "valid" ? "✓" : outcome === "invalid" ? "✗" : "?";
  const iconColor = outcome === "valid" ? "#059669" : outcome === "invalid" ? "#dc2626" : NEUTRAL;

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <g opacity={op("task")}>
          <rect x={leftX} y={topY} width={inputW} height={boxH} rx={6} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={sw("task", 2)} />
          <text x={leftX + inputW / 2} y={topY + boxH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
            Natural language
          </text>
        </g>
        <g opacity={op("schema")}>
          <rect x={rightX} y={topY} width={inputW} height={boxH} rx={6} fill="rgba(5,150,105,0.1)" stroke={GREEN} strokeWidth={sw("schema", 2)} />
          <text x={rightX + inputW / 2} y={topY + boxH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
            JSON Schema
          </text>
        </g>

        <path
          d={`M ${leftX + inputW / 2} ${topY + boxH} L ${modelX + modelW * 0.32} ${modelY}`}
          stroke={NEUTRAL}
          strokeWidth={1.5}
          fill="none"
          opacity={Math.min(op("task"), op("model"))}
        />
        <path
          d={`M ${rightX + inputW / 2} ${topY + boxH} L ${modelX + modelW * 0.68} ${modelY}`}
          stroke={NEUTRAL}
          strokeWidth={1.5}
          fill="none"
          opacity={Math.min(op("schema"), op("model"))}
        />

        <g opacity={op("model")}>
          <rect x={modelX} y={modelY} width={modelW} height={modelH} rx={8} fill="rgba(234,88,12,0.08)" stroke={ORANGE} strokeWidth={sw("model", 2)} />
          <text x={midX} y={modelY + modelH / 2 + 4} fontSize={14} fontWeight={700} textAnchor="middle" fill="#3f3f46">
            Model
          </text>
        </g>

        <line x1={midX} y1={modelY + modelH} x2={midX} y2={outputY - 4} stroke={NEUTRAL} strokeWidth={2} opacity={Math.min(op("model"), op("output"))} />
        <polygon points={`${midX - 4},${outputY - 4} ${midX + 4},${outputY - 4} ${midX},${outputY + 2}`} fill={NEUTRAL} opacity={op("output")} />

        <g opacity={op("output")}>
          <rect x={outputX} y={outputY} width={outputW} height={outputH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={sw("output", 2)} />
          <text x={midX} y={outputY + outputH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
            Structured output
          </text>
        </g>

        <line x1={midX} y1={outputY + outputH} x2={midX} y2={validationY - 4} stroke={NEUTRAL} strokeWidth={2} opacity={Math.min(op("output"), op("validation"))} />
        <polygon points={`${midX - 4},${validationY - 4} ${midX + 4},${validationY - 4} ${midX},${validationY + 2}`} fill={NEUTRAL} opacity={op("validation")} />

        <g opacity={op("validation")}>
          <rect x={validationX} y={validationY} width={validationW} height={validationH} rx={6} fill="rgba(161,161,170,0.1)" stroke={NEUTRAL} strokeWidth={sw("validation", 2)} />
          <text x={validationX + 28} y={validationY + validationH / 2 + 6} fontSize={18} textAnchor="middle" fill={iconColor} fontWeight={700}>
            {icon}
          </text>
          <text x={validationX + 52} y={validationY + validationH / 2 + 4} fontSize={14} fill="#3f3f46">
            Validation
          </text>
        </g>
      </svg>
    </div>
  );
}
