const CYAN = "#0891b2";
const BLOCKED = "#d4d4d8";

const TOKENS = ["the", "cat", "sat", "on", "mat"];
const QUERY_INDEX = 2;

/** Schematic (not data-driven) diagram of causal masking for one example
 * query token: arcs reach every earlier token (and itself, via the small
 * self-loop), and a × marks every later token it's forbidden to attend to.
 * Meant to give a concrete first picture of the rule before the real,
 * busier attention heatmap shows it in full. */
export function CausalMaskDiagram() {
  const width = 460;
  const height = 150;
  const boxW = 62;
  const gap = 14;
  const totalW = TOKENS.length * boxW + (TOKENS.length - 1) * gap;
  const startX = (width - totalW) / 2;
  const rowY = 96;
  const boxH = 30;

  const centerX = (i: number) => startX + i * (boxW + gap) + boxW / 2;
  const qx = centerX(QUERY_INDEX);

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <path
          d={`M ${qx - 14} ${rowY} Q ${qx} ${rowY - 40} ${qx + 14} ${rowY}`}
          fill="none"
          stroke={CYAN}
          strokeWidth={1.5}
          opacity={0.75}
        />
        {TOKENS.map((_, i) => {
          if (i === QUERY_INDEX) return null;
          const allowed = i < QUERY_INDEX;
          const x = centerX(i);
          const arcHeight = rowY - 24 - Math.abs(i - QUERY_INDEX) * 10;
          return allowed ? (
            <path
              key={`arc-${i}`}
              d={`M ${qx} ${rowY} Q ${(qx + x) / 2} ${arcHeight} ${x} ${rowY}`}
              fill="none"
              stroke={CYAN}
              strokeWidth={1.5}
              opacity={0.75}
            />
          ) : (
            <text key={`x-${i}`} x={x} y={arcHeight + 10} fontSize={13} textAnchor="middle" fill="#dc2626">
              ×
            </text>
          );
        })}

        {TOKENS.map((tok, i) => {
          const isQuery = i === QUERY_INDEX;
          const allowed = i <= QUERY_INDEX;
          const x = centerX(i);
          return (
            <g key={i}>
              <rect
                x={x - boxW / 2}
                y={rowY}
                width={boxW}
                height={boxH}
                rx={6}
                fill={isQuery ? "rgba(8,145,178,0.15)" : allowed ? "rgba(8,145,178,0.06)" : "#fafafa"}
                stroke={isQuery ? CYAN : allowed ? CYAN : BLOCKED}
                strokeWidth={isQuery ? 2 : 1.2}
              />
              <text x={x} y={rowY + boxH / 2 + 4} fontSize={12} textAnchor="middle" fill={allowed ? "#3f3f46" : "#a3a3a3"}>
                {tok}
              </text>
            </g>
          );
        })}

        <text x={qx} y={rowY + boxH + 18} fontSize={12} textAnchor="middle" fill={CYAN} fontWeight={700}>
          query token
        </text>
      </svg>
      <p className="text-xs text-neutral-500 mt-1 text-center">
        &ldquo;sat&rdquo; may attend to itself and every earlier word (arcs) — never to words that
        come later (×). Every token follows this same rule, wherever it sits in the sentence.
      </p>
    </div>
  );
}
