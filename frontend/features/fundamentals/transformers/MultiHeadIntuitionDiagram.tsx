const CYAN = "#0891b2";
const PURPLE = "#7c3aed";

const TOKENS = ["the", "cat", "sat", "because", "it", "was", "tired"];
const NEARBY_PAIRS: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
];
const REFERENCE_PAIRS: [number, number][] = [[4, 1]];

function ArcRow({ pairs, color }: { pairs: [number, number][]; color: string }) {
  const width = 460;
  const boxW = 52;
  const gap = 8;
  const rowW = TOKENS.length * boxW + (TOKENS.length - 1) * gap;
  const startX = (width - rowW) / 2;
  const rowY = 54;
  const boxH = 26;
  const cellX = (i: number) => startX + i * (boxW + gap) + boxW / 2;

  return (
    <svg viewBox={`0 0 ${width} 90`} className="w-full h-auto">
      {pairs.map(([a, b], idx) => {
        const x1 = cellX(a);
        const x2 = cellX(b);
        const dist = Math.abs(b - a);
        const arcHeight = rowY - 14 - dist * 6;
        return (
          <path
            key={idx}
            d={`M ${x1} ${rowY} Q ${(x1 + x2) / 2} ${arcHeight} ${x2} ${rowY}`}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.75}
          />
        );
      })}
      {TOKENS.map((tok, i) => (
        <g key={i}>
          <rect x={cellX(i) - boxW / 2} y={rowY} width={boxW} height={boxH} rx={5} fill="white" stroke="#d4d4d8" strokeWidth={1} />
          <text x={cellX(i)} y={rowY + boxH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
            {tok}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Schematic (not data-driven) illustration of why one attention pattern
 * isn't enough: two hand-picked example patterns over the same sentence —
 * one that connects nearby words, one that connects a pronoun back to what
 * it refers to. Real heads discover patterns like these through training,
 * not by design; this is only meant to make "different kinds of
 * relevance" concrete before the real per-head heatmaps appear. */
export function MultiHeadIntuitionDiagram() {
  return (
    <div className="w-full max-w-[460px] mx-auto space-y-3">
      <div className="rounded-md border border-neutral-200 bg-white p-2">
        <div className="text-xs font-semibold text-cyan-700 mb-1">Head A (illustrative): nearby words</div>
        <ArcRow pairs={NEARBY_PAIRS} color={CYAN} />
      </div>
      <div className="rounded-md border border-neutral-200 bg-white p-2">
        <div className="text-xs font-semibold text-violet-700 mb-1">Head B (illustrative): what a word refers to</div>
        <ArcRow pairs={REFERENCE_PAIRS} color={PURPLE} />
      </div>
      <p className="text-xs text-neutral-500 text-center">
        Illustrative patterns — real heads discover connections like these through training, not
        by design.
      </p>
    </div>
  );
}
