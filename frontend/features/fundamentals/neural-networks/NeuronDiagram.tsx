/** A purpose-built anatomy diagram for teaching what a single neuron is —
 * distinct from NetworkDiagram, which renders a *live* network's real
 * weights/activations. This one is schematic: it always shows the same
 * neuron (inputs, weights, bias, weighted sum, activation, output) and is
 * driven by two props instead of real numbers:
 *
 * - `stage` controls what's structurally drawn, so the diagram itself
 *   builds up piece by piece across the "Meet the Neuron" steps, matching
 *   the order concepts are introduced: "blackbox" (just in → neuron →
 *   out), "sum" (weights + bias feeding a weighted sum, output labeled
 *   z), "full" (adds the activation function, output now the neuron's
 *   real output).
 * - `highlight` dims every part except the ones named, with a bolder
 *   stroke/weight on the emphasized part — so a step about "weights" and
 *   a step about "bias" can reuse the same revealed structure while still
 *   visually pointing at a different part of it.
 */

export type NeuronPart = "inputs" | "weights" | "bias" | "sum" | "activation" | "output";
export type NeuronStage = "blackbox" | "sum" | "full";

const DIM = 0.22;
const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

export function NeuronDiagram({ stage, highlight }: { stage: NeuronStage; highlight?: NeuronPart[] }) {
  const width = 460;
  const height = 200;
  const x1 = { x: 56, y: 58 };
  const x2 = { x: 56, y: 142 };
  const cy = 100;
  const sumX = 250;
  const actX = 340;
  const outX = stage === "full" ? 412 : 372;

  const op = (part: NeuronPart) => (!highlight || highlight.length === 0 ? 1 : highlight.includes(part) ? 1 : DIM);
  const sw = (part: NeuronPart, base: number) => (highlight?.includes(part) ? base + 1.5 : base);
  const fw = (part: NeuronPart) => (highlight?.includes(part) ? 700 : 500);

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white rounded-md border border-neutral-200 w-full h-auto"
      >
        {stage === "blackbox" ? (
          <>
            <line x1={x1.x + 14} y1={x1.y} x2={sumX - 30} y2={cy} stroke={NEUTRAL} strokeWidth={2} />
            <line x1={x2.x + 14} y1={x2.y} x2={sumX - 30} y2={cy} stroke={NEUTRAL} strokeWidth={2} />
            <circle cx={x1.x} cy={x1.y} r={14} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={2} />
            <text x={x1.x} y={x1.y + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">x₁</text>
            <circle cx={x2.x} cy={x2.y} r={14} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={2} />
            <text x={x2.x} y={x2.y + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">x₂</text>
            <circle cx={sumX} cy={cy} r={32} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={2.5} />
            <text x={sumX} y={cy - 44} fontSize={12} textAnchor="middle" fill="#3f3f46">neuron</text>
            <line x1={sumX + 32} y1={cy} x2={outX - 6} y2={cy} stroke={PURPLE} strokeWidth={2.5} />
            <polygon points={`${outX - 6},${cy - 5} ${outX + 6},${cy} ${outX - 6},${cy + 5}`} fill={PURPLE} />
            <text x={outX + 12} y={cy + 4} fontSize={12} fill="#3f3f46">output</text>
          </>
        ) : (
          <>
            <g opacity={op("weights")}>
              <line x1={x1.x + 14} y1={x1.y} x2={sumX - 20} y2={cy} stroke={CYAN} strokeWidth={sw("weights", 2)} />
              <text x={(x1.x + sumX) / 2 - 6} y={(x1.y + cy) / 2 - 8} fontSize={12} fontWeight={fw("weights")} fill={CYAN}>w₁</text>
              <line x1={x2.x + 14} y1={x2.y} x2={sumX - 20} y2={cy} stroke={CYAN} strokeWidth={sw("weights", 2)} />
              <text x={(x2.x + sumX) / 2 - 6} y={(x2.y + cy) / 2 + 17} fontSize={12} fontWeight={fw("weights")} fill={CYAN}>w₂</text>
            </g>

            <g opacity={op("bias")}>
              <line x1={sumX} y1={cy - 50} x2={sumX} y2={cy - 22} stroke={ORANGE} strokeWidth={sw("bias", 2)} />
              <polygon points={`${sumX - 4},${cy - 22} ${sumX + 4},${cy - 22} ${sumX},${cy - 14}`} fill={ORANGE} />
              <text x={sumX + 9} y={cy - 34} fontSize={12} fontWeight={fw("bias")} fill={ORANGE}>b</text>
            </g>

            <g opacity={op("inputs")}>
              <circle cx={x1.x} cy={x1.y} r={14} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={sw("inputs", 2)} />
              <text x={x1.x} y={x1.y + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">x₁</text>
              <circle cx={x2.x} cy={x2.y} r={14} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={sw("inputs", 2)} />
              <text x={x2.x} y={x2.y + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">x₂</text>
            </g>

            <g opacity={op("sum")}>
              <circle cx={sumX} cy={cy} r={20} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={sw("sum", 2)} />
              <text x={sumX} y={cy + 5} fontSize={13} textAnchor="middle" fill="#3f3f46">Σ</text>
            </g>

            {stage === "full" ? (
              <>
                <line x1={sumX + 20} y1={cy} x2={actX - 18} y2={cy} stroke={NEUTRAL} strokeWidth={2} opacity={Math.min(op("sum"), op("activation"))} />
                <g opacity={op("activation")}>
                  <circle cx={actX} cy={cy} r={18} fill="rgba(8,145,178,0.12)" stroke={CYAN} strokeWidth={sw("activation", 2)} />
                  <text x={actX} y={cy + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">f</text>
                </g>
                <g opacity={op("output")}>
                  <line x1={actX + 18} y1={cy} x2={outX - 6} y2={cy} stroke={PURPLE} strokeWidth={sw("output", 2)} />
                  <polygon points={`${outX - 6},${cy - 5} ${outX + 6},${cy} ${outX - 6},${cy + 5}`} fill={PURPLE} />
                  <text x={outX + 12} y={cy + 4} fontSize={12} fill="#3f3f46">output</text>
                </g>
              </>
            ) : (
              <g opacity={op("output")}>
                <line x1={sumX + 20} y1={cy} x2={outX - 6} y2={cy} stroke={PURPLE} strokeWidth={sw("output", 2)} />
                <polygon points={`${outX - 6},${cy - 5} ${outX + 6},${cy} ${outX - 6},${cy + 5}`} fill={PURPLE} />
                <text x={outX + 12} y={cy + 4} fontSize={12} fill="#3f3f46">z</text>
              </g>
            )}
          </>
        )}
      </svg>
    </div>
  );
}
