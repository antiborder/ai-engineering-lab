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
const CLASS_COLOR = ["#fb923c", "#22d3ee"]; // label 0, label 1

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
}: {
  points: BoundaryPoint[];
  predict: (x1: number, x2: number) => number;
  domain: { xMin: number; xMax: number; yMin: number; yMax: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { xMin, xMax, yMin, yMax } = domain;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const toDataX = (px: number) => xMin + (px / WIDTH) * (xMax - xMin);
    const toDataY = (py: number) => yMax - (py / HEIGHT) * (yMax - yMin);
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * WIDTH;
    const sy = (y: number) => HEIGHT - ((y - yMin) / (yMax - yMin)) * HEIGHT;

    const cellW = WIDTH / GRID;
    const cellH = HEIGHT / GRID;
    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        const px = gx * cellW + cellW / 2;
        const py = gy * cellH + cellH / 2;
        const prob = predict(toDataX(px), toDataY(py));
        // Blend orange (class 0) -> cyan (class 1) by probability.
        const r = Math.round(251 * (1 - prob) + 34 * prob);
        const g = Math.round(146 * (1 - prob) + 211 * prob);
        const b = Math.round(60 * (1 - prob) + 238 * prob);
        ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
        ctx.fillRect(gx * cellW, gy * cellH, cellW + 1, cellH + 1);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.moveTo(0, sy(0));
    ctx.lineTo(WIDTH, sy(0));
    ctx.moveTo(sx(0), 0);
    ctx.lineTo(sx(0), HEIGHT);
    ctx.stroke();

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
    }
    ctx.globalAlpha = 1;
  }, [points, predict, xMin, xMax, yMin, yMax]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="bg-neutral-900 rounded-md border border-neutral-800"
    />
  );
}
