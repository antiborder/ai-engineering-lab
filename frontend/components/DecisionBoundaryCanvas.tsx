"use client";

import { useEffect, useRef } from "react";

export interface BoundaryPoint {
  x1: number;
  x2: number;
  label: 0 | 1;
  split: "train" | "test";
}

const WIDTH = 420;
const HEIGHT = 320;
const GRID = 56;
const CLASS_COLOR = ["#ea580c", "#0891b2"]; // label 0, label 1
// Small margin around the plot area so axis titles + numeric ticks have
// somewhere to live without overlapping the heatmap or points.
const PAD = { top: 8, right: 8, bottom: 24, left: 32 };
const PLOT_W = WIDTH - PAD.left - PAD.right;
const PLOT_H = HEIGHT - PAD.top - PAD.bottom;

/** Diverging orange -> white -> cyan scale for probability 0..1. A direct
 * orange<->cyan lerp meets in a muddy olive at 0.5 (a "confident coin
 * flip" reads as murky instead of neutral); routing through white at the
 * midpoint keeps the ends saturated and the middle legibly neutral. */
export function probColor(t: number): [number, number, number] {
  const lerp = (a: number, b: number, u: number) => Math.round(a + (b - a) * u);
  const orange: [number, number, number] = [234, 88, 12];
  const white: [number, number, number] = [245, 245, 244];
  const cyan: [number, number, number] = [8, 145, 178];
  const [from, to, u] = t < 0.5 ? [orange, white, t * 2] : [white, cyan, (t - 0.5) * 2];
  return [lerp(from[0], to[0], u), lerp(from[1], to[1], u), lerp(from[2], to[2], u)];
}

/** Renders any binary classifier's decision surface as a probability
 * heatmap plus the train/test points on top, redrawn on a canvas every
 * training step (spec section 11.1: "users should change parameters and
 * immediately see the effect"). Model-agnostic — takes a plain predict
 * function so both the classical-ml logistic regressor and the neural-net
 * MLP can share this component. */
export function DecisionBoundaryCanvas({
  points,
  predict,
  domain,
  highlightErrors = false,
  showBoundary = true,
  axisLabels = ["x₁", "x₂"],
}: {
  points: BoundaryPoint[];
  predict: (x1: number, x2: number) => number;
  domain: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** Rings misclassified points in red — used by the guided walkthrough to
   * make "the model is wrong here" visible per-point, not just as an
   * aggregate loss number. */
  highlightErrors?: boolean;
  /** Hides the probability heatmap — used by the walkthrough's first step,
   * which shows only the raw, unlabeled-by-a-model data. */
  showBoundary?: boolean;
  /** [x-axis title, y-axis title]. */
  axisLabels?: [string, string];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { xMin, xMax, yMin, yMax } = domain;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const toDataX = (px: number) => xMin + (px / PLOT_W) * (xMax - xMin);
    const toDataY = (py: number) => yMax - (py / PLOT_H) * (yMax - yMin);
    const sx = (x: number) => PAD.left + ((x - xMin) / (xMax - xMin)) * PLOT_W;
    const sy = (y: number) => PAD.top + PLOT_H - ((y - yMin) / (yMax - yMin)) * PLOT_H;

    const cellW = PLOT_W / GRID;
    const cellH = PLOT_H / GRID;
    if (showBoundary) {
      for (let gx = 0; gx < GRID; gx++) {
        for (let gy = 0; gy < GRID; gy++) {
          const px = gx * cellW + cellW / 2;
          const py = gy * cellH + cellH / 2;
          const prob = predict(toDataX(px), toDataY(py));
          ctx.fillStyle = `rgba(${probColor(prob).join(",")},0.4)`;
          ctx.fillRect(PAD.left + gx * cellW, PAD.top + gy * cellH, cellW + 1, cellH + 1);
        }
      }
    } else {
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.strokeRect(PAD.left, PAD.top, PLOT_W, PLOT_H);
    }

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.moveTo(PAD.left, sy(0));
    ctx.lineTo(PAD.left + PLOT_W, sy(0));
    ctx.moveTo(sx(0), PAD.top);
    ctx.lineTo(sx(0), PAD.top + PLOT_H);
    ctx.stroke();

    // Axis ticks (min / mid / max on each axis) and titles, drawn in the
    // margin so they never overlap the heatmap or points.
    ctx.fillStyle = "rgba(23,23,23,0.65)";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "center";
    [xMin, (xMin + xMax) / 2, xMax].forEach((t) => {
      ctx.fillText(t.toFixed(1), sx(t), PAD.top + PLOT_H + 12);
    });
    ctx.textAlign = "right";
    [yMin, (yMin + yMax) / 2, yMax].forEach((t) => {
      ctx.fillText(t.toFixed(1), PAD.left - 4, sy(t) + 3);
    });
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(axisLabels[0], WIDTH - 2, PAD.top + PLOT_H + 12);
    ctx.save();
    ctx.translate(9, PAD.top + 8);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "right";
    ctx.fillText(axisLabels[1], 0, 0);
    ctx.restore();

    for (const p of points) {
      ctx.beginPath();
      ctx.fillStyle = CLASS_COLOR[p.label];
      ctx.globalAlpha = p.split === "train" ? 0.95 : 0.55;
      ctx.arc(sx(p.x1), sy(p.x2), p.split === "train" ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      if (p.split === "test") {
        ctx.strokeStyle = "#0a0a0a";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (highlightErrors) {
        const predictedLabel = predict(p.x1, p.x2) >= 0.5 ? 1 : 0;
        if (predictedLabel !== p.label) {
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.strokeStyle = "#dc2626";
          ctx.lineWidth = 2;
          ctx.arc(sx(p.x1), sy(p.x2), 7, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }, [points, predict, xMin, xMax, yMin, yMax, highlightErrors, showBoundary, axisLabels]);

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="bg-white rounded-md border border-neutral-200 w-full h-auto"
      />
    </div>
  );
}
