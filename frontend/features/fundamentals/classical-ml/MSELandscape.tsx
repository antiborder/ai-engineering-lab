"use client";

import { useEffect, useRef } from "react";
import type { RegressionPoint } from "./data";
import { useDragRotate } from "@/lib/useDragRotate";

const WIDTH = 420;
const HEIGHT = 320;
const GRID = 22;
const W_MIN = -2;
const W_MAX = 2;

// True 3D rotate-then-project (not a fixed isometric angle) so the user can
// drag to look at the surface from any side. World units: floor spans
// roughly [-1,1] on both axes, height is exaggerated relative to that so
// the bowl/wall shape reads clearly.
const HEIGHT_WORLD = 1.15;
const SCALE = 118;
const ORIGIN_X = WIDTH / 2;
const ORIGIN_Y = HEIGHT / 2 + 45;
const DEFAULT_YAW = -0.7;
const DEFAULT_PITCH = 0.62;

function mse(w0: number, w1: number, points: RegressionPoint[]): number {
  if (points.length === 0) return 0;
  return points.reduce((sum, p) => sum + (w0 + w1 * p.x - p.y) ** 2, 0) / points.length;
}

function project(a: number, b: number, h: number, yaw: number, pitch: number) {
  const X = a;
  const Y = h * HEIGHT_WORLD;
  const Z = b;
  const X1 = X * Math.cos(yaw) + Z * Math.sin(yaw);
  const Z1 = -X * Math.sin(yaw) + Z * Math.cos(yaw);
  const Y2 = Y * Math.cos(pitch) - Z1 * Math.sin(pitch);
  const Z2 = Y * Math.sin(pitch) + Z1 * Math.cos(pitch);
  return { x: ORIGIN_X + X1 * SCALE, y: ORIGIN_Y - Y2 * SCALE, depth: Z2 };
}

function heightColor(t: number): string {
  // Low MSE (t=0, the valley) -> cyan; high MSE (t=1, the walls) -> warm red.
  const r = Math.round(8 + (220 - 8) * t);
  const g = Math.round(145 + (38 - 145) * t);
  const b = Math.round(178 + (38 - 178) * t);
  return `rgb(${r},${g},${b})`;
}

/** Renders the MSE loss surface over (w0, w1) as a shaded, freely-rotatable
 * 3D mesh (drag or touch-drag to orbit), with the current weight vector
 * marked and, when a training run has happened, the path gradient descent
 * actually walked down the surface — makes "descending the loss landscape"
 * a literal, visible thing rather than just a number going down. Only
 * meaningful for the 2-weight linear model. */
export function MSELandscape({
  points,
  current,
  path,
}: {
  points: RegressionPoint[];
  current: [number, number];
  /** Sequence of [w0, w1] visited so far by gradient descent, oldest first. */
  path?: [number, number][];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { yaw, pitch, isDefault, reset, bind } = useDragRotate(DEFAULT_YAW, DEFAULT_PITCH);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const norm = (w: number) => ((w - W_MIN) / (W_MAX - W_MIN)) * 2 - 1;

    const grid: number[][] = [];
    let maxMse = 0.0001;
    for (let i = 0; i <= GRID; i++) {
      const row: number[] = [];
      const w0 = W_MIN + (i / GRID) * (W_MAX - W_MIN);
      for (let j = 0; j <= GRID; j++) {
        const w1 = W_MIN + (j / GRID) * (W_MAX - W_MIN);
        const v = mse(w0, w1, points);
        row.push(v);
        if (v > maxMse) maxMse = v;
      }
      grid.push(row);
    }

    const cellAt = (i: number, j: number) => {
      const w0 = W_MIN + (i / GRID) * (W_MAX - W_MIN);
      const w1 = W_MIN + (j / GRID) * (W_MAX - W_MIN);
      const h = grid[i][j] / maxMse;
      return { a: norm(w0), b: norm(w1), h };
    };
    const pAt = (i: number, j: number) => {
      const c = cellAt(i, j);
      return project(c.a, c.b, c.h, yaw, pitch);
    };

    const cells: { i: number; j: number; depth: number }[] = [];
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const c00 = pAt(i, j);
        const c10 = pAt(i + 1, j);
        const c11 = pAt(i + 1, j + 1);
        const c01 = pAt(i, j + 1);
        cells.push({ i, j, depth: (c00.depth + c10.depth + c11.depth + c01.depth) / 4 });
      }
    }
    cells.sort((x, y) => x.depth - y.depth);

    for (const { i, j } of cells) {
      const c00 = cellAt(i, j);
      const c10 = cellAt(i + 1, j);
      const c11 = cellAt(i + 1, j + 1);
      const c01 = cellAt(i, j + 1);
      const p00 = project(c00.a, c00.b, c00.h, yaw, pitch);
      const p10 = project(c10.a, c10.b, c10.h, yaw, pitch);
      const p11 = project(c11.a, c11.b, c11.h, yaw, pitch);
      const p01 = project(c01.a, c01.b, c01.h, yaw, pitch);
      const avgH = (c00.h + c10.h + c11.h + c01.h) / 4;

      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(p01.x, p01.y);
      ctx.closePath();
      ctx.fillStyle = heightColor(avgH);
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (path && path.length > 1) {
      ctx.beginPath();
      path.forEach(([w0, w1], idx) => {
        const h = mse(w0, w1, points) / maxMse;
        const { x, y } = project(norm(w0), norm(w1), h, yaw, pitch);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const curH = mse(current[0], current[1], points) / maxMse;
    const cur = project(norm(current[0]), norm(current[1]), curH, yaw, pitch);
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fde047";
    ctx.fill();
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const w0Label = project(1, -1, 0, yaw, pitch);
    const w1Label = project(-1, 1, 0, yaw, pitch);
    ctx.fillStyle = "rgba(64,64,64,0.85)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("w₀", w0Label.x, w0Label.y + 16);
    ctx.fillText("w₁", w1Label.x, w1Label.y + 16);
    ctx.textAlign = "left";
    ctx.fillText("MSE ↑", 10, 20);
  }, [points, current, path, yaw, pitch]);

  return (
    <div className="relative w-full max-w-[420px] mx-auto">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="bg-white rounded-md border border-neutral-200 w-full h-auto touch-none cursor-grab active:cursor-grabbing"
        {...bind}
      />
      <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] text-neutral-400">
        drag to rotate
      </span>
      {!isDefault && (
        <button
          type="button"
          onClick={reset}
          className="absolute bottom-1.5 right-2 text-[10px] text-neutral-500 hover:text-neutral-800 bg-white/80 px-1.5 py-0.5 rounded"
        >
          ↺ reset view
        </button>
      )}
    </div>
  );
}
