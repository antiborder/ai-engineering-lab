import { describe, expect, it } from "vitest";
import { generateBlobsData, generateMoonsData, generateRegressionData } from "@/features/fundamentals/classical-ml/data";
import {
  LogisticRegressor,
  PolynomialRegressor,
  initCentroids,
  kmeansStep,
} from "@/features/fundamentals/classical-ml/models";

describe("PolynomialRegressor", () => {
  it("reduces training loss over successive gradient-descent steps", () => {
    const points = generateRegressionData(1, 60, 0.1, 1);
    let model = new PolynomialRegressor(3, 0, 0.6);
    const initialLoss = model.loss(points);

    for (let i = 0; i < 100; i++) {
      model = new PolynomialRegressor(3, 0, 0.6, model.nextWeights(points));
    }

    expect(model.loss(points)).toBeLessThan(initialLoss);
  });

  it("higher L2 regularization shrinks the learned weights", () => {
    const points = generateRegressionData(1, 60, 0.1, 1);

    const train = (lambda: number) => {
      let model = new PolynomialRegressor(8, lambda, 0.6);
      for (let i = 0; i < 200; i++) {
        model = new PolynomialRegressor(8, lambda, 0.6, model.nextWeights(points));
      }
      return model.weights.reduce((sum, w) => sum + w * w, 0);
    };

    expect(train(0.05)).toBeLessThan(train(0));
  });
});

describe("LogisticRegressor", () => {
  it("improves training accuracy over gradient-descent steps", () => {
    const points = generateMoonsData(1, 90, 0.15, 1);
    let model = new LogisticRegressor(3, 0, 1.2);
    const initialAcc = model.accuracy(points);

    for (let i = 0; i < 100; i++) {
      model = new LogisticRegressor(3, 0, 1.2, model.nextWeights(points));
    }

    expect(model.accuracy(points)).toBeGreaterThan(initialAcc);
    expect(model.accuracy(points)).toBeGreaterThan(0.8);
  });
});

describe("kmeans", () => {
  it("converges and decreases inertia monotonically", () => {
    const points = generateBlobsData(1, 90, 3);
    let centroids = initCentroids(points, 3, 42);

    let prevInertia = Infinity;
    let iteration = 0;
    for (let i = 0; i < 20; i++) {
      const result = kmeansStep(centroids, points, iteration);
      expect(result.inertia).toBeLessThanOrEqual(prevInertia + 1e-9);
      centroids = result.centroids;
      prevInertia = result.inertia;
      iteration = result.iteration;
    }
  });
});
