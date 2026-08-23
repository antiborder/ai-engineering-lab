const CELL = 26;
const LABEL_MARGIN = 60;

/** Query rows × key columns. Cells above the diagonal (key position after
 * query position) are causally masked — shown as neutral light gray, since
 * they're simply unused (not a "blocked" value with meaning of its own).
 * Unmasked cells are shaded by attention weight, normalized per row (each
 * row's own min→max stretched to pale→fully-vivid cyan) rather than by raw
 * weight — real softmax rows from untrained weights cluster in a narrow
 * band, so a fixed scale makes every cell look nearly identical; per-row
 * contrast keeps "which key this query prefers" visible regardless. */
export function AttentionHeatmap({
  tokens,
  attn,
  maskAnnotation,
}: {
  tokens: string[];
  attn: number[][];
  /** Optional label drawn inside a dashed triangle framing the masked
   * region — for the one step introducing masking, where calling out
   * "this whole area is off-limits" is worth the extra ink. Every other
   * heatmap in the walkthrough omits this and stays plain. */
  maskAnnotation?: string;
}) {
  const n = tokens.length;
  const size = LABEL_MARGIN + n * CELL;
  const MIN_OPACITY = 0.12;

  // The masked (j > i) region is a staircase, but in a square-cell grid its
  // corners lie exactly on the straight line from p1 to p3 below — so a
  // plain triangle traces it perfectly without approximation.
  const p1 = { x: LABEL_MARGIN + CELL, y: LABEL_MARGIN };
  const p2 = { x: LABEL_MARGIN + n * CELL, y: LABEL_MARGIN };
  const p3 = { x: LABEL_MARGIN + n * CELL, y: LABEL_MARGIN + (n - 1) * CELL };
  const labelX = (p1.x + p3.x) / 2 + 0.35 * (p2.x - (p1.x + p3.x) / 2);
  const labelY = (p1.y + p3.y) / 2 + 0.35 * (p2.y - (p1.y + p3.y) / 2);

  return (
    // The heatmap's pixel size grows with token count, and its axis labels
    // are small text baked into the SVG's coordinate system — shrinking the
    // whole thing to fit a narrow viewport would make labels illegible, so
    // it scrolls horizontally instead of scaling down.
    <div className="w-full max-w-full overflow-x-auto">
    <svg width={size} height={size} className="bg-white rounded-md border border-neutral-200">
      {tokens.map((tok, i) => (
        <text
          key={`row-${i}`}
          x={LABEL_MARGIN - 6}
          y={LABEL_MARGIN + i * CELL + CELL / 2 + 4}
          textAnchor="end"
          fontSize={11}
          fill="#525252"
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
          fill="#525252"
          transform={`rotate(-45, ${LABEL_MARGIN + j * CELL + CELL / 2}, ${LABEL_MARGIN - 8})`}
        >
          {tok}
        </text>
      ))}
      {attn.map((row, i) => {
        const allowed = row.slice(0, i + 1);
        const minW = Math.min(...allowed);
        const maxW = Math.max(...allowed);
        const range = maxW - minW;
        return row.map((weight, j) => {
          const masked = j > i;
          const t = range > 1e-9 ? (weight - minW) / range : 1;
          const opacity = MIN_OPACITY + t * (1 - MIN_OPACITY);
          const fill = masked ? "#a3a3a3" : `rgba(34, 211, 238, ${opacity})`;
          return (
            <rect
              key={`${i}-${j}`}
              x={LABEL_MARGIN + j * CELL}
              y={LABEL_MARGIN + i * CELL}
              width={CELL - 1}
              height={CELL - 1}
              fill={fill}
            />
          );
        });
      })}
      {maskAnnotation && n >= 2 && (
        <polygon
          points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`}
          fill="none"
          stroke="#dc2626"
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />
      )}
      {maskAnnotation && n >= 3 && (
        <text
          x={labelX}
          y={labelY}
          fontSize={9}
          fontWeight={600}
          textAnchor="middle"
          fill="#ffffff"
          transform={`rotate(45, ${labelX}, ${labelY})`}
        >
          {maskAnnotation}
        </text>
      )}
    </svg>
    </div>
  );
}
