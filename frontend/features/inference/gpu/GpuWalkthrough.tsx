"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Equation } from "@/components/Equation";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";

// VRAM_TOTAL_GB and MB_PER_WORD originally came from vLLM's KV-cache-sizing
// Step, written back when vLLM was this module's first Unit; kept identical
// here even after GPU moved ahead of vLLM in the reorder, so this Unit now
// establishes them first and vLLM's own Step reuses them, not the reverse.
// MODEL_WEIGHTS_GB matches Model Serving's cold-start Step (still earlier
// than GPU, unaffected by the reorder) — a 7B-parameter model at FP16, ~14 GB.
const VRAM_TOTAL_GB = 80;
const MODEL_WEIGHTS_GB = 14;
const KV_CAPACITY_GB = VRAM_TOTAL_GB - MODEL_WEIGHTS_GB;
const MB_PER_WORD = 0.5;
const WORDS_PER_CONVERSATION = 1000;

function kvCacheNeededGb(conversations: number): number {
  return (MB_PER_WORD * WORDS_PER_CONVERSATION * conversations) / 1024;
}

/** Module 4 (Inference), Unit "GPU" — moved from position 6 to position 2
 * (right after Model Serving), reversing the module's original spec.txt
 * order. Reason: Model Serving, vLLM, and Continuous Batching were all
 * already leaning on "a GPU can do huge numbers of calculations at once"
 * as a forward-referenced fact, exactly the same problem KV Cache caused
 * for vLLM before it got folded in as a proper refresher. The fix here is
 * structural (reorder), not a content patch — this Unit now properly
 * teaches that fact before anything else needs it, and the three numbers
 * at its core (80 GB VRAM, a 7B model's ~14 GB of weights, 0.5 MB/word
 * for the KV cache) are kept identical to what vLLM and Model Serving
 * already used, not new ones — but every reader-facing Step below states
 * them as this Unit's own, since GPU now comes before vLLM: it must not
 * say "vLLM's chapter already showed/used/measured" a fact vLLM hasn't
 * taught yet. (A first pass got this backwards in several Steps — still
 * called vLLM and Continuous Batching "earlier chapters" after the reorder
 * — caught and fixed on review.) Built at the same depth as Evaluation
 * Basics on request. */
export function GpuWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const [conversations, setConversations] = useState(100);
  const resetConversations = () => setConversations(100);

  const kvNeeded = kvCacheNeededGb(conversations);
  const overCapacity = kvNeeded > KV_CAPACITY_GB;

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            This chapter covers the hardware every later chapter in this module quietly depends
            on: why a GPU, specifically, is what runs these models, and why its memory — not just
            its speed — is the real limit on what you can serve.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Why GPUs, Not CPUs?</strong> — what a GPU is actually built to do differently.</li>
            <li><strong>GPU Memory: The Real Constraint</strong> — what competes for one fixed amount of VRAM.</li>
            <li><strong>Your GPU&rsquo;s VRAM, Added Up</strong> — putting a real GPU&rsquo;s numbers together yourself.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture",
      body: (
        <div className="space-y-2">
          <p>A GPU is built from two things:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Compute</strong> — the cores that actually perform calculations.</li>
            <li><strong>Memory</strong> — stores the data those cores work on.</li>
          </ul>
          <p>This chapter explains why each one is limited in the first place.</p>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="GPU compute" value="how many calculations at once" />
          <StatCard label="GPU memory" value="how much can be stored at once" />
        </div>
      ),
    },
    // -------------------- 1. Why GPUs, Not CPUs? --------------------
    {
      section: "1. Why GPUs, Not CPUs?",
      title: "A CPU: Few Cores, Very Flexible",
      body: (
        <p>
          A <strong>core</strong> is the part of a chip that actually does the work — the
          physical unit that carries out one calculation at a time. A CPU has a handful of
          cores — commonly somewhere between 8 and 64 in a modern computer. Each core is powerful
          and flexible: it can follow complicated, branching instructions and jump between
          totally different tasks quickly.
        </p>
      ),
      visual: <StatCard label="CPU" value="8–64 cores, highly flexible" />,
    },
    {
      section: "1. Why GPUs, Not CPUs?",
      title: "A GPU: Thousands of Simple Cores",
      body: (
        <p>
          A GPU takes the opposite approach: thousands of much simpler cores — a modern
          datacenter GPU has several thousand. Each one is less flexible on its own, but all of
          them can run the exact same simple instruction at the same time, on different pieces of
          data.
        </p>
      ),
      visual: <StatCard label="GPU" value="thousands of cores, all doing the same thing at once" />,
    },
    {
      section: "1. Why GPUs, Not CPUs?",
      title: "CPU vs. GPU, Side by Side",
      body: (
        <div className="space-y-2">
          <p>
            The difference comes down to how each chip spends its space: a CPU spends it on a
            few powerful cores, a GPU spends it on thousands of simple ones.
          </p>
          <table className="w-full text-base border-collapse max-w-md mx-auto">
            <thead>
              <tr className="text-left text-neutral-500 text-sm">
                <th className="pb-1.5 pr-3 font-medium"></th>
                <th className="pb-1.5 pr-3 font-medium">CPU</th>
                <th className="pb-1.5 font-medium">GPU</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700">
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Core count</td>
                <td className="py-1.5 pr-3">8–64</td>
                <td className="py-1.5">1,000+</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Each core</td>
                <td className="py-1.5 pr-3">Complex, flexible</td>
                <td className="py-1.5">Simple, identical</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Best suited for</td>
                <td className="py-1.5 pr-3">Varied, branching tasks</td>
                <td className="py-1.5">The same operation on huge amounts of data at once</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "1. Why GPUs, Not CPUs?",
      title: "What Neural Networks Actually Need",
      body: (
        <div className="space-y-2">
          <p>
            Fundamentals&rsquo; Transformers Unit showed that a model&rsquo;s forward pass is
            mostly matrix multiplication: the same operation — multiply two numbers, add the
            result — repeated an enormous number of times.
          </p>
          <p>
            That is exactly the shape of work thousands of simple, identical cores are built
            for — which makes a GPU, not a CPU, the better fit for running a neural network.
          </p>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "1. Why GPUs, Not CPUs?",
      title: "A Concrete Comparison: 1,000 Multiply-Adds",
      body: (
        <p>
          Say a single step needs 1,000 of these multiply-and-add operations. A CPU, doing a
          handful at a time across its cores, needs roughly 125 rounds to get through all 1,000.
          A GPU, with over 1,000 cores, can do nearly all of them in a single round.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="CPU (8 cores)" value="~125 rounds" tone="warn" />
          <StatCard label="GPU (1,000+ cores)" value="~1 round" tone="good" />
        </div>
      ),
    },
    {
      section: "1. Why GPUs, Not CPUs?",
      title: "This Is Why Serving Needs a GPU",
      body: (
        <p>
          This is the same fact every later chapter in this module leans on: a GPU can run a
          whole batch of requests together almost as fast as it runs one, because it was built to
          do the same operation on many pieces of data at the same time.
        </p>
      ),
      visual: undefined,
    },
    // -------------------- 2. GPU Memory: The Real Constraint --------------------
    {
      section: "2. GPU Memory: The Real Constraint",
      title: "VRAM: A GPU's Own, Separate Memory",
      body: (
        <p>
          Those thousands of cores need their own place to keep the data they work on. A GPU has
          its own dedicated memory for exactly that, called <strong>VRAM</strong>, separate from
          a computer&rsquo;s regular RAM. A common size for a datacenter GPU is {VRAM_TOTAL_GB} GB
          — the figure the rest of this module uses too.
        </p>
      ),
      visual: <StatCard label="VRAM (common datacenter GPU)" value={`${VRAM_TOTAL_GB} GB`} />,
    },
    {
      section: "2. GPU Memory: The Real Constraint",
      title: "Three Things Compete for That Same VRAM Capacity",
      body: (
        <div className="space-y-2">
          <p>
            The GPU&rsquo;s VRAM is fixed: everything that needs to live there has to fit inside
            that same {VRAM_TOTAL_GB} GB.
          </p>
          <p>Three things all draw from that same VRAM capacity, at the same time:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>The model&rsquo;s own weights.</li>
            <li>
              The <strong>KV cache</strong> — a running memory of everything said so far in each
              request being served, kept so the model never has to reprocess it from scratch.
            </li>
            <li>A smaller amount of working memory the computation itself needs along the way.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "2. GPU Memory: The Real Constraint",
      title: "A Parameter Is Just a Number in Memory",
      body: (
        <div className="space-y-2">
          <p>
            Every one of a model&rsquo;s weights is just a number — the same kind of number
            Fundamentals&rsquo; Neural Networks Unit tuned by hand. Storing a number takes memory,
            and how much depends on how precisely it is stored.
          </p>
          <p>
            The common choice for a model&rsquo;s weights is a 16-bit floating-point format,
            usually written <strong>FP16</strong>: 16 bits, or exactly 2 bytes, per number.
          </p>
        </div>
      ),
      visual: <StatCard label="FP16 (16-bit floating point)" value="2 bytes per number" />,
    },
    {
      section: "2. GPU Memory: The Real Constraint",
      title: "How Big Is the Model Itself?",
      body: (
        <p>
          A 7-billion-parameter model has 7 billion of these numbers. At 2 bytes each, that is 14
          billion bytes — about {MODEL_WEIGHTS_GB} GB, the same figure Model Serving already used
          for this model&rsquo;s cold start.
        </p>
      ),
      visual: <StatCard label="7B parameters × 2 bytes" value={`≈ ${MODEL_WEIGHTS_GB} GB, just for weights`} />,
    },
    {
      section: "2. GPU Memory: The Real Constraint",
      title: "What's Left for Everything Else",
      body: (
        <div className="space-y-2">
          <p>
            Out of {VRAM_TOTAL_GB} GB total, {MODEL_WEIGHTS_GB} GB is already spoken for by the
            model&rsquo;s own weights, and a further small slice goes to the working memory named
            a moment ago — small enough that this chapter folds it into the same margin.
          </p>
          <p>
            What&rsquo;s left, about {KV_CAPACITY_GB} GB, is what the KV cache — every concurrent
            conversation being served — actually has to share. Whether that&rsquo;s a lot or a
            little depends entirely on how many conversations run at once; the next section lets
            you check.
          </p>
        </div>
      ),
      visual: <StatCard label="Left for KV cache" value={`~${KV_CAPACITY_GB} GB`} />,
    },
    {
      section: "2. GPU Memory: The Real Constraint",
      title: "Why This Is a Hard Limit, Not a Slow One",
      body: (
        <div className="space-y-2">
          <p>A memory shortage is worse than a compute shortage — for one specific reason:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Compute shortage</strong> — only costs time. A request waits its turn, and
              once the GPU is free, it runs exactly as it would have.
            </li>
            <li>
              <strong>Memory shortage</strong> — costs time too, but also wastes compute. A new
              request has to wait for an existing request&rsquo;s KV cache to free up before it
              can even start, so the GPU&rsquo;s compute sits idle meanwhile — even though there
              is spare compute to run it with.
            </li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    // -------------------- 3. Your GPU's VRAM, Added Up --------------------
    {
      section: "3. Your GPU's VRAM, Added Up",
      title: "Try it yourself: how many conversations actually fit?",
      body: (
        <div className="space-y-2">
          <p>
            Using an illustrative estimate of {MB_PER_WORD} MB per word for a 7B-class
            model&rsquo;s KV cache, and the {KV_CAPACITY_GB} GB left over after the model&rsquo;s own
            weights, drag how many {WORDS_PER_CONVERSATION}-word conversations run at once and see
            whether they still fit.
          </p>
          <Equation tex={"\\text{KV cache needed (GB)} = \\frac{\\text{MB per word} \\times \\text{words} \\times \\text{conversations}}{1024}"} />
        </div>
      ),
      controls: (
        <div className="w-full max-w-[320px]">
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Concurrent conversations</span>
              <span className="text-neutral-800 tabular-nums">{conversations}</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={conversations}
              onChange={(e) => setConversations(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetConversations,
      visual: (
        <div className="space-y-2">
          <StatCard
            label={`${conversations} conversations × ${WORDS_PER_CONVERSATION} words`}
            value={overCapacity ? `${kvNeeded.toFixed(1)} GB — more than the ${KV_CAPACITY_GB} GB left` : `${kvNeeded.toFixed(1)} GB of ${KV_CAPACITY_GB} GB left`}
            tone={overCapacity ? "warn" : "good"}
          />
          <p className="text-sm text-neutral-500">
            These numbers come from the same simple formulas every Try It Yourself in this module
            uses — not a measurement from a physically running GPU.
          </p>
        </div>
      ),
    },
    {
      section: "3. Your GPU's VRAM, Added Up",
      title: "What This Means for the Rest of This Module",
      body: (
        <div className="space-y-2">
          <p>Every later Unit in this module is really about stretching one of these same two limits further:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>vLLM</strong> — makes the VRAM capacity go further with PagedAttention, which wastes far less KV-cache space per request than a naive reservation would.</li>
            <li><strong>Continuous Batching</strong> — stretches the GPU&rsquo;s compute, by refilling it with new requests the moment old ones finish instead of leaving cores idle.</li>
            <li><strong>Quantization</strong> — makes the VRAM capacity go further again, by storing each of the model&rsquo;s own numbers in fewer than 2 bytes.</li>
            <li><strong>Performance</strong> — measures whether all of this compute and memory work actually paid off, in real request speed.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    // -------------------- 4. Wrap-up --------------------
    {
      section: "4. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A GPU has thousands of simple cores built to do the same operation on lots of data at once; a CPU has far fewer, more flexible cores.</li>
            <li>Neural networks are mostly repeated matrix multiplication — exactly the kind of work a GPU&rsquo;s parallelism is built for.</li>
            <li>A GPU&rsquo;s VRAM is fixed and separate from system RAM; a common datacenter GPU has about 80 GB.</li>
            <li>Each weight is a number stored at some precision — FP16&rsquo;s 2 bytes per number is why a 7B-parameter model takes about 14 GB.</li>
            <li>That VRAM capacity holds the model&rsquo;s own weights, the KV cache for every request being served, and working memory, all at once.</li>
            <li>Running out of compute only costs time; running out of memory can strand the GPU&rsquo;s compute idle too, since there is nowhere yet to put a new request&rsquo;s KV cache.</li>
            <li>vLLM and Quantization each make the VRAM capacity go further; Continuous Batching stretches the GPU&rsquo;s compute instead.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Wrap-up",
      title: "Closing: The Rest of This Module",
      body: (
        <div className="space-y-2">
          <p>
            vLLM is next — now that VRAM capacity is established, its PagedAttention Section
            will make more sense than it would have on its own.
          </p>
          <Link
            href="/inference/vllm"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to vLLM →
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
            <a
              href="/inference/model-serving"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to Model Serving
            </a>
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

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
          </div>
        )}
        {current.resetAction && (
          <button onClick={current.resetAction} className="text-sm text-neutral-500 hover:text-neutral-800">
            ↺ Undo / reset this step
          </button>
        )}

        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
