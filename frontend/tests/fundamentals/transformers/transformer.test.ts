import { describe, expect, it } from "vitest";
import { tokenize } from "@/features/fundamentals/transformers/tokenize";
import {
  forward,
  initWeights,
  positionalEncoding,
  tokenEmbedding,
  type TransformerConfig,
} from "@/features/fundamentals/transformers/transformer";

const config: TransformerConfig = { dModel: 16, numHeads: 4, numLayers: 2, seed: 42 };

describe("tokenize", () => {
  it("splits words and punctuation into separate tokens", () => {
    expect(tokenize("Hello, world!")).toEqual(["hello", ",", "world", "!"]);
  });
});

describe("tokenEmbedding", () => {
  it("is deterministic for the same token and dimension", () => {
    expect(tokenEmbedding("fox", 16)).toEqual(tokenEmbedding("fox", 16));
  });

  it("differs between different tokens", () => {
    expect(tokenEmbedding("fox", 16)).not.toEqual(tokenEmbedding("dog", 16));
  });
});

describe("positionalEncoding", () => {
  it("differs by position", () => {
    expect(positionalEncoding(0, 16)).not.toEqual(positionalEncoding(1, 16));
  });
});

describe("forward", () => {
  const tokens = tokenize("the quick brown fox jumps over the lazy dog");
  const weights = initWeights(config);
  const result = forward(tokens, weights, config);

  it("produces one attention row per query position, per head, per layer", () => {
    expect(result.layers).toHaveLength(config.numLayers);
    for (const layer of result.layers) {
      expect(layer.attnByHead).toHaveLength(config.numHeads);
      for (const head of layer.attnByHead) {
        expect(head).toHaveLength(tokens.length);
      }
    }
  });

  it("each attention row is a probability distribution (softmax sums to 1)", () => {
    for (const layer of result.layers) {
      for (const head of layer.attnByHead) {
        for (const row of head) {
          const sum = row.reduce((s, v) => s + v, 0);
          expect(sum).toBeCloseTo(1, 5);
        }
      }
    }
  });

  it("applies causal masking — query i assigns zero weight to key j > i", () => {
    for (const layer of result.layers) {
      for (const head of layer.attnByHead) {
        head.forEach((row, i) => {
          row.forEach((weight, j) => {
            if (j > i) expect(weight).toBe(0);
          });
        });
      }
    }
  });

  it("next-token probabilities sum to 1 and cover exactly the input's unique tokens", () => {
    const uniqueTokens = new Set(tokens);
    expect(new Set(result.nextTokenLogits.map((l) => l.token))).toEqual(uniqueTokens);
    const sum = result.nextTokenLogits.reduce((s, l) => s + l.prob, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
