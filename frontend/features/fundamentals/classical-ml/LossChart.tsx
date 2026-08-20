interface Series {
  label: string;
  color: string;
  values: number[];
}

/** Minimal dependency-free SVG line chart for train/test loss curves.
 * `xLabel` names what the horizontal axis actually counts (training steps,
 * epochs, iterations, ...) — it varies by caller, so it must be passed in
 * rather than assumed. */
export function LossChart({
  series,
  height = 160,
  xLabel = "training step",
}: {
  series: Series[];
  height?: number;
  xLabel?: string;
}) {
  const width = 420;
  const padding = { top: 10, right: 10, bottom: 34, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.values);
  const maxN = Math.max(1, ...series.map((s) => s.values.length));
  const maxY = allValues.length > 0 ? Math.max(...allValues, 0.001) : 1;
  const lastStep = Math.max(0, maxN - 1);

  const toPath = (values: number[]) =>
    values
      .map((v, i) => {
        const x = padding.left + (i / Math.max(1, maxN - 1)) * innerW;
        const y = padding.top + innerH - (v / maxY) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * maxY);
  const axisY = padding.top + innerH;

  return (
    <div>
      <div className="flex gap-3 text-xs text-neutral-500 mb-1">
        {series.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="text-neutral-500 w-full h-auto max-w-[420px]"
      >
        {yTicks.map((t, i) => {
          const y = padding.top + innerH - (t / maxY) * innerH;
          return (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.35} />
              <text x={padding.left - 6} y={y + 3} fontSize={9} textAnchor="end" fill="currentColor">
                {t.toFixed(2)}
              </text>
            </g>
          );
        })}
        {series.map((s) => (
          <path key={s.label} d={toPath(s.values)} fill="none" stroke={s.color} strokeWidth={2} />
        ))}
        <line x1={padding.left} x2={width - padding.right} y1={axisY} y2={axisY} stroke="currentColor" strokeOpacity={0.5} />
        <text x={padding.left} y={axisY + 14} fontSize={9} textAnchor="start" fill="currentColor">
          0
        </text>
        <text x={width - padding.right} y={axisY + 14} fontSize={9} textAnchor="end" fill="currentColor">
          {lastStep}
        </text>
        <text x={padding.left + innerW / 2} y={axisY + 27} fontSize={10} textAnchor="middle" fill="currentColor">
          {xLabel}
        </text>
      </svg>
    </div>
  );
}
