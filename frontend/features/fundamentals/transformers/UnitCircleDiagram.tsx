function point(angleDeg: number, r: number, cx: number, cy: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

/** Two points on a unit circle, with dashed lines dropped to each axis —
 * makes concrete why sin needs a cos partner: sin is just a point's height
 * (y), cos is its sideways position (x). Two different angles can share a
 * height (same sin) while sitting on opposite sides (opposite cos), so the
 * pair together is what actually pins down a unique angle. */
export function UnitCircleDiagram({
  angles = [30, 150],
  colors = ["#ea580c", "#7c3aed"],
}: {
  angles?: number[];
  colors?: string[];
}) {
  const cx = 100;
  const cy = 100;
  const r = 68;

  return (
    <div className="w-full max-w-[280px] mx-auto">
      <svg viewBox="0 0 200 200" className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#a1a1aa" strokeWidth={1.5} />
        <line x1={cx - r - 14} y1={cy} x2={cx + r + 14} y2={cy} stroke="#d4d4d8" strokeWidth={1} />
        <line x1={cx} y1={cy - r - 14} x2={cx} y2={cy + r + 14} stroke="#d4d4d8" strokeWidth={1} />
        <text x={cx + r + 16} y={cy + 4} fontSize={10} fill="#a1a1aa">cos</text>
        <text x={cx - 6} y={cy - r - 18} fontSize={10} fill="#a1a1aa">sin</text>
        {angles.map((angle, i) => {
          const p = point(angle, r, cx, cy);
          const color = colors[i % colors.length];
          const labelRight = p.x >= cx;
          return (
            <g key={angle}>
              <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={color} strokeWidth={2} />
              <line x1={p.x} y1={p.y} x2={p.x} y2={cy} stroke={color} strokeWidth={1.5} strokeDasharray="3,3" />
              <line x1={p.x} y1={p.y} x2={cx} y2={p.y} stroke={color} strokeWidth={1.5} strokeDasharray="3,3" />
              <circle cx={p.x} cy={p.y} r={4.5} fill={color} />
              <text x={p.x + (labelRight ? 9 : -9)} y={p.y - 7} fontSize={12} fontWeight={600} fill={color} textAnchor={labelRight ? "start" : "end"}>
                {angle}°
              </text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={2.5} fill="#3f3f46" />
      </svg>
    </div>
  );
}
