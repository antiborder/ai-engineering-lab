const HEAD_COLORS = ["#0891b2", "#7c3aed"];
const NEUTRAL = "#3f3f46";

const DIM = 8;
const HEADS = 2;
const HEAD_DIM = DIM / HEADS;

/** Schematic (not data-driven) diagram of how multi-head attention splits
 * one token's D-dimensional Q/K/V vector into per-head chunks, runs each
 * chunk through its own independent attention, then concatenates the
 * chunk-sized outputs back into one full-size vector. This is the actual
 * mechanism the "Splitting into heads" step describes in words — the real
 * per-head heatmaps elsewhere show the *result* of this, not the split
 * itself. */
export function MultiHeadSplitDiagram() {
  const width = 460;
  const height = 300;
  const cellW = 32;
  const cellGap = 4;
  const rowW = DIM * cellW + (DIM - 1) * cellGap;
  const startX = (width - rowW) / 2;

  const topY = 16;
  const cellH = 24;
  const headBoxY = 92;
  const headBoxH = 36;
  const outY = 182;
  const finalY = 252;

  const cellX = (i: number) => startX + i * (cellW + cellGap);

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={width / 2} y={topY - 4} fontSize={14} fill="#525252" textAnchor="middle">
          one token&rsquo;s Q (or K, or V) vector — {DIM} numbers
        </text>
        {Array.from({ length: DIM }, (_, i) => {
          const color = HEAD_COLORS[Math.floor(i / HEAD_DIM)];
          return (
            <rect key={i} x={cellX(i)} y={topY} width={cellW} height={cellH} rx={4} fill={`${color}1a`} stroke={color} strokeWidth={1.2} />
          );
        })}

        {Array.from({ length: HEADS }, (_, h) => {
          const color = HEAD_COLORS[h];
          const groupStartX = cellX(h * HEAD_DIM);
          const groupEndX = cellX(h * HEAD_DIM + HEAD_DIM - 1) + cellW;
          const groupCenterX = (groupStartX + groupEndX) / 2;
          const boxW = groupEndX - groupStartX;
          return (
            <g key={h}>
              <line x1={groupCenterX} y1={topY + cellH} x2={groupCenterX} y2={headBoxY} stroke={color} strokeWidth={1.5} />
              <rect x={groupStartX} y={headBoxY} width={boxW} height={headBoxH} rx={6} fill={`${color}14`} stroke={color} strokeWidth={1.5} />
              <text x={groupCenterX} y={headBoxY + headBoxH / 2 - 4} fontSize={14} fontWeight={700} textAnchor="middle" fill={color}>
                Head {h + 1} attention
              </text>
              <text x={groupCenterX} y={headBoxY + headBoxH / 2 + 10} fontSize={14} textAnchor="middle" fill="#525252">
                dims {h * HEAD_DIM}&ndash;{h * HEAD_DIM + HEAD_DIM - 1} only
              </text>
              <line x1={groupCenterX} y1={headBoxY + headBoxH} x2={groupCenterX} y2={outY} stroke={color} strokeWidth={1.5} />
            </g>
          );
        })}

        {Array.from({ length: DIM }, (_, i) => {
          const color = HEAD_COLORS[Math.floor(i / HEAD_DIM)];
          return (
            <rect key={`out-${i}`} x={cellX(i)} y={outY} width={cellW} height={cellH} rx={4} fill={`${color}1a`} stroke={color} strokeWidth={1.2} />
          );
        })}
        <text x={width / 2} y={outY + cellH + 14} fontSize={14} fill="#525252" textAnchor="middle">
          each head&rsquo;s own output — still {HEAD_DIM} numbers each
        </text>

        {Array.from({ length: DIM }, (_, i) => (
          <line
            key={`join-${i}`}
            x1={cellX(i) + cellW / 2}
            y1={outY + cellH + 20}
            x2={cellX(i) + cellW / 2}
            y2={finalY}
            stroke="#a3a3a3"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: DIM }, (_, i) => {
          const color = HEAD_COLORS[Math.floor(i / HEAD_DIM)];
          return (
            <rect key={`final-${i}`} x={cellX(i)} y={finalY} width={cellW} height={cellH} rx={4} fill={`${color}1a`} stroke={color} strokeWidth={1.2} />
          );
        })}
        <text x={width / 2} y={finalY + cellH + 14} fontSize={14} fontWeight={700} fill={NEUTRAL} textAnchor="middle">
          concatenated — {DIM} numbers again, one output per token
        </text>
      </svg>
    </div>
  );
}
