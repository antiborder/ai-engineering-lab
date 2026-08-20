import type { PolynomialRegressor } from "./models";
import type { RegressionPoint } from "./data";

const WIDTH = 420;
const HEIGHT = 320;
const X_MIN = -1.15;
const X_MAX = 1.15;
const Y_MIN = -2.2;
const Y_MAX = 2.2;
// Margin around the plot area so axis titles + numeric ticks have somewhere
// to live without overlapping the curve or points.
const PAD = { top: 8, right: 10, bottom: 24, left: 32 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

function sx(x: number) {
  return PAD.left + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function sy(y: number) {
  return PAD.top + PLOT_H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function curvePathFor(model: PolynomialRegressor, samples = 80): string {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
    return { x, y: model.predict(x) };
  })
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
    .join(" ");
}

export function RegressionPlot({
  points,
  model,
  showTrueFn,
  showCurve = true,
  showErrors = false,
  compareModel,
}: {
  points: RegressionPoint[];
  model: PolynomialRegressor;
  showTrueFn: boolean;
  showCurve?: boolean;
  showErrors?: boolean;
  /** Draws a second, dashed curve (e.g. the earlier linear fit) so two
   * models can be compared on the same axes. */
  compareModel?: PolynomialRegressor;
}) {
  const samples = 80;
  const curvePath = curvePathFor(model, samples);
  const comparePath = compareModel ? curvePathFor(compareModel, samples) : null;

  const truePath = showTrueFn
    ? Array.from({ length: samples + 1 }, (_, i) => {
        const x = X_MIN + (i / samples) * (X_MAX - X_MIN);
        return { x, y: Math.sin(2 * Math.PI * x) * 0.8 };
      })
        .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
        .join(" ")
    : null;

  const xTicks = [X_MIN, 0, X_MAX];
  const yTicks = [Y_MIN, 0, Y_MAX];

  return (
    <div className="w-full max-w-[420px] mx-auto">
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="bg-white rounded-md border border-neutral-200 w-full h-auto"
    >
      <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} fill="none" stroke="rgba(0,0,0,0.08)" />
      <line x1={PAD.left} x2={PAD.left + PLOT_W} y1={sy(0)} y2={sy(0)} stroke="currentColor" strokeOpacity={0.35} />
      <line x1={sx(0)} x2={sx(0)} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="currentColor" strokeOpacity={0.35} />
      {truePath && <path d={truePath} fill="none" stroke="#525252" strokeWidth={1.5} strokeDasharray="4 3" />}
      {showErrors &&
        points
          .filter((p) => p.split === "train")
          .map((p, i) => (
            <line
              key={`err-${i}`}
              x1={sx(p.x)}
              x2={sx(p.x)}
              y1={sy(p.y)}
              y2={sy(model.predict(p.x))}
              stroke="#dc2626"
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
          ))}
      {comparePath && <path d={comparePath} fill="none" stroke="#9333ea" strokeWidth={2} strokeDasharray="6 4" />}
      {showCurve && <path d={curvePath} fill="none" stroke="#0891b2" strokeWidth={2} />}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={3.5}
          fill={p.split === "train" ? "#7c3aed" : "#ea580c"}
          fillOpacity={0.85}
        />
      ))}
      {xTicks.map((t, i) => (
        <text key={`xt-${i}`} x={sx(t)} y={PAD.top + PLOT_H + 13} fontSize={9} textAnchor="middle" fill="rgba(23,23,23,0.65)">
          {t.toFixed(1)}
        </text>
      ))}
      {yTicks.map((t, i) => (
        <text key={`yt-${i}`} x={PAD.left - 5} y={sy(t) + 3} fontSize={9} textAnchor="end" fill="rgba(23,23,23,0.65)">
          {t.toFixed(1)}
        </text>
      ))}
      <text x={WIDTH - 2} y={PAD.top + PLOT_H + 13} fontSize={10} textAnchor="end" fill="rgba(23,23,23,0.75)">
        x
      </text>
      <text x={9} y={PAD.top + 8} fontSize={10} textAnchor="start" fill="rgba(23,23,23,0.75)">
        y
      </text>
    </svg>
    </div>
  );
}
