"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { PrecisionBarsDiagram } from "./PrecisionBarsDiagram";

// Same 7B-parameter model and 80 GB VRAM figures the GPU Unit established
// (MODEL_WEIGHTS_GB = 14 there, at FP16's 2 bytes/parameter) — reused here
// rather than inventing a new example model, so a reader who did the GPU
// Unit recognizes these numbers instead of re-learning them.
const PARAMS_B = 7;
const VRAM_TOTAL_GB = 80;
const BYTES_PER_PARAM = { fp16: 2, int8: 1, int4: 0.5 };
const WEIGHTS_GB = {
  fp16: PARAMS_B * BYTES_PER_PARAM.fp16,
  int8: PARAMS_B * BYTES_PER_PARAM.int8,
  int4: PARAMS_B * BYTES_PER_PARAM.int4,
};

/** Module 4 (Inference), Unit "Quantization" — the module's fifth Unit.
 * Same house style as the rest of the module (no Southwear/Chloe/Maya
 * narrative). Reuses the GPU Unit's 7B-parameter/80GB-VRAM example
 * throughout instead of introducing a new one, and its own "makes the
 * VRAM capacity go further again, by storing each of the model's own
 * numbers in fewer than 2 bytes" forward-reference is what this chapter
 * cashes in.
 *
 * Two terminology points enforced carefully, per this module's revision
 * history on getting technical terms exactly right: (1) quantization
 * keeps every parameter and shrinks each one's precision — it is not
 * pruning or distillation, which remove parameters; conflating these
 * would repeat the same kind of error the vLLM Unit's "serving engine"
 * mix-up did. (2) The concrete arithmetic example in the Quality Cost
 * Section is explicitly labeled illustrative (same convention as
 * Speculative Decoding's "The Eiffel Tower is ___" example) — it is not
 * a real model's measured output. */
export function QuantizationWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
  }

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            The GPU Unit showed that VRAM is a fixed pool the model&rsquo;s weights and its KV
            cache both draw from. This chapter covers the technique that shrinks the weights&rsquo;
            own share of that pool, without changing the model itself.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>What Quantization Actually Changes</strong> — storing the same numbers with fewer bits each.</li>
            <li><strong>The Memory Payoff</strong> — how much VRAM that actually frees up.</li>
            <li><strong>The Speed Payoff</strong> — why fewer bits can also mean faster, not just smaller.</li>
            <li><strong>The Quality Cost</strong> — what&rsquo;s lost, and where it shows up first.</li>
            <li><strong>Choosing a Precision</strong> — the three-way tradeoff, side by side.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture",
      body: (
        <p>
          Quantization trades three things against each other: memory, speed, and output quality.
          Lowering precision improves the first two and risks the third — this chapter follows one
          7B-parameter model (the same one from the GPU Unit) through FP16, INT8, and INT4 to make
          that tradeoff concrete.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Memory" value="lower precision → less" tone="good" />
          <StatCard label="Speed" value="lower precision → faster" tone="good" />
          <StatCard label="Quality" value="lower precision → riskier" tone="warn" />
        </div>
      ),
    },
    // -------------------- 1. What Quantization Actually Changes --------------------
    {
      section: "1. What Quantization Actually Changes",
      title: "Same Model, Fewer Bits Per Number",
      body: (
        <p>
          Quantization does not remove any of a model&rsquo;s parameters, and it does not change
          how many there are — that&rsquo;s a different kind of technique entirely. A quantized
          7B-parameter model still has all 7 billion parameters. What changes is how much memory
          each one takes to store.
        </p>
      ),
      visual: <StatCard label="7B-parameter model, quantized" value="still 7,000,000,000 parameters" />,
    },
    {
      section: "1. What Quantization Actually Changes",
      title: "A Number's Size in Memory: FP16, INT8, INT4",
      body: (
        <p>
          Every parameter is a number stored in a fixed number of bits. The GPU Unit&rsquo;s model
          used 16 bits (2 bytes) per number, a format called <strong>FP16</strong>. Two lower-precision
          formats store that same kind of number in fewer bits: <strong>INT8</strong> uses 8 bits
          (1 byte), and <strong>INT4</strong> uses 4 bits (half a byte).
        </p>
      ),
      visual: <PrecisionBarsDiagram rows={[{ label: "FP16", bits: 16 }, { label: "INT8", bits: 8 }, { label: "INT4", bits: 4 }]} />,
    },
    {
      section: "1. What Quantization Actually Changes",
      title: "Fewer Bits Means Rounding to a Coarser Grid",
      body: (
        <p>
          16 bits can represent over 65,000 distinct values; 4 bits can only represent 16.
          Converting a parameter from FP16 to INT8 or INT4 means rounding it to the nearest value
          that smaller format can actually represent — the same kind of rounding you&rsquo;d get
          switching a ruler from millimeter markings to centimeter markings.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="FP16" value="65,536 distinct values" />
          <StatCard label="INT8" value="256 distinct values" />
          <StatCard label="INT4" value="16 distinct values" tone="warn" />
        </div>
      ),
    },
    // -------------------- 2. The Memory Payoff --------------------
    {
      section: "2. The Memory Payoff",
      title: "A 7B-Parameter Model's Weights, in Three Precisions",
      body: (
        <p>
          At FP16&rsquo;s 2 bytes per parameter, the GPU Unit&rsquo;s 7B-parameter model needs{" "}
          {WEIGHTS_GB.fp16} GB of VRAM just for its weights. At INT8&rsquo;s 1 byte per parameter,
          that&rsquo;s half as much: {WEIGHTS_GB.int8} GB. At INT4&rsquo;s half a byte per
          parameter, it&rsquo;s half again: {WEIGHTS_GB.int4} GB — a quarter of the original, for
          the exact same model.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="FP16 weights" value={`${WEIGHTS_GB.fp16} GB`} />
          <StatCard label="INT8 weights" value={`${WEIGHTS_GB.int8} GB`} tone="good" />
          <StatCard label="INT4 weights" value={`${WEIGHTS_GB.int4} GB`} tone="good" />
        </div>
      ),
    },
    {
      section: "2. The Memory Payoff",
      title: "Why Smaller Weights Free Up More Than Just Space",
      body: (
        <p>
          The GPU Unit showed that VRAM is one fixed pool the weights and the KV cache both draw
          from. Every gigabyte quantization saves on weights becomes a gigabyte available for the
          KV cache instead — on the exact same {VRAM_TOTAL_GB} GB GPU, meaning more concurrent
          requests or longer context, not just a smaller file on disk.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label={`${VRAM_TOTAL_GB} GB total, FP16 weights (${WEIGHTS_GB.fp16} GB)`}
            value={`${VRAM_TOTAL_GB - WEIGHTS_GB.fp16} GB free for KV cache`}
          />
          <StatCard
            label={`${VRAM_TOTAL_GB} GB total, INT4 weights (${WEIGHTS_GB.int4} GB)`}
            value={`${VRAM_TOTAL_GB - WEIGHTS_GB.int4} GB free for KV cache`}
            tone="good"
          />
        </div>
      ),
    },
    // -------------------- 3. The Speed Payoff --------------------
    {
      section: "3. The Speed Payoff",
      title: "Less Data to Move Per Step",
      body: (
        <p>
          Before the GPU can compute anything, it first has to read the model&rsquo;s weights out
          of VRAM. How fast it can read that data is called <strong>memory bandwidth</strong>. A
          step&rsquo;s speed often depends on memory bandwidth just as much as on core count.
          Fewer bits per weight means less data to read every step, which can make each step
          faster, not just cheaper to store.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="FP16: weights read per step" value={`${WEIGHTS_GB.fp16} GB`} />
          <StatCard label="INT4: weights read per step" value={`${WEIGHTS_GB.int4} GB`} tone="good" />
        </div>
      ),
    },
    {
      section: "3. The Speed Payoff",
      title: "The Payoff, Measured",
      body: (
        <p>
          Because reading weights is often the real bottleneck, quantized models commonly run
          noticeably faster than their full-precision counterparts on the same GPU — on top of
          the memory savings, not instead of them.
        </p>
      ),
      visual: <StatCard label="Typical speedup, memory-bandwidth-bound serving" value="~2–4×" tone="good" />,
    },
    // -------------------- 4. The Quality Cost --------------------
    {
      section: "4. The Quality Cost",
      title: "Rounding Errors Add Up Across Billions of Weights",
      body: (
        <p>
          Rounding any single weight to a coarser grid introduces a small error. A 7B-parameter
          model has 7 billion of these small errors, all introduced at once. Individually tiny,
          they can combine into a real difference in what the model outputs — and INT4&rsquo;s
          much coarser rounding introduces more error than INT8&rsquo;s.
        </p>
      ),
      visual: <StatCard label="Parameters rounded, all at once" value="7,000,000,000" tone="warn" />,
    },
    {
      section: "4. The Quality Cost",
      title: "Where This Shows Up: A Concrete Example",
      body: (
        <p>
          Precision loss shows up unevenly. Here&rsquo;s one illustrative case for a task where
          getting an exact number wrong actually matters — real quantized models show this same
          pattern, though the exact numbers below are for illustration, not a live model run.
        </p>
      ),
      visual: (
        <div className="text-center space-y-1.5">
          <div className="font-mono text-lg text-neutral-800">What is 847 &times; 293?</div>
          <div className="flex justify-center gap-6 text-base font-mono">
            <span className="text-emerald-700">FP16: 248,171 ✓</span>
            <span className="text-emerald-700">INT8: 248,171 ✓</span>
            <span className="text-red-500">INT4: 248,000 ✗</span>
          </div>
        </div>
      ),
    },
    {
      section: "4. The Quality Cost",
      title: "Not Every Task Is Equally Sensitive",
      body: (
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          <li>
            <strong>Casual conversation, summarization, creative writing</strong> tolerate
            INT4&rsquo;s coarser rounding well — small wording differences rarely change whether an
            answer is good.
          </li>
          <li>
            <strong>Precise arithmetic, code, multi-step reasoning</strong> are far more sensitive
            — a single wrong digit or token can flip a correct answer into a wrong one.
          </li>
        </ul>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Casual chat, summarization" value="INT4 usually fine" tone="good" />
          <StatCard label="Precise math, code, reasoning" value="INT4 risk highest" tone="warn" />
        </div>
      ),
    },
    // -------------------- 5. Choosing a Precision --------------------
    {
      section: "5. Choosing a Precision",
      title: "The Three-Way Tradeoff, Side by Side",
      body: (
        <p>
          There&rsquo;s no single best precision — only the right tradeoff for the task and the
          hardware available.
        </p>
      ),
      visual: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-1 pr-3 font-medium"></th>
                <th className="py-1 px-3 font-medium">FP16</th>
                <th className="py-1 px-3 font-medium">INT8</th>
                <th className="py-1 px-3 font-medium">INT4</th>
              </tr>
            </thead>
            <tbody className="text-neutral-800">
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Weights (7B model)</td>
                <td className="py-1.5 px-3 font-mono">{WEIGHTS_GB.fp16} GB</td>
                <td className="py-1.5 px-3 font-mono">{WEIGHTS_GB.int8} GB</td>
                <td className="py-1.5 px-3 font-mono">{WEIGHTS_GB.int4} GB</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Relative speed</td>
                <td className="py-1.5 px-3 font-mono">1×</td>
                <td className="py-1.5 px-3 font-mono">~2×</td>
                <td className="py-1.5 px-3 font-mono">~3&ndash;4×</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Quality risk</td>
                <td className="py-1.5 px-3">Lowest</td>
                <td className="py-1.5 px-3">Low</td>
                <td className="py-1.5 px-3">Highest, especially for precise tasks</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    // -------------------- 6. Wrap-up --------------------
    {
      section: "6. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Quantization keeps every parameter and stores each one in fewer bits — it does not remove parameters.</li>
            <li>FP16 uses 2 bytes per parameter, INT8 uses 1 byte, and INT4 uses half a byte — the same 7B-parameter model needs 14 GB, 7 GB, or 3.5 GB of VRAM for its weights, respectively.</li>
            <li>Freed-up VRAM from smaller weights becomes available for the KV cache, on the exact same GPU.</li>
            <li>Fewer bits per weight also means less data to read from VRAM every step, which can make serving faster, not just smaller.</li>
            <li>Lower precision risks output quality — precise arithmetic, code, and multi-step reasoning are hit first, while casual conversation tolerates it well.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "6. Wrap-up",
      title: "Closing: The Rest of This Module",
      body: (
        <div className="space-y-2">
          <p>
            Performance metrics — latency, throughput, and time to first token, read together to
            diagnose a bottleneck and decide hosted API vs. self-hosted — is the module&rsquo;s last
            chapter.
          </p>
          <Link
            href="/inference/performance"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to Performance →
          </Link>
        </div>
      ),
      visual: undefined,
    },
  ];

  const total = steps.length;
  const [step, setStep] = useState(() => {
    if (initialStep === undefined) return 0;
    return initialStep < 0 ? total - 1 : Math.min(initialStep, total - 1);
  });
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
        <span className="text-sm uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          {isFirst ? (
            <Link
              href="/inference/continuous-batching"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to Continuous Batching
            </Link>
          ) : (
            <button
              onClick={goBack}
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              Back
            </button>
          )}
          <button onClick={goNext} className={nextBtn}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
        <span className="text-sm text-neutral-500 sm:flex-1 sm:text-right">
          Step {step + 1} of {total}
        </span>
      </div>

      <SegmentedProgressBar sections={steps.map((s) => s.section)} currentStep={step} onSelectStep={setStep} />

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-neutral-900">{current.title}</h3>
        <div className="text-base text-neutral-600 leading-relaxed space-y-3">{current.body}</div>
        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
