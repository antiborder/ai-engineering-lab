import { gaussian, mulberry32 } from "@/lib/random";

export interface RegressionPoint {
  x: number;
  y: number;
  split: "train" | "test";
}

export interface ClassificationPoint {
  x1: number;
  x2: number;
  label: 0 | 1;
  split: "train" | "test";
}

export interface Point2D {
  x1: number;
  x2: number;
}

/** True underlying function the regression task tries to recover — a
 * smooth curve that a low-degree polynomial underfits and a high-degree
 * polynomial can overfit once noise is added. */
export function trueRegressionFn(x: number): number {
  return Math.sin(2 * Math.PI * x) * 0.8;
}

export function generateRegressionData(
  seed: number,
  n: number,
  noiseStd: number,
  trainRatio: number
): RegressionPoint[] {
  const rng = mulberry32(seed);
  const points: RegressionPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = rng() * 2 - 1;
    const y = trueRegressionFn(x) + gaussian(rng, 0, noiseStd);
    points.push({ x, y, split: rng() < trainRatio ? "train" : "test" });
  }
  return points;
}

/** Two interleaving half-moons — a classic nonlinear-boundary demo: a
 * linear classifier underfits it, polynomial features let it separate. */
export function generateMoonsData(
  seed: number,
  n: number,
  noiseStd: number,
  trainRatio: number
): ClassificationPoint[] {
  const rng = mulberry32(seed);
  const points: ClassificationPoint[] = [];
  for (let i = 0; i < n; i++) {
    const label: 0 | 1 = i % 2 === 0 ? 0 : 1;
    const t = rng() * Math.PI;
    let x1: number;
    let x2: number;
    if (label === 0) {
      x1 = Math.cos(t);
      x2 = Math.sin(t);
    } else {
      x1 = 1 - Math.cos(t);
      x2 = 1 - Math.sin(t) - 0.5;
    }
    points.push({
      x1: x1 + gaussian(rng, 0, noiseStd),
      x2: x2 + gaussian(rng, 0, noiseStd),
      label,
      split: rng() < trainRatio ? "train" : "test",
    });
  }
  return points;
}

export function generateBlobsData(seed: number, n: number, k: number): Point2D[] {
  const rng = mulberry32(seed);
  const centers = Array.from({ length: k }, () => ({
    x1: rng() * 8 - 4,
    x2: rng() * 8 - 4,
  }));
  const points: Point2D[] = [];
  for (let i = 0; i < n; i++) {
    const c = centers[i % k];
    points.push({
      x1: gaussian(rng, c.x1, 0.6),
      x2: gaussian(rng, c.x2, 0.6),
    });
  }
  return points;
}
