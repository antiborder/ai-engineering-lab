export type SublayerPart = "input" | "sublayer" | "residual" | "norm" | "output";

const DIM = 0.22;
const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

/** Schematic of the "residual sublayer" wrapper every part of a Transformer
 * block uses: x -> sublayer(x) -> add x back -> normalize -> output. Same
 * shape for both Attention and the FFN, which is the honest point — only
 * `sublayerLabel` changes between the two steps that use this. */
export function SublayerDiagram({
  sublayerLabel,
  highlight,
}: {
  sublayerLabel: string;
  highlight?: SublayerPart[];
}) {
  const width = 460;
  const height = 200;
  const op = (part: SublayerPart) => (!highlight || highlight.length === 0 ? 1 : highlight.includes(part) ? 1 : DIM);
  const sw = (part: SublayerPart, base: number) => (highlight?.includes(part) ? base + 1.5 : base);

  const inX = 40;
  const subX = 165;
  const addX = 275;
  const normX = 370;
  const outX = 432;
  const cy = 110;

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white rounded-md border border-neutral-200 w-full h-auto"
      >
        <g opacity={op("residual")}>
          <path
            d={`M ${inX + 22} ${cy - 18} C ${inX + 40} ${cy - 68}, ${addX - 40} ${cy - 68}, ${addX} ${cy - 16}`}
            fill="none"
            stroke={ORANGE}
            strokeWidth={sw("residual", 2)}
          />
          <text x={(inX + addX) / 2} y={cy - 56} fontSize={14} textAnchor="middle" fill={ORANGE}>
            + old_x (residual)
          </text>
        </g>

        <g opacity={op("input")}>
          <rect x={inX - 22} y={cy - 16} width={44} height={32} rx={6} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={sw("input", 2)} />
          <text x={inX} y={cy + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">old_x</text>
        </g>

        <line x1={inX + 22} y1={cy} x2={subX - 48} y2={cy} stroke={NEUTRAL} strokeWidth={2} opacity={Math.min(op("input"), op("sublayer"))} />
        <g opacity={op("sublayer")}>
          <rect x={subX - 48} y={cy - 18} width={96} height={36} rx={6} fill="rgba(8,145,178,0.12)" stroke={CYAN} strokeWidth={sw("sublayer", 2)} />
          <text x={subX} y={cy + 5} fontSize={14} textAnchor="middle" fill="#3f3f46">{sublayerLabel}</text>
        </g>

        <line x1={subX + 48} y1={cy} x2={addX - 15} y2={cy} stroke={NEUTRAL} strokeWidth={2} opacity={Math.min(op("sublayer"), op("residual"))} />
        <g opacity={op("residual")}>
          <circle cx={addX} cy={cy} r={15} fill="rgba(234,88,12,0.12)" stroke={ORANGE} strokeWidth={sw("residual", 2)} />
          <text x={addX} y={cy + 5} fontSize={16} textAnchor="middle" fill="#3f3f46">+</text>
        </g>

        <line x1={addX + 15} y1={cy} x2={normX - 40} y2={cy} stroke={NEUTRAL} strokeWidth={2} opacity={Math.min(op("residual"), op("norm"))} />
        <g opacity={op("norm")}>
          <rect x={normX - 40} y={cy - 18} width={80} height={36} rx={6} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={sw("norm", 2)} />
          <text x={normX} y={cy + 5} fontSize={14} textAnchor="middle" fill="#3f3f46">LayerNorm</text>
        </g>

        <g opacity={op("output")}>
          <line x1={normX + 40} y1={cy} x2={outX - 6} y2={cy} stroke={PURPLE} strokeWidth={sw("output", 2)} />
          <polygon points={`${outX - 6},${cy - 5} ${outX + 6},${cy} ${outX - 6},${cy + 5}`} fill={PURPLE} />
        </g>
      </svg>
    </div>
  );
}
