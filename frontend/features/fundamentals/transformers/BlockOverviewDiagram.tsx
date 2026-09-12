const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

const BLOCKS = 2;

/** Schematic (not data-driven) "big picture" of this chapter's nesting:
 * a token flows through several Transformer Blocks (dashed outer boxes,
 * stacked top to bottom); each Block contains exactly two sublayers
 * (solid boxes) run in sequence — attention (+ residual, norm), then
 * feed-forward (+ residual, norm). Two Blocks are drawn as a concrete
 * example; the caption notes real stacks can go deeper. Deliberately
 * collapses each sublayer's internal add/normalize steps into one box —
 * SublayerDiagram covers that detail elsewhere in this chapter, so this
 * diagram's only job is showing how "sublayer" and "block" nest. */
export function BlockOverviewDiagram() {
  const width = 320;
  const blockH = 150;
  const blockGap = 34;
  const topMargin = 40;
  const bottomMargin = 26;
  const height = topMargin + BLOCKS * blockH + (BLOCKS - 1) * blockGap + bottomMargin;

  const blockX = 20;
  const blockW = width - blockX * 2;
  const sublayerW = blockW - 40;
  const sublayerX = blockX + 20;
  const sublayerH = 44;
  const midX = width / 2;

  const blockTop = (b: number) => topMargin + b * (blockH + blockGap);
  const lastBlockBottom = blockTop(BLOCKS - 1) + blockH;

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={midX} y={16} fontSize={14} textAnchor="middle" fill="#3f3f46">
          token in
        </text>
        <line x1={midX} y1={22} x2={midX} y2={topMargin - 4} stroke={NEUTRAL} strokeWidth={2} />
        <polygon points={`${midX - 4},${topMargin - 4} ${midX + 4},${topMargin - 4} ${midX},${topMargin + 2}`} fill={NEUTRAL} />

        {Array.from({ length: BLOCKS }, (_, b) => {
          const top = blockTop(b);
          const sub1Y = top + 24;
          const sub2Y = sub1Y + sublayerH + 20;
          return (
            <g key={b}>
              <rect x={blockX} y={top} width={blockW} height={blockH} rx={10} fill="none" stroke={NEUTRAL} strokeWidth={1.5} strokeDasharray="5,4" />
              <text x={blockX + 10} y={top + 14} fontSize={14} fontWeight={700} fill="#525252">
                Block {b + 1}
              </text>

              <rect x={sublayerX} y={sub1Y} width={sublayerW} height={sublayerH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
              <text x={midX} y={sub1Y + 18} fontSize={14} textAnchor="middle" fill="#3f3f46">
                Attention
              </text>
              <text x={midX} y={sub1Y + 33} fontSize={14} textAnchor="middle" fill={ORANGE}>
                + residual, norm
              </text>

              <line x1={midX} y1={sub1Y + sublayerH} x2={midX} y2={sub2Y - 4} stroke={NEUTRAL} strokeWidth={1.5} />
              <polygon points={`${midX - 3},${sub2Y - 4} ${midX + 3},${sub2Y - 4} ${midX},${sub2Y + 1}`} fill={NEUTRAL} />

              <rect x={sublayerX} y={sub2Y} width={sublayerW} height={sublayerH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
              <text x={midX} y={sub2Y + 18} fontSize={14} textAnchor="middle" fill="#3f3f46">
                Feed-Forward
              </text>
              <text x={midX} y={sub2Y + 33} fontSize={14} textAnchor="middle" fill={ORANGE}>
                + residual, norm
              </text>

              {b < BLOCKS - 1 && (
                <>
                  <line x1={midX} y1={top + blockH} x2={midX} y2={top + blockH + blockGap - 4} stroke={NEUTRAL} strokeWidth={2} />
                  <polygon
                    points={`${midX - 4},${top + blockH + blockGap - 4} ${midX + 4},${top + blockH + blockGap - 4} ${midX},${top + blockH + blockGap + 2}`}
                    fill={NEUTRAL}
                  />
                </>
              )}
            </g>
          );
        })}

        <line x1={midX} y1={lastBlockBottom} x2={midX} y2={height - 14} stroke={NEUTRAL} strokeWidth={2} />
        <polygon points={`${midX - 4},${height - 14} ${midX + 4},${height - 14} ${midX},${height - 8}`} fill={NEUTRAL} />
        <text x={midX} y={height - 2} fontSize={14} textAnchor="middle" fill="#3f3f46">
          richer vector out
        </text>
      </svg>
      <p className="text-sm text-neutral-500 mt-1 text-center">
        Two Blocks shown — real stacks can go deeper (this app: up to 3).
      </p>
    </div>
  );
}
