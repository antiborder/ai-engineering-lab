"use client";

import { useState, type ReactNode } from "react";
import { Equation } from "@/components/Equation";
import { Term } from "@/components/Term";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { Slider } from "../classical-ml/Slider";
import { LossChart } from "../classical-ml/LossChart";
import { TokenChips } from "../transformers/TokenChips";
import { NextTokenBars } from "../transformers/NextTokenBars";
import { TrainingLoopDiagram } from "./TrainingLoopDiagram";
import { TemperatureDemo } from "./TemperatureDemo";

const OPENING_LINE = "Alice was beginning to get very tired of sitting by her sister on the bank,";
const CONTEXT_EXAMPLE = "Alice was be";

// Same illustrative next-character logits as TemperatureDemo's CANDIDATES,
// at temperature 1 (no reshaping) — a static preview of the distribution
// sampling actually draws from, before the next two Steps let the user
// reshape it.
const SAMPLING_PREVIEW = (() => {
  const logits = [
    { token: "e", logit: 2.2 },
    { token: "␣", logit: 1.6 },
    { token: "i", logit: 1.1 },
    { token: "a", logit: 0.4 },
    { token: "o", logit: -0.3 },
    { token: "z", logit: -2.0 },
  ];
  const max = Math.max(...logits.map((l) => l.logit));
  const exps = logits.map((l) => Math.exp(l.logit - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return logits.map((l, i) => ({ token: l.token, prob: exps[i] / sum }));
})();

// A smooth, illustrative downward curve — not a logged real run — just to
// show the shape training loss actually takes (fast drop, then leveling
// off) before "Explore it yourself" shows the real thing.
const ILLUSTRATIVE_LOSS = Array.from(
  { length: 40 },
  (_, i) => 3.9 * Math.exp(-i / 11) + 1.15 + Math.sin(i * 1.3) * 0.06
);

// A typical progression of what generated text looks like at increasing
// amounts of training — hand-written to be representative, not copied from
// an actual logged run (real output will differ every time, since
// generation samples randomly).
const TRAINING_STAGES = [
  { label: "0 steps (untrained)", text: "xQ!vpz\" jL,Zm C0wR;;kd  9uYybT-eK.qo\"aN" },
  { label: "~150 steps", text: "the sae wero the a and toe the ano the s" },
  { label: "~800 steps", text: "Alice was to the sister of the bok, and she was the hore to do" },
  {
    label: "~3000 steps",
    text: 'Alice was beginning to get very tired of sitting by her sister, and she thought, "what is the use of a book without pictures?"',
  },
];

function ContextTargetStrip({ text }: { text: string }) {
  const chars = text.split("");
  const input = chars.slice(0, -1);
  const target = chars.slice(1);
  const cell = (c: string, tone: "cyan" | "orange") => (
    <span
      className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-mono border ${
        tone === "cyan"
          ? "bg-cyan-50 border-cyan-600 text-cyan-800"
          : "bg-orange-50 border-orange-500 text-orange-800"
      }`}
    >
      {c === " " ? "␣" : c}
    </span>
  );
  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        <div className="flex gap-0.5">{input.map((c, i) => <span key={i}>{cell(c, "cyan")}</span>)}</div>
        <div className="text-[10px] text-neutral-500 mt-0.5 mb-1.5">↑ input (context)</div>
        <div className="flex gap-0.5">{target.map((c, i) => <span key={i}>{cell(c, "orange")}</span>)}</div>
        <div className="text-[10px] text-neutral-500 mt-0.5">↑ target — same text, shifted one character later</div>
      </div>
    </div>
  );
}

/** Tiny LLM Unit's guided walkthrough: bridges the fixed-random-weight
 * mechanics taught in Transformers to this Unit's real, backend-trained
 * model. Entirely schematic/illustrative — no backend calls — matching
 * every other Chapter's split between a fast guided walkthrough and a
 * separately-unlocked "Explore it yourself" sandbox (here, the real
 * PyTorch-backed TinyLlmLab). See tiny_llm_session.py and model.py for the
 * real training loop and architecture this Chapter describes. */
export function TinyLlmWalkthrough({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);

  const [stageIndex, setStageIndex] = useState(0);
  const resetStage = () => setStageIndex(0);

  const [temperature, setTemperature] = useState(1);
  const resetTemperature = () => setTemperature(1);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    chart?: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <p>
          Everything in the Transformers Unit used fixed, random weights to show the mechanism
          clearly. This Unit trains a real one — same architecture, but the weights actually
          learn, on the text below.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          &ldquo;{OPENING_LINE}&rdquo;
        </pre>
      ),
    },
    // -------------------------- 1. From Toy to Real --------------------------
    {
      section: "1. From Toy to Real",
      title: "Same architecture, real weights",
      body: (
        <p>
          Token embeddings, positional encoding, causal self-attention, residual connections,
          layer normalization, a feed-forward network, stacked into several Transformer blocks —
          nothing new here. The only difference: every one of its weights starts random and then
          moves, step by step, to
          actually reduce a real loss. A few thousand numbers in total — tiny next to a real
          model&rsquo;s billions, which is exactly the point: small enough to train in seconds,
          right here.
        </p>
      ),
      visual: <TrainingLoopDiagram />,
    },
    {
      section: "1. From Toy to Real",
      title: "One character at a time",
      body: (
        <p>
          One more change: this model reads and writes one <em>character</em> at a time, not
          whole words like the Transformers Unit&rsquo;s tokenizer. A tiny, character-level
          vocabulary (just the letters, spaces, and punctuation that appear in the training text)
          keeps this toy model simple.
        </p>
      ),
      visual: (
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-neutral-500 mb-1">Word-level (Transformers Unit)</div>
            <TokenChips tokens={["Alice", "was", "beginning"]} />
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">Character-level (this Unit)</div>
            <TokenChips tokens={["A", "l", "i", "c", "e", "␣", "w", "a", "s"]} />
          </div>
        </div>
      ),
    },
    {
      section: "1. From Toy to Real",
      title: "The training text",
      body: (
        <p>
          A short excerpt from <em>Alice&rsquo;s Adventures in Wonderland</em> — small on purpose,
          so training visibly improves within seconds instead of hours. The full text is a few
          paragraphs; the free-play sandbox at the end of this Chapter lets you read all of it.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          &ldquo;{OPENING_LINE}&rdquo;
        </pre>
      ),
    },
    // -------------------------- 2. The Training Loop --------------------------
    {
      section: "2. The Training Loop",
      title: "One trip around the loop",
      body: (
        <p>
          Training is just this loop, repeated thousands of times: sample a chunk of text,
          predict the next character, measure how wrong that was, and nudge every weight to make
          it a little less wrong next time.
        </p>
      ),
      visual: <TrainingLoopDiagram />,
    },
    {
      section: "2. The Training Loop",
      title: "Sampling a training example",
      body: (
        <p>
          Grab a short window of characters from the corpus — the <em>input</em>. The{" "}
          <em>target</em> is the exact same text, shifted one character later: at every position,
          the model&rsquo;s job is to predict whichever character comes right after what it&rsquo;s
          already seen.
        </p>
      ),
      visual: <ContextTargetStrip text={CONTEXT_EXAMPLE} />,
    },
    {
      section: "2. The Training Loop",
      title: "Measuring the mistake: cross-entropy",
      body: (
        <div className="space-y-2">
          <p>
            At every position, softmax turns the model&rsquo;s scores into a probability for each
            possible next character. <Term id="cross-entropy">Cross-entropy loss</Term> checks the
            probability it assigned to the <em>actual</em> next character — the one true answer —
            against certainty:
          </p>
          <Equation tex={"\\text{Loss} = -\\frac{1}{T}\\sum_{t=1}^{T} \\log p_t"} />
          <p>
            <Equation tex="T" display={false} /> is how many character positions are being scored
            at once; <Equation tex="p_t" display={false} /> is the probability the model assigned
            to position <Equation tex="t" display={false} />&rsquo;s real next character. Confident
            and correct → loss near 0. Confident and <em>wrong</em> → loss shoots up.
          </p>
        </div>
      ),
      visual: <ContextTargetStrip text={CONTEXT_EXAMPLE} />,
    },
    {
      section: "2. The Training Loop",
      title: "Backprop through the whole stack",
      body: (
        <p>
          Exactly the same <Term id="backpropagation">backpropagation</Term> from Neural
          Networks — the chain rule, applied layer by layer — except now the &ldquo;layers&rdquo;
          include every attention sublayer and feed-forward sublayer in every stacked block. One
          call computes how much <em>every</em> weight in the whole network contributed to the
          loss, all the way back to the token embeddings.
        </p>
      ),
      visual: <TrainingLoopDiagram />,
    },
    {
      section: "2. The Training Loop",
      title: "A smarter step: AdamW",
      body: (
        <p>
          Same idea as <Term id="gradient-descent">gradient descent</Term> — move every weight
          against its gradient — but instead of one fixed learning rate for every weight, AdamW
          adapts each weight&rsquo;s step size using that weight&rsquo;s own recent gradient
          history. In practice: trains faster and more reliably than plain gradient descent,
          without any new mental model needed.
        </p>
      ),
      visual: <TrainingLoopDiagram />,
    },
    {
      section: "2. The Training Loop",
      title: "Watch the loss actually drop",
      body: (
        <p>
          A typical shape for this loss curve: fast at first, then leveling off as the model
          picks up the easy patterns (spaces, common letters) before the harder ones. This
          illustrates the shape — the free-play sandbox plots the real, live curve as it trains.
        </p>
      ),
      visual: <LossChart series={[{ label: "training loss", color: "#0891b2", values: ILLUSTRATIVE_LOSS }]} />,
    },
    // -------------------------- 3. Watching It Learn --------------------------
    {
      section: "3. Watching It Learn",
      title: "From noise to words",
      body: (
        <p>
          Before training, the model&rsquo;s weights are random, so its &ldquo;predictions&rdquo;
          are close to random characters. As loss drops, generated text passes through
          recognizable stages: gibberish, then word-shaped chunks, then real (if imperfect) words,
          then something close to the training text&rsquo;s own style.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono min-h-[3.5rem]">
          {TRAINING_STAGES[0].text}
        </pre>
      ),
    },
    {
      section: "3. Watching It Learn",
      title: "Try it yourself: training progress",
      body: (
        <p>
          Drag the slider to see a typical progression at increasing amounts of training. (A
          representative example, not a logged real run — actual output varies every time, since
          generation samples randomly, covered next.)
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono min-h-[3.5rem]">
          {TRAINING_STAGES[stageIndex].text}
        </pre>
      ),
      controls: (
        <Slider
          label="Training"
          value={stageIndex}
          min={0}
          max={TRAINING_STAGES.length - 1}
          step={1}
          onChange={setStageIndex}
          format={() => TRAINING_STAGES[stageIndex].label}
        />
      ),
      resetAction: resetStage,
    },
    // -------------------------- 4. Generating Text: Temperature --------------------------
    {
      section: "4. Generating Text: Temperature",
      title: "Sampling instead of always picking the best",
      body: (
        <p>
          Generating Text (Transformers Unit) always picked the single highest-probability word.
          Real generation usually does something different: it <em>samples</em> the next
          character randomly, weighted by the softmax probabilities — so the same prompt can
          produce different text each time, and rare-but-plausible characters occasionally get
          picked instead of the top one.
        </p>
      ),
      visual: <NextTokenBars predictions={SAMPLING_PREVIEW} />,
    },
    {
      section: "4. Generating Text: Temperature",
      title: "Temperature: a dial on randomness",
      body: (
        <p>
          <Term id="temperature">Temperature</Term> divides every score before that softmax. Low
          temperature sharpens the distribution — closer to always picking the top candidate.
          High temperature flattens it — weaker candidates get a real shot, output gets more
          varied, and more prone to mistakes.
        </p>
      ),
      visual: <TemperatureDemo temperature={temperature} onChange={setTemperature} />,
      resetAction: resetTemperature,
    },
    {
      section: "4. Generating Text: Temperature",
      title: "Try it yourself: temperature",
      body: (
        <p>
          Drag temperature down toward 0.1 and watch the top candidate take almost all the
          probability. Push it up past 1.5 and watch the distribution flatten out.
        </p>
      ),
      visual: <TemperatureDemo temperature={temperature} onChange={setTemperature} />,
      resetAction: resetTemperature,
    },
    // ---------------------------- 5. Wrap-up ------------------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Same Transformer architecture as before — attention, feed-forward, residual
              connections, layer norm, stacked into blocks — just with real, trained weights.</li>
            <li>This model tokenizes at the <em>character</em> level, not the word level.</li>
            <li>Training is a loop: sample text, predict the next character, measure{" "}
              <Term id="cross-entropy">cross-entropy loss</Term>, backpropagate, update every
              weight with AdamW — repeated thousands of times.</li>
            <li>Generation <em>samples</em> from the probability distribution rather than always
              taking the top choice; <Term id="temperature">temperature</Term> controls how sharp
              or flat that distribution is.</li>
          </ul>
        </div>
      ),
      visual: <TrainingLoopDiagram />,
    },
    {
      section: "5. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything above is now unlocked below as a real, backend-trained model — the exact
          architecture, actually learning, on your own settings. Train it for a bit, then
          generate from it. Push temperature to an extreme and see what breaks.
        </p>
      ),
      visual: <></>,
    },
  ];

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => {
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
