"use client";

import { useMemo, useState } from "react";
import { tokenize } from "./tokenize";
import { forward, initWeights, type TransformerConfig } from "./transformer";
import { TokenChips } from "./TokenChips";
import { AttentionHeatmap } from "./AttentionHeatmap";
import { NextTokenBars } from "./NextTokenBars";

const D_MODEL = 24;
const HEAD_OPTIONS = [1, 2, 3, 4, 6, 8];
const LAYER_OPTIONS = [1, 2, 3];
const DEFAULT_TEXT = "the quick brown fox jumps over the lazy dog";

const PIPELINE = [
  "Text",
  "Tokens",
  "Embeddings",
  "Q / K / V",
  "Attention",
  "Multi-Head Attention",
  "FFN",
  "Next Token",
];

export function TransformerLab() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [numHeads, setNumHeads] = useState(4);
  const [numLayers, setNumLayers] = useState(2);
  const [seed, setSeed] = useState(42);
  const [layerIndex, setLayerIndex] = useState(0);
  const [headIndex, setHeadIndex] = useState(0);

  const tokens = useMemo(() => tokenize(text), [text]);
  const config: TransformerConfig = useMemo(
    () => ({ dModel: D_MODEL, numHeads, numLayers, seed }),
    [numHeads, numLayers, seed]
  );
  const weights = useMemo(() => initWeights(config), [config]);
  const result = useMemo(
    () => (tokens.length > 0 ? forward(tokens, weights, config) : null),
    [tokens, weights, config]
  );

  const clampedLayer = Math.min(layerIndex, numLayers - 1);
  const clampedHead = Math.min(headIndex, numHeads - 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
        {PIPELINE.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-full border border-neutral-200 bg-white">
              {stage}
            </span>
            {i < PIPELINE.length - 1 && <span className="text-neutral-400">→</span>}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-neutral-600">Input text</label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-neutral-900 font-mono text-sm"
          maxLength={120}
        />
        <TokenChips tokens={tokens} />
        {tokens.length === 0 && (
          <p className="text-xs text-neutral-500">Type something to tokenize it.</p>
        )}
      </div>

      {result && (
        <div className="grid lg:grid-cols-[auto_1fr] gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-600 mb-2">
                Attention — layer {clampedLayer + 1} of {numLayers}, head {clampedHead + 1} of{" "}
                {numHeads}
              </div>
              <AttentionHeatmap
                tokens={tokens}
                attn={result.layers[clampedLayer].attnByHead[clampedHead]}
              />
              <p className="text-xs text-neutral-500 mt-2 max-w-md">
                Rows are the query token, columns are the key token. Brighter = more attention.
                Dark red cells are causally masked — a token can never attend to a token that
                comes after it, since that would leak the answer during generation.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <div className="text-neutral-600 mb-1">Layer</div>
                <select
                  value={clampedLayer}
                  onChange={(e) => setLayerIndex(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-900"
                >
                  {Array.from({ length: numLayers }, (_, i) => (
                    <option key={i} value={i}>
                      Layer {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <div className="text-neutral-600 mb-1">Head</div>
                <select
                  value={clampedHead}
                  onChange={(e) => setHeadIndex(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-900"
                >
                  {Array.from({ length: numHeads }, (_, i) => (
                    <option key={i} value={i}>
                      Head {i + 1}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <div className="text-neutral-600 mb-1">Number of heads</div>
                <select
                  value={numHeads}
                  onChange={(e) => setNumHeads(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-900"
                >
                  {HEAD_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h} head{h > 1 ? "s" : ""} ({D_MODEL / h}-dim each)
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <div className="text-neutral-600 mb-1">Transformer blocks</div>
                <select
                  value={numLayers}
                  onChange={(e) => setNumLayers(Number(e.target.value))}
                  className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-900"
                >
                  {LAYER_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l} layer{l > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={() => setSeed((s) => s + 1)}
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-800"
            >
              Reinitialize weights
            </button>

            <div>
              <div className="text-sm text-neutral-600 mb-2">
                Next-token prediction (from &ldquo;{tokens.at(-1)}&rdquo;)
              </div>
              <NextTokenBars predictions={result.nextTokenLogits} />
              <p className="text-xs text-neutral-500 mt-2 max-w-md">
                These weights are randomly initialized, not trained — so this distribution is
                close to uniform, not meaningful text prediction. It&rsquo;s a real softmax over real
                vectors, though: the Tiny LLM section trains a model like this one so the
                predictions actually get better.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
