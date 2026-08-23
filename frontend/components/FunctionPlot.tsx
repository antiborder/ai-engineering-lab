/** Minimal dependency-free SVG plot of y = fn(x) over [xMin, xMax] — used to
 * show what an activation function actually looks like (sigmoid, tanh,
 * ReLU) rather than leaving it as an equation only. Styled to match
 * LossChart: same width/viewBox/currentColor-axis conventions so it drops
 * into the same step layout without looking like a different component. */
export function FunctionPlot({
  fn,
  xMin,
  xMax,
  xLabel,
  yLabel,
  color = "#0891b2",
  height = 160,
  samples = 120,
}: {
  fn: (x: number) => number;
  xMin: number;
  xMax: number;
  xLabel: string;
  yLabel: string;
  color?: string;
  height?: number;
  samples?: number;
}) {
  const width = 420;
  const padding = { top: 12, right: 14, bottom: 30, left: 34 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const points = Array.from({ length: samples + 1 }, (_, i) => {
    const x = xMin + (i / samples) * (xMax - xMin);
    return { x, y: fn(x) };
  });
  const ys = points.map((p) => p.y);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yRange = yMax - yMin || 1;

  const toSvgX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * innerW;
  const toSvgY = (y: number) => padding.top + innerH - ((y - yMin) / yRange) * innerH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${toSvgX(p.x).toFixed(1)},${toSvgY(p.y).toFixed(1)}`)
    .join(" ");

  const zeroXVisible = xMin < 0 && xMax > 0;
  const zeroYVisible = yMin < 0 && yMax > 0;
  const axisY = padding.top + innerH;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="text-neutral-500 w-full h-auto max-w-[420px]"
    >
      {zeroYVisible && (
        <line x1={padding.left} x2={width - padding.right} y1={toSvgY(0)} y2={toSvgY(0)} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="3,3" />
      )}
      {zeroXVisible && (
        <line x1={toSvgX(0)} x2={toSvgX(0)} y1={padding.top} y2={axisY} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="3,3" />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      <line x1={padding.left} x2={width - padding.right} y1={axisY} y2={axisY} stroke="currentColor" strokeOpacity={0.5} />
      <line x1={padding.left} x2={padding.left} y1={padding.top} y2={axisY} stroke="currentColor" strokeOpacity={0.5} />
      {Array.from({ length: 5 }, (_, i) => xMin + (i / 4) * (xMax - xMin)).map((tickX, i) => {
        const svgX = toSvgX(tickX);
        return (
          <g key={i}>
            <line x1={svgX} x2={svgX} y1={axisY} y2={axisY + 4} stroke="currentColor" strokeOpacity={0.5} />
            <text
              x={svgX}
              y={axisY + 13}
              fontSize={9}
              textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}
              fill="currentColor"
            >
              {Number.isInteger(tickX) ? tickX : tickX.toFixed(1)}
            </text>
          </g>
        );
      })}
      <text x={padding.left + innerW / 2} y={height - 4} fontSize={10} textAnchor="middle" fill="currentColor">
        {xLabel}
      </text>
      <text x={12} y={padding.top + innerH / 2} fontSize={10} textAnchor="middle" fill="currentColor" transform={`rotate(-90, 12, ${padding.top + innerH / 2})`}>
        {yLabel}
      </text>
      <text x={padding.left - 4} y={padding.top + 8} fontSize={9} textAnchor="end" fill="currentColor">
        {yMax.toFixed(1)}
      </text>
      <text x={padding.left - 4} y={axisY} fontSize={9} textAnchor="end" fill="currentColor">
        {yMin.toFixed(1)}
      </text>
    </svg>
  );
}
