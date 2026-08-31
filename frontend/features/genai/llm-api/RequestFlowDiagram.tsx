const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const GREEN = "#059669";
const NEUTRAL = "#a1a1aa";

export type FlowPart = "system" | "user" | "config" | "model" | "response";

const DIM = 0.22;

/** Schematic shape of one LLM API call: a system prompt, a user prompt,
 * and configuration (temperature, max output length, reasoning effort) go
 * in, a model processes them, a response comes out. `highlight` dims every
 * other part, the same technique SublayerDiagram (Fundamentals) uses, so
 * this one diagram can be reused across several Steps, each pointing at
 * just the piece that Step is about. Matches LlmApiLab.tsx /
 * app/api/genai.py's `CompletionRequest` (model, system, prompt) →
 * `CompletionResponse` (text, tokens, latency, cost) shape — `config` has
 * no backend field yet (this app's mock API doesn't expose it), shown here
 * only as the concept real APIs add on top. */
export function RequestFlowDiagram({ highlight }: { highlight?: FlowPart[] }) {
  const width = 420;
  const height = 175;
  const op = (part: FlowPart) => (!highlight || highlight.length === 0 ? 1 : highlight.includes(part) ? 1 : DIM);
  const sw = (part: FlowPart, base: number) => (highlight?.includes(part) ? base + 1.5 : base);

  const leftX = 10;
  const boxW = 140;
  const boxH = 30;
  const sysY = 8;
  const userY = 44;
  const configY = 80;
  const midY = 59; // vertical center of the 3 stacked input boxes

  const modelX = 205;
  const modelW = 200;
  const modelH = 72;
  const modelY = midY - modelH / 2;

  const respY = modelY + modelH + 30;
  const respW = 340;
  const respH = 30;
  const respX = (width - respW) / 2;

  const inputLine = (part: FlowPart, boxY: number, dy: number) => (
    <path
      key={part}
      d={`M ${leftX + boxW} ${boxY + boxH / 2} L ${modelX - 14} ${midY + dy}`}
      stroke={NEUTRAL}
      strokeWidth={1.5}
      fill="none"
      opacity={Math.min(op(part), op("model"))}
    />
  );

  return (
    <div className="w-full max-w-105 mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <g opacity={op("system")}>
          <rect x={leftX} y={sysY} width={boxW} height={boxH} rx={6} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={sw("system", 2)} />
          <text x={leftX + boxW / 2} y={sysY + boxH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
            System prompt
          </text>
        </g>
        <g opacity={op("user")}>
          <rect x={leftX} y={userY} width={boxW} height={boxH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={sw("user", 2)} />
          <text x={leftX + boxW / 2} y={userY + boxH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
            User prompt
          </text>
        </g>
        <g opacity={op("config")}>
          <rect x={leftX} y={configY} width={boxW} height={boxH} rx={6} fill="rgba(5,150,105,0.1)" stroke={GREEN} strokeWidth={sw("config", 2)} />
          <text x={leftX + boxW / 2} y={configY + boxH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
            Configuration
          </text>
        </g>

        {inputLine("system", sysY, -14)}
        {inputLine("user", userY, 0)}
        {inputLine("config", configY, 14)}
        <polygon
          points={`${modelX - 14},${midY - 4} ${modelX - 14},${midY + 4} ${modelX - 6},${midY}`}
          fill={NEUTRAL}
          opacity={op("model")}
        />

        <g opacity={op("model")}>
          <rect x={modelX} y={modelY} width={modelW} height={modelH} rx={8} fill="rgba(234,88,12,0.08)" stroke={ORANGE} strokeWidth={sw("model", 2)} />
          <text x={modelX + modelW / 2} y={modelY + modelH / 2 - 2} fontSize={12} fontWeight={700} textAnchor="middle" fill="#3f3f46">
            Model
          </text>
          <text x={modelX + modelW / 2} y={modelY + modelH / 2 + 13} fontSize={12} textAnchor="middle" fill="#737373">
            everything from Fundamentals
          </text>
        </g>

        <line x1={modelX + modelW / 2} y1={modelY + modelH} x2={modelX + modelW / 2} y2={respY - 4} stroke={NEUTRAL} strokeWidth={2} opacity={Math.min(op("model"), op("response"))} />
        <polygon
          points={`${modelX + modelW / 2 - 4},${respY - 4} ${modelX + modelW / 2 + 4},${respY - 4} ${modelX + modelW / 2},${respY + 2}`}
          fill={NEUTRAL}
          opacity={op("response")}
        />

        <g opacity={op("response")}>
          <rect x={respX} y={respY} width={respW} height={respH} rx={6} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={sw("response", 2)} />
          <text x={respX + respW / 2} y={respY + respH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
            Response: text + tokens + latency + cost
          </text>
        </g>
      </svg>
    </div>
  );
}
