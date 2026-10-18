import * as tf from "@tensorflow/tfjs-core";
import { TINY_LLM_CORPUS } from "./corpus";
import { TinyGPT } from "./model";

const MAX_LOSS_HISTORY = 200;
const BATCH_SIZE = 32;
// PyTorch's AdamW default, applied as decoupled weight decay below.
const WEIGHT_DECAY = 0.01;

export interface TinyLlmConfig {
  n_layer: number;
  n_head: number;
  n_embd: number;
  block_size: number;
  lr: number;
}

export const DEFAULT_CONFIG: TinyLlmConfig = { n_layer: 2, n_head: 2, n_embd: 32, block_size: 48, lr: 0.003 };

/** Holds the one Tiny LLM model/optimizer this browser tab trains — one
 * architecture, one training run at a time, matching how the lab
 * presents it. Everything runs on the visitor's own device. */
export class TinyLlmSession {
  readonly chars: string[];
  private readonly stoi: Map<string, number>;
  private readonly data: Int32Array;

  config: TinyLlmConfig = DEFAULT_CONFIG;
  model: TinyGPT | null = null;
  private optimizer: tf.AdamOptimizer | null = null;
  step = 0;
  lossHistory: number[] = [];

  constructor(config: TinyLlmConfig = DEFAULT_CONFIG) {
    this.chars = [...new Set(TINY_LLM_CORPUS)].sort();
    this.stoi = new Map(this.chars.map((ch, i) => [ch, i]));
    this.data = Int32Array.from(TINY_LLM_CORPUS, (ch) => this.stoi.get(ch)!);
    this.reset(config);
  }

  encode(text: string): number[] {
    return [...text].flatMap((ch) => (this.stoi.has(ch) ? [this.stoi.get(ch)!] : []));
  }

  decode(ids: number[]): string {
    return ids.map((i) => this.chars[i]).join("");
  }

  reset(config: TinyLlmConfig): void {
    this.model?.dispose();
    this.optimizer?.dispose();
    const blockSize = Math.min(config.block_size, this.data.length - 1);
    this.config = { ...config, block_size: blockSize };
    this.model = new TinyGPT({
      vocabSize: this.chars.length,
      nLayer: config.n_layer,
      nHead: config.n_head,
      nEmbd: config.n_embd,
      blockSize,
    });
    this.optimizer = tf.train.adam(config.lr, 0.9, 0.999, 1e-8);
    this.step = 0;
    this.lossHistory = [];
  }

  private sampleBatch(): [tf.Tensor2D, tf.Tensor2D] {
    const blockSize = this.config.block_size;
    const maxStart = this.data.length - blockSize - 1;
    const x = new Int32Array(BATCH_SIZE * blockSize);
    const y = new Int32Array(BATCH_SIZE * blockSize);
    for (let b = 0; b < BATCH_SIZE; b++) {
      const start = Math.floor(Math.random() * (maxStart + 1));
      x.set(this.data.subarray(start, start + blockSize), b * blockSize);
      y.set(this.data.subarray(start + 1, start + blockSize + 1), b * blockSize);
    }
    return [tf.tensor2d(x, [BATCH_SIZE, blockSize], "int32"), tf.tensor2d(y, [BATCH_SIZE, blockSize], "int32")];
  }

  async trainSteps(steps: number): Promise<number[]> {
    const model = this.model!;
    const optimizer = this.optimizer!;
    const vars = model.variables();
    const decay = 1 - this.config.lr * WEIGHT_DECAY;
    const losses: number[] = [];

    for (let i = 0; i < steps; i++) {
      const [x, y] = this.sampleBatch();
      tf.tidy(() => {
        for (const v of vars) v.assign(tf.mul(v, decay));
      });
      const loss = optimizer.minimize(() => model.loss(x, y), true, vars)!;
      // Awaiting the value (instead of reading it synchronously) lets the
      // browser keep painting between steps, so the page stays responsive.
      const value = (await loss.data())[0];
      tf.dispose([x, y, loss]);

      this.step += 1;
      losses.push(value);
      this.lossHistory = [...this.lossHistory, value].slice(-MAX_LOSS_HISTORY);
    }
    return losses;
  }

  async generate(prompt: string, maxNewTokens: number, temperature: number): Promise<string> {
    const model = this.model!;
    const ids = this.encode(prompt);
    if (ids.length === 0) ids.push(0);
    for (let i = 0; i < maxNewTokens; i++) {
      const probs = await model.nextTokenProbs(ids, temperature);
      ids.push(sample(probs));
    }
    return this.decode(ids);
  }
}

function sample(probs: Float32Array): number {
  let r = Math.random();
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }
  return probs.length - 1;
}
