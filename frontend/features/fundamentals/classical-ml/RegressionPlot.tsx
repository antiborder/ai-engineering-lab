import type { PolynomialRegressor } from "./models";
import type { RegressionPoint } from "./data";

const WIDTH = 420;
const HEIGHT = 320;
const X_MIN = -1.15;
const X_MAX = 1.15;
const Y_MIN = -2.2;
const Y_MAX = 2.2;

function sx(x: number) {
  return ((x - X_MIN) / (X_MAX - X_MIN)) * WIDTH;
}
function sy(y: number) {
  return HEIGHT - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * HEIGHT;
}

export function RegressionPlot({
  points,
  model,
  showTrueFn,
}: {
  points: RegressionPoint[];
  model: PolynomialRegressor;
  showTrueFn: boolean;
}) {
  const samples = 80;
  const curve = Array.from({ length: samples + 1 }, (_, i) => {
    const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
    return { x, y: model.predict(x) };
  });
  const curvePath = curve
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
    .join(" ");

  const truePath = showTrueFn
    ? Array.from({ length: samples + 1 }, (_, i) => {
        const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
        return { x, y: Math.sin(2 * Math.PI * x) * 0.8 };
      })
        .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
        .join(" ")
    : null;

  return (
    <svg width={WIDTH} height={HEIGHT} className="bg-neutral-900 rounded-md border border-neutral-800">
      <line x1={0} x2={WIDTH} y1={sy(0)} y2={sy(0)} stroke="currentColor" strokeOpacity={0.15} />
      <line x1={sx(0)} x2={sx(0)} y1={0} y2={HEIGHT} stroke="currentColor" strokeOpacity={0.15} />
      {truePath && <path d={truePath} fill="none" stroke="#525252" strokeWidth={1.5} strokeDasharray="4 3" />}
      <path d={curvePath} fill="none" stroke="#22d3ee" strokeWidth={2} />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={3.5}
          fill={p.split === "train" ? "#a78bfa" : "#fb923c"}
          fillOpacity={0.85}
        />
      ))}
    </svg>
  );
}
