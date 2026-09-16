"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Equation } from "@/components/Equation";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { tokenize } from "./tokenize";
import { forward, initWeights, layerNorm, type TransformerConfig } from "./transformer";
import { AttentionHeatmap } from "./AttentionHeatmap";
import { EmbeddingVector } from "./EmbeddingVector";
import { SublayerDiagram } from "./SublayerDiagram";
import { BlockStackDiagram } from "./BlockStackDiagram";
import { BlockOverviewDiagram } from "./BlockOverviewDiagram";
import { CombineDiagram } from "./CombineDiagram";
import { FeedForwardDiagram } from "./FeedForwardDiagram";
import { Slider } from "../classical-ml/Slider";
import type { ChapterId } from "./TransformerLab";

const D_MODEL = 8;
const DEFAULT_TEXT = "the cat sat on the mat";
const SEED = 7;
const LAYER_OPTIONS = [1, 2, 3];

/** Chapter 3 of the Transformers Unit: residual connections, layer
 * norm, the feed-forward network, and stacking blocks. See
 * TokensEmbeddingsWalkthrough.tsx for the split rationale. This Chapter has
 * no text-input step, so the sandbox text is fixed at DEFAULT_TEXT and
 * heads are fixed at 2 — only the block count is adjustable here. */
export function TransformerBlockWalkthrough({
  onComplete,
  onNavigateToChapter,
}: {
  onComplete?: () => void;
  onNavigateToChapter?: (chapter: ChapterId) => void;
}) {
  const [step, setStep] = useState(0);

  const tokens = useMemo(() => tokenize(DEFAULT_TEXT), []);
  const [numLayers, setNumLayers] = useState(1);
  const config: TransformerConfig = useMemo(
    () => ({ dModel: D_MODEL, numHeads: 2, numLayers, seed: SEED }),
    [numLayers]
  );
  const weights = useMemo(() => initWeights(config), [config]);
  const result = useMemo(
    () => (tokens.length > 0 ? forward(tokens, weights, config) : null),
    [tokens, weights, config]
  );

  const [layerIndex, setLayerIndex] = useState(0);
  const clampedLayer = Math.min(layerIndex, numLayers - 1);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";
  const chapterLinkBtn =
    "inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm font-semibold";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    chart?: ReactNode;
    controls?: ReactNode;
    onAdvance?: () => void;
    resetAction?: () => void;
  }

  const sampleNorm = layerNorm([[0.9, -2.1, 0.05, 3.4, -1.2, 0.2, 2.8, -0.6]])[0];
  const rawSample = [0.9, -2.1, 0.05, 3.4, -1.2, 0.2, 2.8, -0.6];

  const steps: Step[] = [
    // -------------------------- 9. Residual Connections & Layer Norm --------------------------
    {
      section: "9. Residual Connections & Layer Norm",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers how a token&rsquo;s vector actually gets updated and refined:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Residual Connections &amp; Layer Norm</strong> — adding attention&rsquo;s output back onto the token, then normalizing.</li>
            <li><strong>The Feed-Forward Network</strong> — a second sublayer applied to each token independently.</li>
            <li><strong>Stacking Blocks</strong> — repeating attention + feed-forward several times.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "9. Residual Connections & Layer Norm",
      title: "The big picture, before the details",
      body: (
        <p>
          The last chapter computed, for every token, an{" "}
          <Equation tex={"\\text{attn\\_output}"} display={false} /> — a vector blended from
          every other token&rsquo;s Value. This chapter shows how it actually updates the token:
          added onto the token&rsquo;s own vector, processed a little further, and the whole
          thing repeated several times — so each token&rsquo;s vector keeps getting richer. The
          picture below is the shape of the whole chapter: attention (plus its add-and-normalize
          step) is one sublayer, feed-forward (plus its own add-and-normalize step) is a second
          sublayer, and one Block is exactly those two sublayers back to back — repeated as
          several separate Blocks, stacked.
        </p>
      ),
      visual: <BlockOverviewDiagram />,
    },
    {
      section: "9. Residual Connections & Layer Norm",
      title: "Two things need to combine",
      body: (
        <p>
          Every token now has two vectors sitting side by side: the one it already had, and its{" "}
          <Equation tex={"\\text{attn\\_output}"} display={false} /> — the vector the last
          chapter built, new information gathered from other tokens. Somehow these two need to
          become a single, updated vector. There&rsquo;s more than one way to do that, and the
          choice matters.
        </p>
      ),
      visual: <CombineDiagram mode="question" />,
    },
    {
      section: "9. Residual Connections & Layer Norm",
      title: "One option: just replace",
      body: (
        <p>
          The simplest option: throw the token&rsquo;s old vector away, and let the{" "}
          <Equation tex={"\\text{attn\\_output}"} display={false} /> become the token&rsquo;s new
          vector entirely.
        </p>
      ),
      visual: <CombineDiagram mode="replace" />,
    },
    {
      section: "9. Residual Connections & Layer Norm",
      title: "Why that loses something",
      body: (
        <p>
          But the <Equation tex={"\\text{attn\\_output}"} display={false} /> is a blend across{" "}
          <em>every</em> token in the sentence — this token&rsquo;s own vector is only one
          ingredient in that mix, often a small one. Replacing the vector entirely, every single
          time, risks slowly washing out what made this token itself.
        </p>
      ),
      visual: <CombineDiagram mode="replace" />,
    },
    {
      section: "9. Residual Connections & Layer Norm",
      title: "The fix: add, don't replace",
      body: (
        <p>
          A residual connection keeps the old vector and
          adds the <Equation tex={"\\text{attn\\_output}"} display={false} /> on top, instead of
          replacing it:
          <Equation tex={"\\text{new\\_x} = \\text{old\\_x} + \\text{attn\\_output}"} />
          Nothing is thrown away. If the <Equation tex={"\\text{attn\\_output}"} display={false} />{" "}
          isn&rsquo;t helpful yet, it can just shrink toward zero and the token falls back to
          passing <Equation tex={"\\text{old\\_x}"} display={false} /> straight through unchanged
          — an easy default.
        </p>
      ),
      visual: <CombineDiagram mode="add" />,
    },
    {
      section: "9. Residual Connections & Layer Norm",
      title: "Keeping numbers in range: layer normalization",
      body: (
        <p>
          There&rsquo;s a catch with residual connections: repeatedly adding new information on
          top of old, layer after layer, can make a token&rsquo;s numbers drift — growing large
          or uneven across dimensions, since nothing ever shrinks them back down.{" "}
          Layer normalization is the fix: it resets that
          after every addition, rescaling each token&rsquo;s own vector so its numbers land in a
          consistent, predictable range — mean 0, spread (standard deviation) 1:
          <Equation tex={"\\text{LayerNorm}(x) = \\frac{x - \\mu}{\\sigma}"} />
          where <Equation tex={"\\mu"} display={false} /> and{" "}
          <Equation tex={"\\sigma"} display={false} /> come from <Equation tex="x" display={false} />
          &rsquo;s own <Equation tex="d" display={false} /> numbers ({D_MODEL} here) — nothing
          from any other token:
          <Equation tex={"\\mu = \\frac{1}{d} \\sum_{c=1}^{d} x_c"} />
          <Equation tex={"\\sigma = \\sqrt{\\frac{1}{d} \\sum_{c=1}^{d} (x_c - \\mu)^2}"} />
          Every token gets its own <Equation tex={"\\mu"} display={false} /> and{" "}
          <Equation tex={"\\sigma"} display={false} />, computed the same way, independently. A
          concrete before/after — same shape, rescaled range:
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <EmbeddingVector values={rawSample} label="before" scale={3.4} />
          <EmbeddingVector values={sampleNorm} label="after" scale={1.6} />
        </div>
      ),
    },
    {
      section: "9. Residual Connections & Layer Norm",
      title: "Put together: one sublayer",
      body: (
        <p>
          What we walked through: start from the token&rsquo;s vector, run it through
          attention to get <Equation tex={"\\text{attn\\_output}"} display={false} />, add that
          back onto the vector, then normalize. A sublayer is just
          whatever gets wrapped this way — attention is one; the feed-forward network
          you&rsquo;ll meet next is the other. This exact wrapper appears twice in every
          Transformer block, once around each.
        </p>
      ),
      visual: <SublayerDiagram sublayerLabel="Attention" />,
    },
    // -------------------------- 10. The Feed-Forward Network --------------------------
    {
      section: "10. The Feed-Forward Network",
      title: "After attention: a small neural network",
      body: (
        <p>
          Once attention finishes mixing information <em>between</em> tokens, each token&rsquo;s
          vector independently passes through a{" "}
          feed-forward network:
          <Equation tex={"\\text{FFN}(x) = W_2 \\, \\text{ReLU}(W_1 x + b_1) + b_2"} />
          Linear → ReLU → Linear — exactly the one-hidden-layer network from the Neural Networks
          chapter (one hidden layer, two weight matrices), reused as-is, just without a final
          sigmoid (it needs to output a vector here, not a single probability). Below: this exact
          shape for our case — {D_MODEL} dimensions in, a {D_MODEL * 4}-unit hidden layer, {D_MODEL}{" "}
          dimensions back out.
        </p>
      ),
      visual: <SublayerDiagram sublayerLabel="Feed-Forward" highlight={["sublayer"]} />,
      chart: <FeedForwardDiagram />,
    },
    {
      section: "10. The Feed-Forward Network",
      title: "Wrapped the same way",
      body: (
        <p>
          The feed-forward network gets the exact same residual-connection-plus-layer-norm wrapper
          attention did — same shape, different box in the middle.
        </p>
      ),
      visual: <SublayerDiagram sublayerLabel="Feed-Forward" />,
    },
    {
      section: "10. The Feed-Forward Network",
      title: "One Transformer block, start to finish",
      body: (
        <p>
          A Transformer block is exactly these two wrapped
          sublayers, back to back: attention first (tokens exchange information), then the
          feed-forward network (each token processes what it gathered, on its own).
        </p>
      ),
      visual: <SublayerDiagram sublayerLabel="Attention" />,
      chart: <SublayerDiagram sublayerLabel="Feed-Forward" />,
    },
    // -------------------------- 11. Stacking Blocks --------------------------
    {
      section: "11. Stacking Blocks",
      title: "Why stack more than one block?",
      body: (
        <p>
          One block refines every token&rsquo;s vector once. Stacking several — feeding one
          block&rsquo;s output straight into the next block&rsquo;s input — lets the model build up
          progressively richer representations, exactly the same &ldquo;depth&rdquo; capacity dial
          you saw for plain networks, just applied here to whole blocks instead of single layers.
        </p>
      ),
      visual: <BlockStackDiagram numBlocks={2} />,
    },
    {
      section: "11. Stacking Blocks",
      title: "The Transformer block stack",
      body: (
        <p>
          Tokens flow top to bottom through every block in order. Each one has the exact same
          internal structure — attention sublayer, then feed-forward sublayer — with its own
          separate set of weights.
        </p>
      ),
      visual: <BlockStackDiagram numBlocks={numLayers} />,
    },
    {
      section: "11. Stacking Blocks",
      title: "Try it yourself: change the number of blocks",
      body: <p>Drag the slider, then pick a block to inspect its attention pattern.</p>,
      visual: <BlockStackDiagram numBlocks={numLayers} highlightIndex={clampedLayer} />,
      chart: result ? <AttentionHeatmap tokens={tokens} attn={result.layers[clampedLayer].attnByHead[0]} /> : undefined,
      controls: (
        <div className="grid grid-cols-2 gap-3">
          <Slider
            label="Number of blocks"
            value={LAYER_OPTIONS.indexOf(numLayers)}
            min={0}
            max={LAYER_OPTIONS.length - 1}
            step={1}
            onChange={(i) => { setNumLayers(LAYER_OPTIONS[i]); setLayerIndex(0); }}
            format={() => `${numLayers}`}
          />
          <Slider label="Block" value={clampedLayer} min={0} max={numLayers - 1} step={1} onChange={setLayerIndex} format={(v) => `${v + 1}`} />
        </div>
      ),
      resetAction: () => { setNumLayers(1); setLayerIndex(0); },
    },
    {
      section: "Wrap-up",
      title: "What you learned in this chapter",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Residual connections add a sublayer&rsquo;s
              input back onto its output, instead of replacing it.</li>
            <li>Layer normalization keeps every
              token&rsquo;s numbers in a stable, predictable range.</li>
            <li>A feed-forward network then processes each
              token&rsquo;s vector independently.</li>
            <li>Attention sublayer + feed-forward sublayer = one{" "}
              Transformer block; stacking several adds
              capacity.</li>
          </ul>
          <p>
            Or,{" "}
            <button
              type="button"
              className={chapterLinkBtn}
              onClick={() => onNavigateToChapter?.("generating")}
            >
              proceed to Generating Text →
            </button>
          </p>
        </div>
      ),
      visual: <BlockOverviewDiagram />,
    },
  ];

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => {
    current.onAdvance?.();
    if (isLast) {
      onComplete?.();
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-sm uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-base text-neutral-700"
          >
            Back
          </button>
          <button onClick={goNext} className={nextBtn}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
        <span className="text-sm text-neutral-500 sm:flex-1 sm:text-right">
          Step {step + 1} of {total}
        </span>
      </div>

      <SegmentedProgressBar
        sections={steps.map((s) => s.section)}
        currentStep={step}
        onSelectStep={setStep}
      />

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-neutral-900">{current.title}</h3>
        <div className="text-base text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
            {current.resetAction && (
              <button
                onClick={current.resetAction}
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                ↺ Undo / reset this step
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {current.visual}
          {current.chart}
        </div>
      </div>
    </div>
  );
}
