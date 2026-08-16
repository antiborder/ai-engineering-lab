interface Series {
  label: string;
  color: string;
  values: number[];
}

/** Minimal dependency-free SVG line chart for train/test loss curves. */
export function LossChart({ series, height = 160 }: { series: Series[]; height?: number }) {
  const width = 420;
  const padding = { top: 10, right: 10, bottom: 24, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.values);
  const maxN = Math.max(1, ...series.map((s) => s.values.length));
  const maxY = allValues.length > 0 ? Math.max(...allValues, 0.001) : 1;

  const toPath = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padding.left + (i / Math.max(1, maxN - 1)) * innerW;
        const y = padding.top + innerH - (v / maxY) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxY);

  return (
    <svg width={width} height={height} className="text-neutral-500 max-w-full">
      {yTicks.map((t, i) => {
        const y = padding.top + innerH - (t / maxY) * innerH;
        return (
          <g key={i}>
            <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.15} />
            <text x={padding.left - 6} y={y + 3} fontSize={9} textAnchor="end" fill="currentColor">
              {t.toFixed(2)}
            </text>
          </g>
        );
      })}
      {series.map((s) => (
        <path key={s.label} d={toPath(s.values)} fill="none" stroke={s.color} strokeWidth={2} />
      ))}
      {series.map((s, i) => (
        <g key={s.label} transform={`translate(${padding.left + i * 90}, ${height - 6})`}>
          <rect width={8} height={8} y={-8} fill={s.color} />
          <text x={12} y={0} fontSize={10} fill="currentColor">
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
