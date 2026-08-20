import type { MlpConfig, MlpWeights } from "./mlp";

const WIDTH = 460;
const HEIGHT = 320;
const PAD_X = 50;
const NODE_R = 12;

function layerSizes(config: MlpConfig): number[] {
  return [config.inputDim, ...config.hiddenSizes, 1];
}

function nodePositions(sizes: number[]): { x: number; y: number }[][] {
  const numLayers = sizes.length;
  return sizes.map((count, l) => {
    const x = numLayers === 1 ? WIDTH / 2 : PAD_X + (l * (WIDTH - 2 * PAD_X)) / (numLayers - 1);
    return Array.from({ length: count }, (_, i) => {
      const y = HEIGHT / 2 + (i - (count - 1) / 2) * Math.min(52, (HEIGHT - 40) / count);
      return { x, y };
    });
  });
}

function weightColor(w: number): string {
  return w >= 0 ? "#0891b2" : "#ea580c";
}

/** Nodes = neurons (input, hidden, output). Edge thickness/opacity = |weight|,
 * color = sign. Node fill intensity = mean activation magnitude across the
 * dataset — a live picture of "which neurons fire" as training progresses
 * (spec 11.2: neurons, weights, activations). */
export function NetworkDiagram({
  config,
  weights,
  activations,
}: {
  config: MlpConfig;
  weights: MlpWeights;
  activations: number[][];
}) {
  const sizes = layerSizes(config);
  const positions = nodePositions(sizes);
  const maxAbsW = Math.max(0.05, ...weights.flatMap((l) => l.W.flat().map(Math.abs)));

  return (
    <div className="w-full max-w-[460px] mx-auto">
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="bg-white rounded-md border border-neutral-200 w-full h-auto"
    >
      {weights.map((layer, l) =>
        layer.W.map((row, i) =>
          row.map((w, j) => {
            const from = positions[l][j];
            const to = positions[l + 1][i];
            const strength = Math.min(1, Math.abs(w) / maxAbsW);
            return (
              <line
                key={`${l}-${i}-${j}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={weightColor(w)}
                strokeOpacity={0.15 + strength * 0.55}
                strokeWidth={0.5 + strength * 2.5}
              />
            );
          })
        )
      )}
      {positions.map((layerPos, l) =>
        layerPos.map((pos, i) => {
          const act = activations[l]?.[i] ?? 0;
          const intensity = Math.min(1, Math.abs(act));
          return (
            <circle
              key={`${l}-${i}`}
              cx={pos.x}
              cy={pos.y}
              r={NODE_R}
              fill={`rgba(124, 58, 237, ${0.25 + intensity * 0.7})`}
              stroke="#7c3aed"
              strokeWidth={1}
            />
          );
        })
      )}
    </svg>
    </div>
  );
}
