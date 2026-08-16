import { describe, expect, it } from "vitest";
import { generateMoonsData } from "@/features/fundamentals/classical-ml/data";
import { accuracy, initMlp, loss, nextWeights, type MlpConfig, type Sample } from "@/features/fundamentals/neural-networks/mlp";

const config: MlpConfig = { inputDim: 2, hiddenSizes: [6, 4], activation: "tanh" };

function toSamples(points: { x1: number; x2: number; label: 0 | 1 }[]): Sample[] {
  return points.map((p) => ({ x: [p.x1, p.x2], y: p.label }));
}

describe("MLP backprop", () => {
  it("matches a numerical (finite-difference) gradient", () => {
    const points = toSamples(generateMoonsData(1, 20, 0.15, 1));
    const weights = initMlp(config, 7);

    // analytic gradient, backed out of one lr=1, lambda=0 step: nextW = w - grad/n
    const analytic = nextWeights(weights, config, points, 1, 0);

    const eps = 1e-4;
    let checked = 0;
    for (const [l, layer] of weights.entries()) {
      for (const [i, row] of layer.W.entries()) {
        for (const j of row.keys()) {
          if (checked >= 6) continue; // a handful of spot checks is enough
          const bump = (delta: number) => {
            const w2 = weights.map((ly) => ({ W: ly.W.map((r) => [...r]), b: [...ly.b] }));
            w2[l].W[i][j] += delta;
            return loss(w2, config, points);
          };
          const numericalGrad = (bump(eps) - bump(-eps)) / (2 * eps);
          // nextWeights with lr=1, lambda=0 computes w - avg_grad, so the
          // average gradient (matching loss()'s per-sample-averaged BCE) is
          // just the difference.
          const analyticGrad = weights[l].W[i][j] - analytic[l].W[i][j];
          expect(analyticGrad).toBeCloseTo(numericalGrad, 2);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("training reduces loss and improves accuracy on a nonlinear dataset", () => {
    const points = toSamples(generateMoonsData(2, 90, 0.15, 1));
    let weights = initMlp(config, 3);
    const initialLoss = loss(weights, config, points);

    for (let i = 0; i < 300; i++) {
      weights = nextWeights(weights, config, points, 0.5, 0);
    }

    expect(loss(weights, config, points)).toBeLessThan(initialLoss);
    expect(accuracy(weights, config, points)).toBeGreaterThan(0.85);
  });
});
