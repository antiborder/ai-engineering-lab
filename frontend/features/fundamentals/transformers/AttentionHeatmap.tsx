const CELL = 26;
const LABEL_MARGIN = 90;

/** Query rows × key columns. Cells above the diagonal (key position after
 * query position) are causally masked — shown as a blocked red tint
 * regardless of their (zero) weight, so masking reads as a rule, not just
 * "happens to be zero". Unmasked cells are shaded by attention weight. */
export function AttentionHeatmap({ tokens, attn }: { tokens: string[]; attn: number[][] }) {
  const n = tokens.length;
  const size = LABEL_MARGIN + n * CELL;

  return (
    <svg width={size} height={size} className="bg-neutral-900 rounded-md border border-neutral-800">
      {tokens.map((tok, i) => (
        <text
          key={`row-${i}`}
          x={LABEL_MARGIN - 6}
          y={LABEL_MARGIN + i * CELL + CELL / 2 + 4}
          textAnchor="end"
          fontSize={11}
          fill="#a3a3a3"
        >
          {tok}
        </text>
      ))}
      {tokens.map((tok, j) => (
        <text
          key={`col-${j}`}
          x={LABEL_MARGIN + j * CELL + CELL / 2}
          y={LABEL_MARGIN - 8}
          textAnchor="middle"
          fontSize={11}
          fill="#a3a3a3"
          transform={`rotate(-45, ${LABEL_MARGIN + j * CELL + CELL / 2}, ${LABEL_MARGIN - 8})`}
        >
          {tok}
        </text>
      ))}
      {attn.map((row, i) =>
        row.map((weight, j) => {
          const masked = j > i;
          const fill = masked ? "#450a0a" : `rgba(34, 211, 238, ${Math.min(1, weight * 2.2)})`;
          return (
            <rect
              key={`${i}-${j}`}
              x={LABEL_MARGIN + j * CELL}
              y={LABEL_MARGIN + i * CELL}
              width={CELL - 1}
              height={CELL - 1}
              fill={fill}
              fillOpacity={masked ? 0.5 : 1}
            />
          );
        })
      )}
    </svg>
  );
}
