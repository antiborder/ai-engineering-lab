const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

/** The whole-Unit "big picture" shown once, up front, before any of the
 * underlying pieces are introduced — bottom-to-top, matching the standard
 * Transformer-diagram convention, so later chapters have a shape to hang
 * their details on. Reflects what this app actually implements: a single
 * decoder-only stack (`transformer.ts`'s forward() calls `selfAttention`
 * once per block, always with `causal=true`, on one sequence — never a
 * second attention over a separate encoder output), Post-LN order (add the
 * residual, then normalize — `layerNorm(addMatrices(x, sublayerOut))`, not
 * the reverse). No separate encoder, no cross-attention. Detailed per-piece
 * diagrams (SublayerDiagram, BlockOverviewDiagram, FeedForwardDiagram, ...)
 * live later, in the chapters that actually explain each piece. */
export function ArchitectureOverviewDiagram() {
  const width = 300;
  const height = 340;
  const midX = width / 2;

  const blockX = 20;
  const blockW = width - blockX * 2;
  const sublayerW = blockW - 32;
  const sublayerX = blockX + 16;
  const sublayerH = 44;

  const blockBottom = 246;
  const attnY = blockBottom - 14 - sublayerH; // 188
  const ffnY = attnY - 20 - sublayerH; // 124
  const blockTop = ffnY - 34; // 90

  const tokenY = blockBottom + 18;
  const tokenH = 32;

  const softmaxY = blockTop - 32 - 18;
  const softmaxH = 32;

  return (
    <div className="w-full max-w-[300px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={midX} y={16} fontSize={12} textAnchor="middle" fill="#3f3f46">
          next-word probabilities
        </text>
        <line x1={midX} y1={22} x2={midX} y2={softmaxY - 4} stroke={NEUTRAL} strokeWidth={2} />
        <polygon points={`${midX - 4},${softmaxY - 4} ${midX + 4},${softmaxY - 4} ${midX},${softmaxY + 2}`} fill={NEUTRAL} />

        <rect x={sublayerX} y={softmaxY} width={sublayerW} height={softmaxH} rx={6} fill="rgba(124,58,237,0.1)" stroke={PURPLE} strokeWidth={2} />
        <text x={midX} y={softmaxY + softmaxH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
          Softmax
        </text>

        <line x1={midX} y1={softmaxY + softmaxH} x2={midX} y2={blockTop - 4} stroke={NEUTRAL} strokeWidth={2} />
        <polygon points={`${midX - 4},${blockTop - 4} ${midX + 4},${blockTop - 4} ${midX},${blockTop + 2}`} fill={NEUTRAL} />

        <rect x={blockX} y={blockTop} width={blockW} height={blockBottom - blockTop} rx={10} fill="none" stroke={NEUTRAL} strokeWidth={1.5} strokeDasharray="5,4" />
        <text x={blockX + 10} y={blockTop + 14} fontSize={12} fontWeight={700} fill="#525252">
          Transformer Block
        </text>
        <text x={blockX + 10} y={blockTop + 25} fontSize={12} fill="#737373">
          × N (this app: up to 3)
        </text>

        <rect x={sublayerX} y={ffnY} width={sublayerW} height={sublayerH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
        <text x={midX} y={ffnY + 18} fontSize={12} textAnchor="middle" fill="#3f3f46">
          Feed-Forward
        </text>
        <text x={midX} y={ffnY + 33} fontSize={12} textAnchor="middle" fill={ORANGE}>
          + residual, norm
        </text>

        <line x1={midX} y1={ffnY + sublayerH} x2={midX} y2={attnY - 4} stroke={NEUTRAL} strokeWidth={1.5} />
        <polygon points={`${midX - 3},${attnY - 4} ${midX + 3},${attnY - 4} ${midX},${attnY + 1}`} fill={NEUTRAL} />

        <rect x={sublayerX} y={attnY} width={sublayerW} height={sublayerH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
        <text x={midX} y={attnY + 18} fontSize={12} textAnchor="middle" fill="#3f3f46">
          Masked Self-Attention
        </text>
        <text x={midX} y={attnY + 33} fontSize={12} textAnchor="middle" fill={ORANGE}>
          + residual, norm
        </text>

        <line x1={midX} y1={blockBottom} x2={midX} y2={tokenY - 4} stroke={NEUTRAL} strokeWidth={2} />
        <polygon points={`${midX - 4},${tokenY - 4} ${midX + 4},${tokenY - 4} ${midX},${tokenY + 2}`} fill={NEUTRAL} />

        <rect x={sublayerX} y={tokenY} width={sublayerW} height={tokenH} rx={6} fill="rgba(161,161,170,0.12)" stroke={NEUTRAL} strokeWidth={2} />
        <text x={midX} y={tokenY + tokenH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
          Token + Position
        </text>

        <line x1={midX} y1={tokenY + tokenH} x2={midX} y2={height - 14} stroke={NEUTRAL} strokeWidth={2} />
        <polygon points={`${midX - 4},${height - 14} ${midX + 4},${height - 14} ${midX},${height - 8}`} fill={NEUTRAL} />
        <text x={midX} y={height - 2} fontSize={12} textAnchor="middle" fill="#3f3f46">
          input text
        </text>
      </svg>
      <p className="text-xs text-neutral-500 mt-1 text-center">
        One stack, always masked — no separate encoder, no second (cross-)attention. This is the
        &ldquo;decoder-only&rdquo; shape GPT-style models use.
      </p>
    </div>
  );
}
