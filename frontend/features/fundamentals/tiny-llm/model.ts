import * as tf from "@tensorflow/tfjs-core";
// tfjs-core ships its ops without their gradients; training needs them.
import "@tensorflow/tfjs-core/dist/register_all_gradients";

export interface TinyGptConfig {
  vocabSize: number;
  nLayer: number;
  nHead: number;
  nEmbd: number;
  blockSize: number;
}

interface Linear {
  w: tf.Variable; // [in, out]
  b: tf.Variable | null; // [out]
}

interface LayerNorm {
  gamma: tf.Variable;
  beta: tf.Variable;
}

interface Block {
  ln1: LayerNorm;
  qkv: Linear;
  proj: Linear;
  ln2: LayerNorm;
  fc1: Linear;
  fc2: Linear;
}

// Same default initializations PyTorch uses for nn.Linear / nn.Embedding /
// nn.LayerNorm, so the model starts from the same kind of random weights
// a PyTorch version of this model would.
function linear(nIn: number, nOut: number, bias = true): Linear {
  const bound = 1 / Math.sqrt(nIn);
  return {
    w: tf.variable(tf.randomUniform([nIn, nOut], -bound, bound)),
    b: bias ? tf.variable(tf.randomUniform([nOut], -bound, bound)) : null,
  };
}

function layerNorm(n: number): LayerNorm {
  return { gamma: tf.variable(tf.ones([n])), beta: tf.variable(tf.zeros([n])) };
}

function applyLinear(x: tf.Tensor, l: Linear): tf.Tensor {
  const shape = x.shape;
  const flat = tf.reshape(x, [-1, shape[shape.length - 1]]);
  let out: tf.Tensor = tf.matMul(flat, l.w);
  if (l.b) out = tf.add(out, l.b);
  return tf.reshape(out, [...shape.slice(0, -1), l.w.shape[1]!]);
}

function applyLayerNorm(x: tf.Tensor, ln: LayerNorm): tf.Tensor {
  const { mean, variance } = tf.moments(x, -1, true);
  const normalized = tf.div(tf.sub(x, mean), tf.sqrt(tf.add(variance, 1e-5)));
  return tf.add(tf.mul(normalized, ln.gamma), ln.beta);
}

/** Exact (erf-based) GELU, the same activation PyTorch's nn.GELU uses. */
function gelu(x: tf.Tensor): tf.Tensor {
  return tf.mul(tf.mul(x, 0.5), tf.add(tf.erf(tf.div(x, Math.SQRT2)), 1));
}

/** A deliberately tiny decoder-only Transformer (spec section 11.4) —
 * small enough to train from scratch in the browser in seconds, not a
 * scaled-down production model. Token + position embeddings, N blocks of
 * (LayerNorm → causal multi-head self-attention → residual, LayerNorm →
 * MLP → residual), a final LayerNorm, and a linear head over the vocab. */
export class TinyGPT {
  readonly config: TinyGptConfig;
  private readonly tokEmb: tf.Variable;
  private readonly posEmb: tf.Variable;
  private readonly blocks: Block[];
  private readonly lnF: LayerNorm;
  private readonly head: Linear;
  /** Additive causal mask: 0 where a position may attend, a large
   * negative number where it would be looking at a future token. */
  private readonly causalMask: tf.Tensor2D;

  constructor(config: TinyGptConfig) {
    const { vocabSize, nLayer, nHead, nEmbd, blockSize } = config;
    if (nEmbd % nHead !== 0) throw new Error("n_embd must be divisible by n_head");
    this.config = config;
    this.tokEmb = tf.variable(tf.randomNormal([vocabSize, nEmbd]));
    this.posEmb = tf.variable(tf.randomNormal([blockSize, nEmbd]));
    this.blocks = Array.from({ length: nLayer }, () => ({
      ln1: layerNorm(nEmbd),
      qkv: linear(nEmbd, 3 * nEmbd),
      proj: linear(nEmbd, nEmbd),
      ln2: layerNorm(nEmbd),
      fc1: linear(nEmbd, 4 * nEmbd),
      fc2: linear(4 * nEmbd, nEmbd),
    }));
    this.lnF = layerNorm(nEmbd);
    this.head = linear(nEmbd, vocabSize, false);
    this.causalMask = tf.tidy(() =>
      tf.mul(tf.sub(1, tf.linalg.bandPart(tf.ones([blockSize, blockSize]), -1, 0)), -1e9)
    ) as tf.Tensor2D;
  }

  variables(): tf.Variable[] {
    const ln = (l: LayerNorm) => [l.gamma, l.beta];
    const lin = (l: Linear) => (l.b ? [l.w, l.b] : [l.w]);
    return [
      this.tokEmb,
      this.posEmb,
      ...this.blocks.flatMap((b) => [...ln(b.ln1), ...lin(b.qkv), ...lin(b.proj), ...ln(b.ln2), ...lin(b.fc1), ...lin(b.fc2)]),
      ...ln(this.lnF),
      ...lin(this.head),
    ];
  }

  numParams(): number {
    return this.variables().reduce((n, v) => n + v.size, 0);
  }

  private attention(x: tf.Tensor, block: Block): tf.Tensor {
    const [B, T, C] = x.shape;
    const H = this.config.nHead;
    const D = C / H;
    const [q, k, v] = tf.split(applyLinear(x, block.qkv), 3, 2);
    // [B, T, C] -> [B*H, T, D] so each head attends independently
    const heads = (t: tf.Tensor) => tf.reshape(tf.transpose(tf.reshape(t, [B, T, H, D]), [0, 2, 1, 3]), [B * H, T, D]);
    const mask = tf.slice(this.causalMask, [0, 0], [T, T]);
    const scores = tf.add(tf.div(tf.matMul(heads(q), heads(k), false, true), Math.sqrt(D)), mask);
    const att = tf.softmax(scores);
    const merged = tf.reshape(tf.transpose(tf.reshape(tf.matMul(att, heads(v)), [B, H, T, D]), [0, 2, 1, 3]), [B, T, C]);
    return applyLinear(merged, block.proj);
  }

  /** idx: int32 token ids, shape [B, T]. Returns logits [B, T, vocab]. */
  forward(idx: tf.Tensor2D): tf.Tensor3D {
    const T = idx.shape[1];
    let x: tf.Tensor = tf.add(tf.gather(this.tokEmb, idx), tf.slice(this.posEmb, [0, 0], [T, -1]));
    for (const block of this.blocks) {
      x = tf.add(x, this.attention(applyLayerNorm(x, block.ln1), block));
      x = tf.add(x, applyLinear(gelu(applyLinear(applyLayerNorm(x, block.ln2), block.fc1)), block.fc2));
    }
    return applyLinear(applyLayerNorm(x, this.lnF), this.head) as tf.Tensor3D;
  }

  /** Mean cross-entropy of next-token predictions — the training loss. */
  loss(idx: tf.Tensor2D, targets: tf.Tensor2D): tf.Scalar {
    const logits = this.forward(idx);
    const V = this.config.vocabSize;
    const labels = tf.oneHot(tf.reshape(targets, [-1]) as tf.Tensor1D, V);
    return tf.losses.softmaxCrossEntropy(labels, tf.reshape(logits, [-1, V])) as tf.Scalar;
  }

  /** Probability distribution over the next token, given the context. */
  async nextTokenProbs(context: number[], temperature: number): Promise<Float32Array> {
    const { blockSize, vocabSize } = this.config;
    const window = context.slice(-blockSize);
    // Always run the model on a full blockSize-long input, right-padded
    // with token 0. The causal mask stops every position from seeing the
    // padding after it, so the logits at the last real position are
    // exactly what an unpadded input would give. A fixed input shape lets
    // WebGL reuse its compiled GPU programs instead of compiling new ones
    // for every new context length.
    const padded = Int32Array.from({ length: blockSize }, (_, i) => window[i] ?? 0);
    const logits = tf.tidy(() => this.forward(tf.tensor2d(padded, [1, blockSize], "int32")));
    const all = (await logits.data()) as Float32Array;
    logits.dispose();

    const last = all.subarray((window.length - 1) * vocabSize, window.length * vocabSize);
    const scaled = Array.from(last, (v) => v / Math.max(temperature, 1e-4));
    const max = Math.max(...scaled);
    const exps = scaled.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return Float32Array.from(exps, (e) => e / sum);
  }

  dispose(): void {
    for (const v of this.variables()) v.dispose();
    this.causalMask.dispose();
  }
}
