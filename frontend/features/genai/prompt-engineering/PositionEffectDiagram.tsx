const CYAN = "#0891b2";
const NEUTRAL = "#a1a1aa";

const N = 9;

/** Illustrates the "lost in the middle" effect: models tend to weight the
 * start and end of a long context more heavily than the middle, so a bar's
 * height here stands for roughly how much attention that position tends to
 * get — a U shape, not flat. Schematic/illustrative (real attention
 * patterns vary by model), not measured data. The practical takeaway
 * (highlighted separately in the Step's body) is to put critical
 * instructions at the start and/or end of a long prompt, not buried in the
 * middle. */
export function PositionEffectDiagram() {
  const width = 320;
  const height = 150;
  const barW = 24;
  const gap = (width - N * barW) / (N + 1);
  const baseY = 110;
  const maxBarH = 80;

  // U-shaped curve: high at the ends, low in the middle.
  const heights = Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1); // 0..1
    const dip = Math.sin(t * Math.PI); // 0 at ends, 1 at middle
    return maxBarH * (1 - 0.72 * dip);
  });

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {heights.map((h, i) => {
          const x = gap + i * (barW + gap);
          return (
            <rect
              key={i}
              x={x}
              y={baseY - h}
              width={barW}
              height={h}
              rx={3}
              fill="rgba(8,145,178,0.15)"
              stroke={CYAN}
              strokeWidth={1.5}
            />
          );
        })}
        <line x1={0} y1={baseY} x2={width} y2={baseY} stroke={NEUTRAL} strokeWidth={1.5} />
        <text x={gap + barW / 2} y={baseY + 16} fontSize={14} textAnchor="middle" fill="#525252">
          start
        </text>
        <text x={width / 2} y={baseY + 16} fontSize={14} textAnchor="middle" fill="#525252">
          middle
        </text>
        <text x={width - gap - barW / 2} y={baseY + 16} fontSize={14} textAnchor="middle" fill="#525252">
          end
        </text>
        <text x={width / 2} y={20} fontSize={14} textAnchor="middle" fill="#737373">
          bar height ≈ how much attention that position tends to get
        </text>
      </svg>
    </div>
  );
}
