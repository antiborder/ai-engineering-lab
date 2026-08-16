import type { Point2D } from "./data";

const SIZE = 320;
const RANGE = 7;
const PALETTE = ["#22d3ee", "#fb923c", "#a78bfa", "#4ade80", "#f472b6", "#facc15"];

function s(v: number) {
  return ((v + RANGE) / (RANGE * 2)) * SIZE;
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
  return (
    <svg width={SIZE} height={SIZE} className="bg-neutral-900 rounded-md border border-neutral-800">
      {points.map((p, i) => (
        <circle
          key={i}
          cx={s(p.x1)}
          cy={s(p.x2)}
          r={3.5}
          fill={assignments[i] !== undefined ? PALETTE[assignments[i] % PALETTE.length] : "#737373"}
          fillOpacity={0.8}
        />
      ))}
      {centroids.map((c, i) => (
        <g key={i} transform={`translate(${s(c.x1)}, ${s(c.x2)})`}>
          <line x1={-7} x2={7} y1={-7} y2={7} stroke="white" strokeWidth={2.5} />
          <line x1={-7} x2={7} y1={7} y2={-7} stroke="white" strokeWidth={2.5} />
          <line x1={-7} x2={7} y1={-7} y2={7} stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.5} />
          <line x1={-7} x2={7} y1={7} y2={-7} stroke={PALETTE[i % PALETTE.length]} strokeWidth={1.5} />
        </g>
      ))}
    </svg>
  );
}
