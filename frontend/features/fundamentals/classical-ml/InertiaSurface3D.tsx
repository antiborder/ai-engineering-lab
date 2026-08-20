"use client";

import { useEffect, useRef } from "react";
import type { Point2D } from "./data";
import { CLUSTER_PALETTE } from "./ClusteringPlot";
import { useDragRotate } from "@/lib/useDragRotate";

const WIDTH = 420;
const HEIGHT = 320;
const GRID = 22;

const HEIGHT_WORLD = 1.1;
const SCALE = 118;
const ORIGIN_X = WIDTH / 2;
const ORIGIN_Y = HEIGHT / 2 + 45;
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

function nearestCentroid(x1: number, x2: number, centroids: Point2D[]) {
  let best = 0;
  let bestD = Infinity;
  centroids.forEach((c, i) => {
    const d = (x1 - c.x1) ** 2 + (x2 - c.x2) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return { idx: best, distSq: bestD };
}

function shade(hex: string, t: number): string {
  // Lerp the cluster's own color toward white as height (distance from its
  // centroid) increases — so each basin reads as one solid color, darkest
  // at the bottom (the centroid) and palest at the ridges between basins.
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lerp = (c: number) => Math.round(c + (245 - c) * t);
  return `rgb(${lerp(r)},${lerp(g)},${lerp(b)})`;
}

/** Renders k-means' objective — squared distance from every location to
 * its nearest centroid — as a shaded, freely-rotatable 3D relief: one
 * colored basin per cluster, bottoming out exactly at that cluster's
 * centroid. Summing this surface's height at every data point *is*
 * inertia, so this is the literal "loss landscape" for clustering, the
 * same role MSELandscape plays for regression and ProbabilitySurface3D
 * plays for classification. */
export function InertiaSurface3D({
  centroids,
  domain,
}: {
  centroids: Point2D[];
  domain: { xMin: number; xMax: number; yMin: number; yMax: number };
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

    if (centroids.length === 0) return;

    const normA = (x1: number) => ((x1 - xMin) / (xMax - xMin)) * 2 - 1;
    const normB = (x2: number) => ((x2 - yMin) / (yMax - yMin)) * 2 - 1;

    let maxDist = 0.0001;
    const grid: { idx: number; distSq: number }[][] = [];
    for (let i = 0; i <= GRID; i++) {
      const row: { idx: number; distSq: number }[] = [];
      const x1 = xMin + (i / GRID) * (xMax - xMin);
      for (let j = 0; j <= GRID; j++) {
        const x2 = yMin + (j / GRID) * (yMax - yMin);
        const n = nearestCentroid(x1, x2, centroids);
        row.push(n);
        if (n.distSq > maxDist) maxDist = n.distSq;
      }
      grid.push(row);
    }

    const cellAt = (i: number, j: number) => {
      const x1 = xMin + (i / GRID) * (xMax - xMin);
      const x2 = yMin + (j / GRID) * (yMax - yMin);
      const n = grid[i][j];
      return { a: normA(x1), b: normB(x2), h: n.distSq / maxDist, idx: n.idx };
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
      ctx.fillStyle = shade(CLUSTER_PALETTE[c00.idx % CLUSTER_PALETTE.length], avgH);
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    centroids.forEach((c, i) => {
      const p = project(normA(c.x1), normB(c.x2), 0, yaw, pitch);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = CLUSTER_PALETTE[i % CLUSTER_PALETTE.length];
      ctx.fill();
      ctx.strokeStyle = "#171717";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    const x1Label = project(1, -1, 0, yaw, pitch);
    const x2Label = project(-1, 1, 0, yaw, pitch);
    ctx.fillStyle = "rgba(64,64,64,0.85)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("x₁", x1Label.x, x1Label.y + 16);
    ctx.fillText("x₂", x2Label.x, x2Label.y + 16);
    ctx.textAlign = "left";
    ctx.fillText("distance² ↑", 10, 20);
  }, [centroids, xMin, xMax, yMin, yMax, yaw, pitch]);

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
