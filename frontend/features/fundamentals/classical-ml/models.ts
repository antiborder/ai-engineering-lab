import type { ClassificationPoint, Point2D, RegressionPoint } from "./data";
import { mulberry32 } from "@/lib/random";

function polyFeatures(x: number, degree: number): number[] {
  const f = [1];
  for (let d = 1; d <= degree; d++) f.push(x ** d);
  return f;
}

/** Polynomial regression model: a plain function of (weights, degree) plus
 * pure helpers. Weights live in React state so training a step is just
 * "compute next weights", never a mutation read back during render. */
export class PolynomialRegressor {
  degree: number;
  lambda: number;
  lr: number;
  weights: number[];

  constructor(degree: number, lambda: number, lr: number, initialWeights?: number[]) {
    this.degree = degree;
    this.lambda = lambda;
    this.lr = lr;
    this.weights = initialWeights ?? new Array(degree + 1).fill(0);
  }

  predict(x: number): number {
    const f = polyFeatures(x, this.degree);
    return f.reduce((sum, fi, i) => sum + fi * this.weights[i], 0);
  }

  loss(points: RegressionPoint[]): number {
    if (points.length === 0) return 0;
    const mse =
      points.reduce((sum, p) => sum + (this.predict(p.x) - p.y) ** 2, 0) / points.length;
    return mse;
  }

  /** Returns the weights after one batch gradient-descent update, without
   * mutating this instance. */
  nextWeights(trainPoints: RegressionPoint[]): number[] {
    const n = trainPoints.length;
    if (n === 0) return this.weights;
    const grad = new Array(this.weights.length).fill(0);
    for (const p of trainPoints) {
      const f = polyFeatures(p.x, this.degree);
      const err = this.predict(p.x) - p.y;
      for (let i = 0; i < f.length; i++) grad[i] += (2 * err * f[i]) / n;
    }
    for (let i = 1; i < this.weights.length; i++) grad[i] += (2 * this.lambda * this.weights[i]) / n;
    return this.weights.map((w, i) => w - this.lr * grad[i]);
  }
}

function polyFeatures2D(x1: number, x2: number, degree: number): number[] {
  const f = [1];
  for (let d = 1; d <= degree; d++) {
    for (let i = 0; i <= d; i++) f.push(x1 ** (d - i) * x2 ** i);
  }
  return f;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** Logistic regression with polynomial feature expansion. Same
 * weights-as-state design as PolynomialRegressor. */
export class LogisticRegressor {
  degree: number;
  lambda: number;
  lr: number;
  weights: number[];

  constructor(degree: number, lambda: number, lr: number, initialWeights?: number[]) {
    this.degree = degree;
    this.lambda = lambda;
    this.lr = lr;
    this.weights = initialWeights ?? new Array(polyFeatures2D(0, 0, degree).length).fill(0);
  }

  probability(x1: number, x2: number): number {
    const f = polyFeatures2D(x1, x2, this.degree);
    const z = f.reduce((sum, fi, i) => sum + fi * this.weights[i], 0);
    return sigmoid(z);
  }

  loss(points: ClassificationPoint[]): number {
    if (points.length === 0) return 0;
    const eps = 1e-7;
    const ce = points.reduce((sum, p) => {
      const prob = Math.min(Math.max(this.probability(p.x1, p.x2), eps), 1 - eps);
      return sum - (p.label === 1 ? Math.log(prob) : Math.log(1 - prob));
    }, 0);
    return ce / points.length;
  }

  accuracy(points: ClassificationPoint[]): number {
    if (points.length === 0) return 0;
    const correct = points.filter(
      (p) => (this.probability(p.x1, p.x2) >= 0.5 ? 1 : 0) === p.label
    ).length;
    return correct / points.length;
  }

  nextWeights(trainPoints: ClassificationPoint[]): number[] {
    const n = trainPoints.length;
    if (n === 0) return this.weights;
    const grad = new Array(this.weights.length).fill(0);
    for (const p of trainPoints) {
      const f = polyFeatures2D(p.x1, p.x2, this.degree);
      const err = this.probability(p.x1, p.x2) - p.label;
      for (let i = 0; i < f.length; i++) grad[i] += (err * f[i]) / n;
    }
    for (let i = 1; i < this.weights.length; i++) grad[i] += (this.lambda * this.weights[i]) / n;
    return this.weights.map((w, i) => w - this.lr * grad[i]);
  }
}

export interface KMeansState {
  centroids: Point2D[];
  assignments: number[];
  inertia: number;
  iteration: number;
}

/** k-means++-lite seeding: pick k distinct points at random as initial
 * centroids. Pure function so callers can hold the result in useState. */
export function initCentroids(points: Point2D[], k: number, seed: number): Point2D[] {
  const rng = mulberry32(seed);
  const shuffled = [...points].sort(() => rng() - 0.5);
  return shuffled.slice(0, k).map((p) => ({ ...p }));
}

/** One Lloyd's-algorithm iteration (assign + update), pure — returns a new
 * state rather than mutating anything, so it can animate as a sequence of
 * setState calls. */
export function kmeansStep(centroids: Point2D[], points: Point2D[], iteration: number): KMeansState {
  const assignments = points.map((p) => {
    let best = 0;
    let bestDist = Infinity;
    centroids.forEach((c, i) => {
      const d = (p.x1 - c.x1) ** 2 + (p.x2 - c.x2) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  });

  const sums = centroids.map(() => ({ x1: 0, x2: 0, count: 0 }));
  points.forEach((p, i) => {
    const c = sums[assignments[i]];
    c.x1 += p.x1;
    c.x2 += p.x2;
    c.count += 1;
  });
  const nextCentroids = centroids.map((c, i) =>
    sums[i].count > 0 ? { x1: sums[i].x1 / sums[i].count, x2: sums[i].x2 / sums[i].count } : c
  );

  const inertia = points.reduce((sum, p, i) => {
    const c = nextCentroids[assignments[i]];
    return sum + (p.x1 - c.x1) ** 2 + (p.x2 - c.x2) ** 2;
  }, 0);

  return { centroids: nextCentroids, assignments, inertia, iteration: iteration + 1 };
}
