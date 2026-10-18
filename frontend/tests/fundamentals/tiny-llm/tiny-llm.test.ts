import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import { TinyLlmSession } from "@/features/fundamentals/tiny-llm/session";

beforeAll(async () => {
  await tf.setBackend("cpu");
});

describe("TinyLlmSession", () => {
  it("has the same parameter count as the equivalent PyTorch model", () => {
    const session = new TinyLlmSession();
    // vocab 40, 2 layers, 32-dim, 48-char context:
    // tok 40·32 + pos 48·32 + 2 × block 12,704 + final LN 64 + head 32·40
    expect(session.chars).toHaveLength(40);
    expect(session.model!.numParams()).toBe(29568);
  });

  it("lowers the training loss", { timeout: 60_000 }, async () => {
    const session = new TinyLlmSession({ n_layer: 1, n_head: 2, n_embd: 32, block_size: 32, lr: 0.01 });
    const losses = await session.trainSteps(40);
    const first = losses.slice(0, 5).reduce((a, b) => a + b) / 5;
    const last = losses.slice(-5).reduce((a, b) => a + b) / 5;
    expect(first).toBeGreaterThan(last + 0.3);
    expect(session.step).toBe(40);
  });

  it("generates the prompt followed by new characters", async () => {
    const session = new TinyLlmSession({ n_layer: 1, n_head: 1, n_embd: 16, block_size: 16, lr: 0.003 });
    const text = await session.generate("Alice", 20, 0.8);
    expect(text.startsWith("Alice")).toBe(true);
    expect(text).toHaveLength(25);
  });

  it("gives the same next-token distribution with a padded, fixed-length input", async () => {
    const session = new TinyLlmSession({ n_layer: 2, n_head: 2, n_embd: 16, block_size: 16, lr: 0.003 });
    const model = session.model!;
    const context = session.encode("Alice was");
    const reference = tf.tidy(() => {
      const logits = model.forward(tf.tensor2d([context], undefined, "int32"));
      const last = tf.reshape(tf.slice(logits, [0, context.length - 1, 0], [1, 1, -1]), [-1]);
      return tf.softmax(tf.div(last, 0.8)).dataSync();
    });
    const probs = await model.nextTokenProbs(context, 0.8);
    probs.forEach((p, i) => expect(p).toBeCloseTo(reference[i], 5));
  });

  it("does not leak tensors across training steps", async () => {
    const session = new TinyLlmSession({ n_layer: 1, n_head: 1, n_embd: 16, block_size: 16, lr: 0.003 });
    await session.trainSteps(1);
    const before = tf.memory().numTensors;
    await session.trainSteps(3);
    expect(tf.memory().numTensors).toBe(before);
  });
});
