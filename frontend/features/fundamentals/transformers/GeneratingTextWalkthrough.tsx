"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Term } from "@/components/Term";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { tokenize } from "./tokenize";
import { forward, initWeights, type TransformerConfig } from "./transformer";
import { TokenChips } from "./TokenChips";
import { AttentionHeatmap } from "./AttentionHeatmap";
import { NextTokenBars } from "./NextTokenBars";
import { GenerationLoopDiagram } from "./GenerationLoopDiagram";

const D_MODEL = 8;
const DEFAULT_TEXT = "the cat sat on the mat";
const SEED = 7;

/** Chapter 4 of the Transformers Unit: from the final vector to a
 * next-word prediction, then repeating that to generate a whole sentence.
 * See TokensEmbeddingsWalkthrough.tsx for the split rationale. Completing
 * this last Chapter unlocks the shared free-play sandbox below all 4
 * Chapters. */
export function GeneratingTextWalkthrough({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);

  const [text, setText] = useState(DEFAULT_TEXT);
  const tokens = useMemo(() => tokenize(text), [text]);
  const config: TransformerConfig = useMemo(
    () => ({ dModel: D_MODEL, numHeads: 2, numLayers: 1, seed: SEED }),
    []
  );
  const weights = useMemo(() => initWeights(config), [config]);
  const result = useMemo(
    () => (tokens.length > 0 ? forward(tokens, weights, config) : null),
    [tokens, weights, config]
  );

  const resetText = () => setText(DEFAULT_TEXT);

  // --- Autoregressive generation sandbox ---
  const [genTokens, setGenTokens] = useState<string[]>(() => tokenize(DEFAULT_TEXT));
  const genResult = useMemo(
    () => (genTokens.length > 0 ? forward(genTokens, weights, config) : null),
    [genTokens, weights, config]
  );
  const generateNext = () => {
    const next = genResult?.nextTokenLogits[0]?.token;
    if (next) setGenTokens((t) => [...t, next]);
  };
  const undoGenerate = () => setGenTokens((t) => (t.length > tokenize(DEFAULT_TEXT).length ? t.slice(0, -1) : t));
  const resetGenerate = () => setGenTokens(tokenize(DEFAULT_TEXT));

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white";
  const actionBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} className={nextBtn}>
      {label}
    </button>
  );
  const secondaryBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-800">
      {label}
    </button>
  );

  const textInputControl = (
    <div className="space-y-2">
      <label className="block text-xs text-neutral-500">Input text</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-neutral-900 font-mono text-sm"
        maxLength={100}
      />
      <TokenChips tokens={tokens} />
    </div>
  );

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

  const steps: Step[] = [
    // -------------------------- 12. From Vectors to the Next Word --------------------------
    {
      section: "12. From Vectors to the Next Word",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers turning a vector into an actual word, then repeating that:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>From Vectors to the Next Word</strong> — scoring the last token&rsquo;s vector against every candidate word.</li>
            <li><strong>Autoregressive Generation</strong> — looping that one-word prediction back in to write a sentence.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "12. From Vectors to the Next Word",
      title: "The big picture, before the details",
      body: (
        <p>
          Every token now has a rich vector — but that&rsquo;s still just numbers, not a
          prediction. This chapter turns the last token&rsquo;s vector into an actual guess at
          the next word, then loops that guess back in, one word at a time, to write a whole
          sentence.
        </p>
      ),
      visual: <GenerationLoopDiagram />,
    },
    {
      section: "12. From Vectors to the Next Word",
      title: "The final vector",
      body: (
        <p>
          After the last block, every token has an updated vector — but to predict what comes
          next, we only need the <em>last</em> token&rsquo;s vector. It has attended to everything
          before it, so it&rsquo;s the model&rsquo;s best summary of &ldquo;everything so far&rdquo;.
        </p>
      ),
      visual: textInputControl,
    },
    {
      section: "12. From Vectors to the Next Word",
      title: "Scoring candidate words",
      body: (
        <p>
          The final vector is compared, by dot product, against every candidate word&rsquo;s
          embedding — then softmax turns those scores into a probability for each candidate. The
          highest bar is the model&rsquo;s current best guess for the next token.
        </p>
      ),
      visual: result ? <NextTokenBars predictions={result.nextTokenLogits} /> : undefined,
    },
    {
      section: "12. From Vectors to the Next Word",
      title: "Try it yourself: see the prediction change",
      body: (
        <div className="space-y-2">
          <p>Type your own text and watch the next-token bars update.</p>
          <p>
            These weights are random, not trained — predictions become meaningful once the Tiny
            LLM section trains a model like this one.
          </p>
        </div>
      ),
      visual: textInputControl,
      chart: result ? <NextTokenBars predictions={result.nextTokenLogits} /> : undefined,
      resetAction: resetText,
    },
    // -------------------------- 13. Autoregressive Generation --------------------------
    {
      section: "13. Autoregressive Generation",
      title: "Generating a whole sentence, one word at a time",
      body: (
        <p>
          <Term id="autoregressive">Autoregressive generation</Term> is just this next-token step,
          repeated: predict the next token, append it to the sequence, then feed the whole thing
          back in to predict the token after <em>that</em>. Every sentence a language model
          &ldquo;writes&rdquo; was produced one single-token step at a time.
        </p>
      ),
      visual: <TokenChips tokens={genTokens} highlight={genTokens.length - 1} />,
      onAdvance: resetGenerate,
    },
    {
      section: "13. Autoregressive Generation",
      title: "Try it yourself: generate step by step",
      body: (
        <p>
          Click &ldquo;Generate next token&rdquo; repeatedly and watch the sequence grow, one chip
          at a time. Undo removes the last generated token.
        </p>
      ),
      visual: <TokenChips tokens={genTokens} highlight={genTokens.length - 1} />,
      controls: (
        <div className="flex gap-2">
          {actionBtn("Generate next token", generateNext)}
          {secondaryBtn("Undo", undoGenerate)}
        </div>
      ),
      resetAction: resetGenerate,
    },
    {
      section: "13. Autoregressive Generation",
      title: "Why it can only repeat words it's seen",
      body: (
        <p>
          This teaching model only ever compares against words already in the input — it has no
          real vocabulary — so generated text cycles through words you typed rather than inventing
          new ones. A real language model has a full vocabulary of tens of thousands of tokens; a
          trained one, again, is exactly what the Tiny LLM section builds next.
        </p>
      ),
      visual: <TokenChips tokens={genTokens} highlight={genTokens.length - 1} />,
      onAdvance: resetGenerate,
    },
    // ---------------------------- 14. Wrap-up ------------------------------
    {
      section: "14. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Text is split into <Term id="token">tokens</Term>, each mapped to an <Term id="embedding">embedding</Term> plus a <Term id="positional-encoding">positional encoding</Term>.</li>
            <li>Each token computes a <Term id="query">Query</Term>, <Term id="key">Key</Term>, and <Term id="value">Value</Term> — three linear layers, same weighted-sum math as Neural Networks.</li>
            <li>Attention scores queries against keys, scales them, and turns them into weights with <Term id="softmax">softmax</Term>; the output is a weighted blend of values.</li>
            <li><Term id="causal-masking">Causal masking</Term> stops a token from attending to the future.</li>
            <li><Term id="multi-head-attention">Multi-head attention</Term> runs several attentions in parallel, on separate slices of the vector.</li>
            <li><Term id="residual-connection">Residual connections</Term> and <Term id="layer-normalization">layer normalization</Term> wrap every sublayer, keeping deep stacks trainable.</li>
            <li>A <Term id="feed-forward-network">feed-forward network</Term> — the same network from Neural Networks — processes each token afterward.</li>
            <li>Attention sublayer + feed-forward sublayer = one <Term id="transformer-block">Transformer block</Term>; stacking several adds capacity, same idea as network depth.</li>
            <li><Term id="autoregressive">Autoregressive generation</Term> repeats the next-token step to produce a whole sequence.</li>
          </ul>
        </div>
      ),
      visual: result ? <AttentionHeatmap tokens={tokens} attn={result.layers[0].attnByHead[0]} /> : undefined,
    },
    {
      section: "14. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything you just learned is now unlocked below as a free-play sandbox: type any text,
          change the number of heads and blocks, and inspect any layer&rsquo;s attention matrix and
          next-token prediction directly.
        </p>
      ),
      visual: result ? <AttentionHeatmap tokens={tokens} attn={result.layers[0].attnByHead[0]} /> : undefined,
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
        <span className="text-xs uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-sm text-neutral-700"
          >
            Back
          </button>
          <button onClick={goNext} className={nextBtn}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
        <span className="text-xs text-neutral-500 sm:flex-1 sm:text-right">
          Step {step + 1} of {total}
        </span>
      </div>

      <SegmentedProgressBar
        sections={steps.map((s) => s.section)}
        currentStep={step}
        onSelectStep={setStep}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">{current.title}</h3>
        <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
          </div>
        )}
        {current.resetAction && (
          <button
            onClick={current.resetAction}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            ↺ Undo / reset this step
          </button>
        )}

        <div className="space-y-3">
          {current.visual}
          {current.chart}
        </div>
      </div>
    </div>
  );
}
