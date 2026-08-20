import type { Point2D } from "./data";

const SIZE = 320;
const RANGE = 7;
export const CLUSTER_PALETTE = ["#0891b2", "#ea580c", "#7c3aed", "#16a34a", "#db2777", "#ca8a04"];
const PAD = { top: 8, right: 8, bottom: 22, left: 30 };
const PLOT_W = SIZE - PAD.left - PAD.right;
const PLOT_H = SIZE - PAD.top - PAD.bottom;

function sx(v: number) {
  return PAD.left + ((v + RANGE) / (RANGE * 2)) * PLOT_W;
}
function sy(v: number) {
  return PAD.top + ((v + RANGE) / (RANGE * 2)) * PLOT_H;
}

export function ClusteringPlot({
  points,
  centroids,
  assignments,
}: {
  points: Point2D[];
  centroids: Point2D[];
  assignments: number[];
}) {
  const ticks = [-RANGE, 0, RANGE];
  return (
    <div className="w-full max-w-[320px] mx-auto">
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="bg-white rounded-md border border-neutral-200 w-full h-auto"
    >
      <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} fill="none" stroke="rgba(0,0,0,0.08)" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={sx(p.x1)}
          cy={sy(p.x2)}
          r={3.5}
          fill={assignments[i] !== undefined ? CLUSTER_PALETTE[assignments[i] % CLUSTER_PALETTE.length] : "#737373"}
          fillOpacity={0.8}
        />
      ))}
      {centroids.map((c, i) => (
        <g key={i} transform={`translate(${sx(c.x1)}, ${sy(c.x2)})`}>
          <line x1={-7} x2={7} y1={-7} y2={7} stroke="#171717" strokeWidth={2.5} />
          <line x1={-7} x2={7} y1={7} y2={-7} stroke="#171717" strokeWidth={2.5} />
          <line x1={-7} x2={7} y1={-7} y2={7} stroke={CLUSTER_PALETTE[i % CLUSTER_PALETTE.length]} strokeWidth={1.5} />
          <line x1={-7} x2={7} y1={7} y2={-7} stroke={CLUSTER_PALETTE[i % CLUSTER_PALETTE.length]} strokeWidth={1.5} />
        </g>
      ))}
      {ticks.map((t, i) => (
        <text key={`xt-${i}`} x={sx(t)} y={PAD.top + PLOT_H + 13} fontSize={9} textAnchor="middle" fill="rgba(23,23,23,0.65)">
          {t}
        </text>
      ))}
      {ticks.map((t, i) => (
        <text key={`yt-${i}`} x={PAD.left - 5} y={sy(t) + 3} fontSize={9} textAnchor="end" fill="rgba(23,23,23,0.65)">
          {t}
        </text>
      ))}
      <text x={SIZE - 2} y={PAD.top + PLOT_H + 13} fontSize={10} textAnchor="end" fill="rgba(23,23,23,0.75)">
        x₁
      </text>
      <text x={9} y={PAD.top + 8} fontSize={10} textAnchor="start" fill="rgba(23,23,23,0.75)">
        x₂
      </text>
    </svg>
    </div>
  );
}
