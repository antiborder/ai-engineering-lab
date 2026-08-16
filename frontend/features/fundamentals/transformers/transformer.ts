import { mulberry32 } from "@/lib/random";

export interface TransformerConfig {
  dModel: number;
  numHeads: number;
  numLayers: number;
  seed: number;
}

interface AttnWeights {
  Wq: number[][];
  Wk: number[][];
  Wv: number[][];
  Wo: number[][];
}

interface FfnWeights {
  W1: number[][]; // [hidden][dModel]
  b1: number[];
  W2: number[][]; // [dModel][hidden]
  b2: number[];
}

interface LayerWeights {
  attn: AttnWeights;
  ffn: FfnWeights;
}

export type TransformerWeights = LayerWeights[];

export interface LayerTrace {
  attnByHead: number[][][]; // [head][queryPos][keyPos], post-softmax
}

export interface ForwardResult {
  embeddings: number[][]; // token + positional, before any layer
  layers: LayerTrace[];
  finalHidden: number[][];
  nextTokenLogits: { token: string; logit: number; prob: number }[];
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randMatrix(rows: number, cols: number, rng: () => number, scale: number): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (rng() * 2 - 1) * scale)
  );
}

/** Deterministic per-token embedding: same token string always maps to the
 * same vector (seeded by a hash of the string), so re-tokenizing the same
 * word elsewhere in the sequence — or across renders — is stable. */
export function tokenEmbedding(token: string, dModel: number): number[] {
  const rng = mulberry32(hashString(token));
  return Array.from({ length: dModel }, () => (rng() * 2 - 1) * 0.5);
}

export function positionalEncoding(pos: number, dModel: number): number[] {
  return Array.from({ length: dModel }, (_, i) => {
    const exponent = 2 * Math.floor(i / 2) / dModel;
    const angle = pos / 10000 ** exponent;
    return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
  });
}

export function buildEmbeddings(tokens: string[], dModel: number): number[][] {
  return tokens.map((tok, pos) => {
    const te = tokenEmbedding(tok, dModel);
    const pe = positionalEncoding(pos, dModel);
    return te.map((v, i) => v + pe[i]);
  });
}

/** Random (untrained) weights, fixed by `seed` — this section visualizes
 * Transformer *mechanics* (attention, masking, residuals), not a trained
 * model; training a tiny Transformer happens in the Tiny LLM section. */
export function initWeights(config: TransformerConfig): TransformerWeights {
  const rng = mulberry32(config.seed);
  const { dModel } = config;
  const hidden = dModel * 4;
  const attnScale = 1 / Math.sqrt(dModel);
  const ffnScale = 1 / Math.sqrt(dModel);

  return Array.from({ length: config.numLayers }, () => ({
    attn: {
      Wq: randMatrix(dModel, dModel, rng, attnScale),
      Wk: randMatrix(dModel, dModel, rng, attnScale),
      Wv: randMatrix(dModel, dModel, rng, attnScale),
      Wo: randMatrix(dModel, dModel, rng, attnScale),
    },
    ffn: {
      W1: randMatrix(hidden, dModel, rng, ffnScale),
      b1: new Array(hidden).fill(0),
      W2: randMatrix(dModel, hidden, rng, ffnScale),
      b2: new Array(dModel).fill(0),
    },
  }));
}

function matVec(W: number[][], x: number[]): number[] {
  return W.map((row) => row.reduce((sum, w, j) => sum + w * x[j], 0));
}

function applyLinear(X: number[][], W: number[][], b?: number[]): number[][] {
  return X.map((row) => {
    const out = matVec(W, row);
    return b ? out.map((v, i) => v + b[i]) : out;
  });
}

function addMatrices(a: number[][], b: number[][]): number[][] {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

function layerNorm(X: number[][]): number[][] {
  const eps = 1e-5;
  return X.map((row) => {
    const mean = row.reduce((s, v) => s + v, 0) / row.length;
    const variance = row.reduce((s, v) => s + (v - mean) ** 2, 0) / row.length;
    const std = Math.sqrt(variance + eps);
    return row.map((v) => (v - mean) / std);
  });
}

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => (s === -Infinity ? 0 : Math.exp(s - max)));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

function selfAttention(
  X: number[][],
  weights: AttnWeights,
  numHeads: number,
  causal: boolean
): { output: number[][]; attnByHead: number[][][] } {
  const seqLen = X.length;
  const dModel = X[0].length;
  const headDim = dModel / numHeads;

  const Q = applyLinear(X, weights.Wq);
  const K = applyLinear(X, weights.Wk);
  const V = applyLinear(X, weights.Wv);

  const slice = (row: number[], h: number) => row.slice(h * headDim, (h + 1) * headDim);
  const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

  const attnByHead: number[][][] = [];
  const concatOut: number[][] = Array.from({ length: seqLen }, () => new Array(dModel).fill(0));

  for (let h = 0; h < numHeads; h++) {
    const attn: number[][] = [];
    for (let i = 0; i < seqLen; i++) {
      const scores = new Array(seqLen).fill(0).map((_, j) => {
        if (causal && j > i) return -Infinity;
        return dot(slice(Q[i], h), slice(K[j], h)) / Math.sqrt(headDim);
      });
      const weightsRow = softmax(scores);
      attn.push(weightsRow);
      for (let j = 0; j < seqLen; j++) {
        const vj = slice(V[j], h);
        for (let d = 0; d < headDim; d++) {
          concatOut[i][h * headDim + d] += weightsRow[j] * vj[d];
        }
      }
    }
    attnByHead.push(attn);
  }

  return { output: applyLinear(concatOut, weights.Wo), attnByHead };
}

function relu(X: number[][]): number[][] {
  return X.map((row) => row.map((v) => Math.max(0, v)));
}

function feedForward(X: number[][], ffn: FfnWeights): number[][] {
  const hidden = relu(applyLinear(X, ffn.W1, ffn.b1));
  return applyLinear(hidden, ffn.W2, ffn.b2);
}

/** Runs one causal Transformer forward pass and returns every intermediate
 * value needed for inspection: embeddings, per-layer per-head attention
 * matrices, and a next-token distribution (tied to the input embeddings,
 * so it's a real softmax over real vectors even though nothing is
 * trained). */
export function forward(
  tokens: string[],
  weights: TransformerWeights,
  config: TransformerConfig
): ForwardResult {
  const embeddings = buildEmbeddings(tokens, config.dModel);
  let X = embeddings;
  const layers: LayerTrace[] = [];

  for (const layer of weights) {
    const { output: attnOut, attnByHead } = selfAttention(X, layer.attn, config.numHeads, true);
    const afterAttn = layerNorm(addMatrices(X, attnOut));
    const ffnOut = feedForward(afterAttn, layer.ffn);
    X = layerNorm(addMatrices(afterAttn, ffnOut));
    layers.push({ attnByHead });
  }

  const lastHidden = X.at(-1)!;
  const vocab = [...new Set(tokens)];
  const logits = vocab.map((tok) => {
    const emb = tokenEmbedding(tok, config.dModel);
    return { token: tok, logit: lastHidden.reduce((s, v, i) => s + v * emb[i], 0) };
  });
  const probs = softmax(logits.map((l) => l.logit));
  const nextTokenLogits = logits
    .map((l, i) => ({ ...l, prob: probs[i] }))
    .sort((a, b) => b.prob - a.prob);

  return { embeddings, layers, finalHidden: X, nextTokenLogits };
}
