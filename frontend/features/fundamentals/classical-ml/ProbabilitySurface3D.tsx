"use client";

import { useEffect, useRef } from "react";
import { probColor } from "@/components/DecisionBoundaryCanvas";
import { useDragRotate } from "@/lib/useDragRotate";

const WIDTH = 420;
const HEIGHT = 320;
const GRID = 22;

// True 3D rotate-then-project (not a fixed isometric angle) so the user can
// drag to look at the surface from any side — same approach as
// MSELandscape. Height (probability, already 0..1) is exaggerated in world
// units so the bend from flat to a sharp step reads clearly.
const HEIGHT_WORLD = 1.3;
const SCALE = 118;
const ORIGIN_X = WIDTH / 2;
const ORIGIN_Y = HEIGHT / 2 + 40;
const DEFAULT_YAW = -0.7;
const DEFAULT_PITCH = 0.62;

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

/** Renders a classifier's predicted probability P(y=1 | x1, x2) as a
 * shaded, freely-rotatable 3D surface (drag or touch-drag to orbit) — the
 * same "3D landscape" idea as MSELandscape, but for classification the
 * interesting surface is the model's *output* (bending from flat 0.5
 * toward a sharp step as it learns) rather than its loss. Where the
 * surface crosses the translucent 0.5 plane is exactly the decision
 * boundary shown flat in DecisionBoundaryCanvas. */
export function ProbabilitySurface3D({
  domain,
  predict,
}: {
  domain: { xMin: number; xMax: number; yMin: number; yMax: number };
  predict: (x1: number, x2: number) => number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { xMin, xMax, yMin, yMax } = domain;
  const { yaw, pitch, isDefault, reset, bind } = useDragRotate(DEFAULT_YAW, DEFAULT_PITCH);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const normA = (x1: number) => ((x1 - xMin) / (xMax - xMin)) * 2 - 1;
    const normB = (x2: number) => ((x2 - yMin) / (yMax - yMin)) * 2 - 1;

    const cellAt = (i: number, j: number) => {
      const x1 = xMin + (i / GRID) * (xMax - xMin);
      const x2 = yMin + (j / GRID) * (yMax - yMin);
      return { a: normA(x1), b: normB(x2), h: predict(x1, x2) };
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
      ctx.fillStyle = `rgb(${probColor(avgH).join(",")})`;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // The decision boundary lives wherever this surface crosses probability
    // 0.5 — draw that reference plane as a faint outline so it's visible as
    // a literal slice through the surface.
    ctx.beginPath();
    const corners: [number, number][] = [
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ];
    corners.forEach(([a, b], idx) => {
      const { x, y } = project(a, b, 0.5, yaw, pitch);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(23,23,23,0.4)";
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels near the floor diamond's two front edges.
    const x1Label = project(1, -1, 0, yaw, pitch);
    const x2Label = project(-1, 1, 0, yaw, pitch);
    ctx.fillStyle = "rgba(64,64,64,0.85)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("x₁", x1Label.x, x1Label.y + 16);
    ctx.fillText("x₂", x2Label.x, x2Label.y + 16);
    ctx.textAlign = "left";
    ctx.fillText("P(y=1) ↑", 10, 20);
  }, [xMin, xMax, yMin, yMax, predict, yaw, pitch]);

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
