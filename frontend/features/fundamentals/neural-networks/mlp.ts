import { mulberry32 } from "@/lib/random";

export type Activation = "relu" | "tanh";

export interface MlpConfig {
  inputDim: number;
  hiddenSizes: number[];
  activation: Activation;
}

export interface DenseLayer {
  /** W[outIdx][inIdx] */
  W: number[][];
  b: number[];
}

export type MlpWeights = DenseLayer[];

export interface Sample {
  x: number[];
  y: 0 | 1;
}

function activate(z: number, fn: Activation): number {
  return fn === "relu" ? Math.max(0, z) : Math.tanh(z);
}

function activateDeriv(z: number, fn: Activation): number {
  return fn === "relu" ? (z > 0 ? 1 : 0) : 1 - Math.tanh(z) ** 2;
}

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/** Layer sizes including the input and the (always size-1, sigmoid) output
 * layer — used to size/initialize weight matrices. */
function layerSizes(config: MlpConfig): number[] {
  return [config.inputDim, ...config.hiddenSizes, 1];
}

export function initMlp(config: MlpConfig, seed: number): MlpWeights {
  const rng = mulberry32(seed);
  const sizes = layerSizes(config);
  const layers: MlpWeights = [];
  for (let l = 1; l < sizes.length; l++) {
    const fanIn = sizes[l - 1];
    const fanOut = sizes[l];
    const scale = Math.sqrt(2 / fanIn);
    const W = Array.from({ length: fanOut }, () =>
      Array.from({ length: fanIn }, () => (rng() * 2 - 1) * scale)
    );
    const b = new Array(fanOut).fill(0);
    layers.push({ W, b });
  }
  return layers;
}

interface ForwardTrace {
  /** Pre-activations z per layer (index 0 = first hidden layer). */
  zs: number[][];
  /** Activations per layer, activations[0] = input, last = output prob. */
  activations: number[][];
}

function forwardSample(weights: MlpWeights, config: MlpConfig, x: number[]): ForwardTrace {
  const zs: number[][] = [];
  const activations: number[][] = [x];
  let a = x;
  weights.forEach((layer, l) => {
    const isOutput = l === weights.length - 1;
    const z = layer.W.map((row, i) => row.reduce((sum, w, j) => sum + w * a[j], layer.b[i]));
    const nextA = isOutput ? [sigmoid(z[0])] : z.map((zi) => activate(zi, config.activation));
    zs.push(z);
    activations.push(nextA);
    a = nextA;
  });
  return { zs, activations };
}

export function predictProb(weights: MlpWeights, config: MlpConfig, x: number[]): number {
  return forwardSample(weights, config, x).activations.at(-1)![0];
}

export function accuracy(weights: MlpWeights, config: MlpConfig, points: Sample[]): number {
  if (points.length === 0) return 0;
  const correct = points.filter(
    (p) => (predictProb(weights, config, p.x) >= 0.5 ? 1 : 0) === p.y
  ).length;
  return correct / points.length;
}

export function loss(weights: MlpWeights, config: MlpConfig, points: Sample[]): number {
  if (points.length === 0) return 0;
  const eps = 1e-7;
  const ce = points.reduce((sum, p) => {
    const prob = Math.min(Math.max(predictProb(weights, config, p.x), eps), 1 - eps);
    return sum - (p.y === 1 ? Math.log(prob) : Math.log(1 - prob));
  }, 0);
  return ce / points.length;
}

/** Mean absolute activation per neuron across a batch, for the network
 * diagram's node intensity — how "active" each neuron typically is, given
 * the current weights. */
export function meanActivations(weights: MlpWeights, config: MlpConfig, points: Sample[]): number[][] {
  const sizes = layerSizes(config);
  const sums = sizes.map((n) => new Array(n).fill(0));
  for (const p of points) {
    const { activations } = forwardSample(weights, config, p.x);
    activations.forEach((layerActs, l) => {
      layerActs.forEach((v, i) => {
        sums[l][i] += Math.abs(v);
      });
    });
  }
  return sums.map((layerSums) => layerSums.map((s) => s / Math.max(1, points.length)));
}

function zeroLike(weights: MlpWeights): MlpWeights {
  return weights.map((layer) => ({
    W: layer.W.map((row) => row.map(() => 0)),
    b: layer.b.map(() => 0),
  }));
}

/** One batch gradient-descent step (backpropagation), pure — returns new
 * weights rather than mutating, matching the classical-ml labs' pattern of
 * keeping model state in React state, not in a ref. */
export function nextWeights(
  weights: MlpWeights,
  config: MlpConfig,
  points: Sample[],
  lr: number,
  lambda: number
): MlpWeights {
  const n = points.length;
  if (n === 0) return weights;

  const grads = zeroLike(weights);

  for (const p of points) {
    const { zs, activations } = forwardSample(weights, config, p.x);
    const outputActivation = activations.at(-1)![0];
    let delta: number[] = [outputActivation - p.y]; // BCE + sigmoid simplification

    for (let l = weights.length - 1; l >= 0; l--) {
      const aPrev = activations[l];
      const layerGrad = grads[l];
      delta.forEach((d, i) => {
        layerGrad.b[i] += d;
        aPrev.forEach((aVal, j) => {
          layerGrad.W[i][j] += d * aVal;
        });
      });

      if (l > 0) {
        const prevZ = zs[l - 1];
        const nextDelta = new Array(aPrev.length).fill(0);
        delta.forEach((d, i) => {
          weights[l].W[i].forEach((w, j) => {
            nextDelta[j] += w * d;
          });
        });
        delta = nextDelta.map((d, j) => d * activateDeriv(prevZ[j], config.activation));
      }
    }
  }

  return weights.map((layer, l) => ({
    W: layer.W.map((row, i) =>
      row.map((w, j) => w - lr * (grads[l].W[i][j] / n + (lambda * w) / n))
    ),
    b: layer.b.map((bVal, i) => bVal - lr * (grads[l].b[i] / n)),
  }));
}
