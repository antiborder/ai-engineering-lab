const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

/** Schematic "big picture" of this chapter, mirroring BlockOverviewDiagram's
 * role in the Transformer Block chapter: a token sequence flows through the
 * (already-covered) Transformer Blocks down to the last token's vector,
 * that vector gets scored against every candidate word and turned into
 * probabilities, the highest-probability word is picked, and — the part
 * that's new in this chapter — it loops back around, appended onto the
 * sequence, to predict the next word after that. Matches `forward()` in
 * transformer.ts: `nextTokenLogits` is derived from `X.at(-1)` only, and
 * the sandbox's `generateNext()` appends that token and re-runs `forward()`
 * on the longer sequence — this diagram is that loop, drawn once. */
export function GenerationLoopDiagram() {
  const width = 340;
  const height = 292;

  const boxX = 40;
  const boxW = 200;
  const midX = boxX + boxW / 2;
  const loopX = 300;

  const seqY = 14;
  const seqH = 32;

  const xformerY = seqY + seqH + 18; // 64
  const xformerH = 44;

  const vecY = xformerY + xformerH + 18; // 126
  const vecH = 32;

  const scoreY = vecY + vecH + 18; // 176
  const scoreH = 44;

  const pickY = scoreY + scoreH + 18; // 238
  const pickH = 32;

  const arrow = (y1: number, y2: number) => (
    <>
      <line x1={midX} y1={y1} x2={midX} y2={y2 - 4} stroke={NEUTRAL} strokeWidth={2} />
      <polygon points={`${midX - 4},${y2 - 4} ${midX + 4},${y2 - 4} ${midX},${y2 + 2}`} fill={NEUTRAL} />
    </>
  );

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <rect x={boxX} y={seqY} width={boxW} height={seqH} rx={6} fill="rgba(161,161,170,0.12)" stroke={NEUTRAL} strokeWidth={2} />
        <text x={midX} y={seqY + seqH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
          Token sequence (so far)
        </text>

        {arrow(seqY + seqH, xformerY)}

        <rect x={boxX} y={xformerY} width={boxW} height={xformerH} rx={8} fill="none" stroke={NEUTRAL} strokeWidth={1.5} strokeDasharray="5,4" />
        <text x={midX} y={xformerY + 17} fontSize={14} textAnchor="middle" fill="#3f3f46">
          Transformer Blocks
        </text>
        <text x={midX} y={xformerY + 33} fontSize={14} textAnchor="middle" fill="#737373">
          attention + FFN (covered)
        </text>

        {arrow(xformerY + xformerH, vecY)}

        <rect x={boxX} y={vecY} width={boxW} height={vecH} rx={6} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={2} />
        <text x={midX} y={vecY + vecH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
          Last token&rsquo;s vector
        </text>

        {arrow(vecY + vecH, scoreY)}

        <rect x={boxX} y={scoreY} width={boxW} height={scoreH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
        <text x={midX} y={scoreY + 18} fontSize={14} textAnchor="middle" fill="#3f3f46">
          Score every candidate word
        </text>
        <text x={midX} y={scoreY + 33} fontSize={14} textAnchor="middle" fill="#3f3f46">
          (dot product) → Softmax
        </text>

        {arrow(scoreY + scoreH, pickY)}

        <rect x={boxX} y={pickY} width={boxW} height={pickH} rx={6} fill="rgba(234,88,12,0.1)" stroke={ORANGE} strokeWidth={2} />
        <text x={midX} y={pickY + pickH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
          Highest probability → token
        </text>

        <path
          d={`M ${boxX + boxW} ${pickY + pickH / 2} C ${loopX} ${pickY + pickH / 2}, ${loopX} ${seqY + seqH / 2}, ${boxX + boxW} ${seqY + seqH / 2}`}
          fill="none"
          stroke={ORANGE}
          strokeWidth={2}
        />
        <polygon
          points={`${boxX + boxW + 8},${seqY + seqH / 2 - 4} ${boxX + boxW + 8},${seqY + seqH / 2 + 4} ${boxX + boxW},${seqY + seqH / 2}`}
          fill={ORANGE}
        />
        <text
          x={loopX + 8}
          y={(pickY + pickH / 2 + seqY + seqH / 2) / 2}
          fontSize={14}
          textAnchor="middle"
          fill={ORANGE}
          transform={`rotate(90 ${loopX + 8} ${(pickY + pickH / 2 + seqY + seqH / 2) / 2})`}
        >
          append, feed back in
        </text>
      </svg>
      <p className="text-sm text-neutral-500 mt-1 text-center">
        One trip around this loop predicts one word. Autoregressive generation is just this loop,
        repeated — the sequence gets one token longer each time around.
      </p>
    </div>
  );
}
