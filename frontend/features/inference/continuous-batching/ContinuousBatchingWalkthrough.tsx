"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { BatchTimelineDiagram, type BatchSlotRow } from "./BatchTimelineDiagram";

const SLOTS = 4;

function lengthsWithLong(long: number): number[] {
  return [5, long, 10, 5, 8, 12, 6, 15];
}

// Static batching: process requests in fixed groups of SLOTS. A group
// can't start until every request in the previous group has finished, so
// the group's own duration is bounded by its single slowest request.
function simulateStatic(lengths: number[], slots: number): number {
  let total = 0;
  for (let i = 0; i < lengths.length; i += slots) {
    total += Math.max(...lengths.slice(i, i + slots));
  }
  return total;
}

// Continuous batching: the moment any slot frees up, the next waiting
// request takes it immediately — a real greedy scheduling simulation,
// not a fabricated number.
function simulateContinuous(lengths: number[], slots: number): number {
  const slotFree = Array.from({ length: slots }, () => 0);
  const queue = [...lengths];
  for (let i = 0; i < slots && queue.length; i++) {
    slotFree[i] = queue.shift()!;
  }
  while (queue.length) {
    const minIdx = slotFree.indexOf(Math.min(...slotFree));
    slotFree[minIdx] += queue.shift()!;
  }
  return Math.max(...slotFree);
}

// Wave 1 only (R1–R4); rendered with totalSteps={35} (not 20, its own
// duration) to share the exact same time axis as STATIC_FULL_ROWS below —
// so a segment's bar width means the same thing in both diagrams, and the
// reader can visually carry this picture forward into the later one.
const STATIC_WAVE1_ROWS: BatchSlotRow[] = [
  { label: "Slot 1", segments: [{ steps: 5, label: "R1" }, { steps: 15, label: "", idle: true }] },
  { label: "Slot 2", segments: [{ steps: 20, label: "R2" }] },
  { label: "Slot 3", segments: [{ steps: 10, label: "R3" }, { steps: 10, label: "", idle: true }] },
  { label: "Slot 4", segments: [{ steps: 5, label: "R4" }, { steps: 15, label: "", idle: true }] },
];

const STATIC_FULL_ROWS: BatchSlotRow[] = [
  { label: "Slot 1", segments: [{ steps: 5, label: "R1" }, { steps: 15, label: "", idle: true }, { steps: 8, label: "R5" }, { steps: 7, label: "", idle: true }] },
  { label: "Slot 2", segments: [{ steps: 20, label: "R2" }, { steps: 12, label: "R6" }, { steps: 3, label: "", idle: true }] },
  { label: "Slot 3", segments: [{ steps: 10, label: "R3" }, { steps: 10, label: "", idle: true }, { steps: 6, label: "R7" }, { steps: 9, label: "", idle: true }] },
  { label: "Slot 4", segments: [{ steps: 5, label: "R4" }, { steps: 15, label: "", idle: true }, { steps: 15, label: "R8" }] },
];

const CONTINUOUS_ROWS: BatchSlotRow[] = [
  { label: "Slot 1", segments: [{ steps: 5, label: "R1" }, { steps: 8, label: "R5" }, { steps: 15, label: "R8" }] },
  { label: "Slot 2", segments: [{ steps: 20, label: "R2" }, { steps: 8, label: "", idle: true }] },
  { label: "Slot 3", segments: [{ steps: 10, label: "R3" }, { steps: 6, label: "R7" }, { steps: 12, label: "", idle: true }] },
  { label: "Slot 4", segments: [{ steps: 5, label: "R4" }, { steps: 12, label: "R6" }, { steps: 11, label: "", idle: true }] },
];

/** Module 4 (Inference), Unit "Continuous Batching" — the module's
 * third Unit. Same house style as Model Serving/vLLM (no
 * Southwear/Chloe/Maya narrative). Covers the one piece of vLLM the
 * vLLM Unit only mapped and deferred here.
 *
 * Built applying every lesson from the vLLM Unit's review cycle up
 * front, instead of fixing them after the fact: "batch" is genuinely new
 * vocabulary, never defined anywhere else in the app, so it gets its own
 * "What Is Batching?" refresher (mirroring vLLM's KV Cache refresher) —
 * grounded in the same GPU-parallelism fact from vLLM Section 1, not
 * asserted fresh. No invented analogy (hotel rooms, etc.) that could
 * create an ambiguous mapping — the real scenario (requests, slots,
 * steps) is already concrete enough on its own. One worked example (4
 * requests, then 4 more waiting) is threaded through the whole chapter
 * with real computed numbers (a genuine greedy-scheduling simulation,
 * not fabricated), visualized as a slot timeline so "idle GPU time" is
 * something the reader sees, not just reads about. */
export function ContinuousBatchingWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const [longLen, setLongLen] = useState(20);
  const resetLongLen = () => setLongLen(20);

  const lengths = lengthsWithLong(longLen);
  const staticSteps = simulateStatic(lengths, SLOTS);
  const continuousSteps = simulateContinuous(lengths, SLOTS);

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
            vLLM showed how one request&rsquo;s memory gets managed efficiently. This chapter
            covers the one piece vLLM only mapped: how the server decides which requests actually
            run together on the GPU, one step at a time.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>What Is Batching?</strong> — why running several requests together is so much faster than one at a time.</li>
            <li><strong>Static Batching&rsquo;s Problem</strong> — the naive way of grouping requests, and what it wastes.</li>
            <li><strong>Continuous Batching</strong> — the fix vLLM and other modern servers actually use.</li>
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
          Every Step in this chapter follows the same example: 4 requests sharing one GPU that
          has room for 4 at once, each needing a different number of steps to finish.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Request 1" value="5 steps" />
          <StatCard label="Request 2" value="20 steps" />
          <StatCard label="Request 3" value="10 steps" />
          <StatCard label="Request 4" value="5 steps" />
        </div>
      ),
    },
    // -------------------- 1. What Is Batching? --------------------
    {
      section: "1. What Is Batching?",
      title: "Why Process Many Requests Together?",
      body: (
        <div className="space-y-2">
          <p>
            The GPU unit showed that a GPU can run huge numbers of calculations at once. Running
            the model for one request barely uses that capacity — most of the GPU sits idle.
          </p>
          <p>
            Running the model for several requests at the same time uses far more of that same
            capacity, in about the same amount of time as running just one.
          </p>
        </div>
      ),
      visual: <StatCard label="1 request at a time" value="most of the GPU sits idle" tone="warn" />,
    },
    {
      section: "1. What Is Batching?",
      title: "Batching: Running Several Requests Together",
      body: (
        <p>
          <strong>Batching</strong> means running several requests through the model together,
          one step at a time, instead of one at a time. The group running together is called a{" "}
          <strong>batch</strong> — this chapter&rsquo;s example batch has room for 4 requests at
          once, call each of those 4 spots a <strong>slot</strong>.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Slot 1" value="Request 1" />
          <StatCard label="Slot 2" value="Request 2" />
          <StatCard label="Slot 3" value="Request 3" />
          <StatCard label="Slot 4" value="Request 4" />
        </div>
      ),
    },
    // -------------------- 2. Static Batching's Problem --------------------
    {
      section: "2. Static Batching's Problem",
      title: "The Naive Way: Wait for the Whole Batch",
      body: (
        <p>
          The simplest rule: fill all 4 slots, run every step until every request in the batch is
          completely finished, and only then start a new batch with the next 4 requests waiting
          in line.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Static Batching's Problem",
      title: "The Whole Batch Waits for the Slowest",
      body: (
        <p>
          Request 2 needs 20 steps. Requests 1, 3, and 4 finish in 5, 10, and 5 steps — but under
          this rule, none of their slots can be reused until Request 2 finally finishes at step
          20.
        </p>
      ),
      visual: <BatchTimelineDiagram rows={STATIC_WAVE1_ROWS} totalSteps={35} />,
    },
    {
      section: "2. Static Batching's Problem",
      title: "Wasted Slots, Wasted Time",
      body: (
        <p>
          For 15 of those 20 steps, 3 of the 4 slots sit finished but empty — not allowed to start
          a new request yet. Meanwhile, 4 more requests are waiting in line for a turn.
        </p>
      ),
      visual: <StatCard label="Idle slot-steps in this batch" value="40 out of 80 possible" tone="warn" />,
    },
    // -------------------- 3. Continuous Batching --------------------
    {
      section: "3. Continuous Batching",
      title: "The Fix: Refill a Slot the Moment It's Free",
      body: (
        <p>
          Continuous batching drops the &ldquo;wait for the whole batch&rdquo; rule. The instant
          any single request finishes, its slot goes straight to the next request waiting in
          line — no waiting for anyone else.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "3. Continuous Batching",
      title: "Side by Side: 35 Steps vs. 28 Steps",
      body: (
        <p>
          Running all 8 requests — the original 4, plus 4 more waiting in line — finishes
          everything by step 28 this way, instead of step 35 under static batching. Same GPU,
          same 8 requests, 7 fewer steps.
        </p>
      ),
      visual: (
        <div className="space-y-3">
          <div>
            <div className="text-sm text-neutral-500 mb-1">Static batching — 35 steps</div>
            <BatchTimelineDiagram rows={STATIC_FULL_ROWS} totalSteps={35} />
          </div>
          <div>
            <div className="text-sm text-neutral-500 mb-1">Continuous batching — 28 steps</div>
            <BatchTimelineDiagram rows={CONTINUOUS_ROWS} totalSteps={35} />
          </div>
        </div>
      ),
    },
    {
      section: "3. Continuous Batching",
      title: "Try it yourself: how much does one slow request cost you?",
      body: (
        <p>
          Drag how long Request 2 actually takes, and watch both schedules recompute. The bigger
          the gap between the fastest and slowest request, the more continuous batching saves.
        </p>
      ),
      controls: (
        <div className="w-full max-w-[320px]">
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Request 2&rsquo;s length</span>
              <span className="text-neutral-800 tabular-nums">{longLen} steps</span>
            </div>
            <input
              type="range"
              min={10}
              max={40}
              step={1}
              value={longLen}
              onChange={(e) => setLongLen(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetLongLen,
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Static batching" value={`${staticSteps} steps`} tone="warn" />
          <StatCard label="Continuous batching" value={`${continuousSteps} steps`} tone="good" />
        </div>
      ),
    },
    // -------------------- 4. Wrap-up --------------------
    {
      section: "4. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Batching runs several requests through the model together, using far more of the GPU&rsquo;s parallel capacity than one request at a time.</li>
            <li>Static batching waits for every request in a batch to finish before starting the next one — so one slow request leaves every other slot idle.</li>
            <li>Continuous batching refills a slot the instant its request finishes, instead of waiting for the whole batch.</li>
            <li>In the worked example, continuous batching finished the same 8 requests in 28 steps instead of 35, on the identical GPU.</li>
            <li>The bigger the gap between the fastest and slowest request in a batch, the more continuous batching saves.</li>
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
            Quantization — trading precision for memory and speed — is next, followed by
            performance metrics and the hosted-vs-self-hosted decision they feed.
          </p>
          <Link
            href="/inference/quantization"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to Quantization →
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
              href="/inference/vllm"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to vLLM
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
