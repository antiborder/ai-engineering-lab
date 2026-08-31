const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const NEUTRAL = "#d4d4d8";

const D_MODEL = 8;
const HIDDEN_TOTAL = D_MODEL * 4; // matches transformer.ts's `hidden = dModel * 4`
const HIDDEN_SHOWN = 5; // representative subset — drawing all 32 would be unreadable

/** Schematic (not data-driven) diagram of this app's actual feed-forward
 * network shape: D_MODEL in, one hidden layer of size D_MODEL*4 with ReLU,
 * D_MODEL out — the same one-hidden-layer MLP taught in the Neural
 * Networks chapter, applied here to one token's vector. The hidden column
 * shows a representative handful of units (labeled with the true count)
 * rather than all of them, the same simplification the Q/K/V matrix
 * equations use ("⋯" for repeated entries). */
export function FeedForwardDiagram() {
  const width = 460;
  const height = 260;
  const inX = 60;
  const hidX = 230;
  const outX = 400;
  const topY = 30;
  const bottomY = 236;

  const spread = (n: number) => Array.from({ length: n }, (_, i) => topY + (i * (bottomY - topY)) / (n - 1));
  const inYs = spread(D_MODEL);
  const outYs = inYs;
  const hidYs = spread(HIDDEN_SHOWN);

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {inYs.map((iy, i) =>
          hidYs.map((hy, h) => (
            <line key={`ih-${i}-${h}`} x1={inX} y1={iy} x2={hidX} y2={hy} stroke={NEUTRAL} strokeWidth={1} opacity={0.6} />
          ))
        )}
        {hidYs.map((hy, h) =>
          outYs.map((oy, o) => (
            <line key={`ho-${h}-${o}`} x1={hidX} y1={hy} x2={outX} y2={oy} stroke={NEUTRAL} strokeWidth={1} opacity={0.6} />
          ))
        )}

        {inYs.map((y, i) => (
          <circle key={`in-${i}`} cx={inX} cy={y} r={8} fill="rgba(124,58,237,0.15)" stroke={PURPLE} strokeWidth={1.5} />
        ))}
        {hidYs.map((y, h) => (
          <circle key={`hid-${h}`} cx={hidX} cy={y} r={8} fill="rgba(8,145,178,0.15)" stroke={CYAN} strokeWidth={1.5} />
        ))}
        {outYs.map((y, o) => (
          <circle key={`out-${o}`} cx={outX} cy={y} r={8} fill="rgba(124,58,237,0.15)" stroke={PURPLE} strokeWidth={1.5} />
        ))}

        <text x={hidX} y={16} fontSize={12} textAnchor="middle" fill={CYAN}>
          ⋮ {HIDDEN_TOTAL} total
        </text>

        <text x={(inX + hidX) / 2} y={16} fontSize={12} textAnchor="middle" fill={PURPLE}>
          W₁, b₁
        </text>
        <text x={(hidX + outX) / 2} y={16} fontSize={12} textAnchor="middle" fill={PURPLE}>
          W₂, b₂
        </text>

        <text x={inX} y={height - 6} fontSize={12} textAnchor="middle" fill="#525252">
          {D_MODEL} dims (x)
        </text>
        <text x={hidX} y={height - 6} fontSize={12} textAnchor="middle" fill="#525252">
          {HIDDEN_TOTAL} hidden, ReLU
        </text>
        <text x={outX} y={height - 6} fontSize={12} textAnchor="middle" fill="#525252">
          {D_MODEL} dims
        </text>
      </svg>
    </div>
  );
}
