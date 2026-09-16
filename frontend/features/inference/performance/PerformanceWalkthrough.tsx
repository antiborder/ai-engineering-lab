"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";

// Same 10 req/sec server and M/M/1 average-wait formula (1/(μ-λ)) Model
// Serving's own Unit established — reused, not recomputed with new
// numbers, so a reader who did that Unit recognizes this GPU.
const CAPACITY = 10;
function averageWaitMs(arrivalRate: number): number {
  return 1000 / (CAPACITY - arrivalRate);
}

/** Module 4 (Inference), Unit "Performance" — the module's sixth and
 * final Unit. Same house style as the rest of the module (no
 * Southwear/Chloe/Maya narrative). Per "How the Units relate" in
 * docs/product/module-4-inference.md, this Unit teaches no new
 * technique — it reads the metrics the other Units already produced
 * (latency from Model Serving, throughput from vLLM) together as one
 * dashboard, cashes in Model Serving's own "the Performance Unit
 * measures this timing directly" forward-reference by formally defining
 * time to first token, then uses that reading skill for the
 * hosted-vs-self-hosted decision.
 *
 * The three dashboard "scenario" Steps use labeled example numbers, not
 * measurements from a real system — same convention as Quantization's
 * illustrative arithmetic example. The hosted-vs-self-hosted cost
 * comparison stays qualitative in the walkthrough itself (cost
 * *structure*, not fabricated dollar figures) — concrete numbers only
 * appear in the Lab's own interactive calculator, where the reader
 * supplies them. */
export function PerformanceWalkthrough({
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
            Every other Unit in this module changed how a server behaves. This last chapter is
            about reading what that behavior looks like in a server&rsquo;s own metrics — latency,
            throughput, time to first token — and using them to make one final decision.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Latency, Throughput, and Time to First Token</strong> — the three metrics that describe how a server is doing.</li>
            <li><strong>The Latency-Throughput Tradeoff</strong> — why improving one can cost the other.</li>
            <li><strong>Reading a Metrics Dashboard</strong> — diagnosing what a set of metrics actually means.</li>
            <li><strong>Hosted API vs. Self-Hosted</strong> — using everything in this module to decide who should run the GPU.</li>
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
          A server produces a handful of metrics every second: how long each request takes, how
          many finish per second, and how quickly the first word appears. Read separately, these
          metrics can mislead. Read together, they tell you exactly what to fix — and eventually,
          whether to run the GPU yourself at all.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Latency" value="time per request" />
          <StatCard label="Throughput" value="requests per second" />
          <StatCard label="Time to first token" value="time to the first word" />
        </div>
      ),
    },
    // -------------------- 1. Latency, Throughput, and Time to First Token --------------------
    {
      section: "1. Latency, Throughput, and Time to First Token",
      title: "Latency, Recapped",
      body: (
        <p>
          Model Serving showed that a single request answers almost instantly, but that latency —
          how long one request takes, start to finish — climbs sharply as traffic approaches a
          server&rsquo;s capacity.
        </p>
      ),
      visual: (
        <StatCard
          label={`Same ${CAPACITY} req/sec server, at 8 req/sec arrivals`}
          value={`${averageWaitMs(8)} ms average wait`}
          tone="warn"
        />
      ),
    },
    {
      section: "1. Latency, Throughput, and Time to First Token",
      title: "Throughput, Recapped",
      body: (
        <p>
          vLLM showed a different metric: throughput, how many requests get fully answered
          per second. Serving one request at a time versus batching many together on the same GPU
          can differ by up to 24×, the published benchmarks in that chapter showed.
        </p>
      ),
      visual: <StatCard label="vLLM vs. naive serving, same GPU" value="up to 24× throughput" tone="good" />,
    },
    {
      section: "1. Latency, Throughput, and Time to First Token",
      title: "A New Measurement: Time to First Token",
      body: (
        <p>
          Model Serving showed that a served model streams tokens back one at a time, instead of
          waiting for the whole answer to finish. <strong>Time to first token (TTFT)</strong> measures
          exactly that moment: how long the reader waits before the very first token of the
          response appears.
        </p>
      ),
      visual: <StatCard label="Time to first token" value="time to the first streamed token, not the whole answer" />,
    },
    {
      section: "1. Latency, Throughput, and Time to First Token",
      title: "TTFT and Total Latency, Side by Side",
      body: (
        <p>
          The two can diverge a lot. In this example response, the first token streams back in
          150 ms — but the full response is 200 tokens long, so the total latency is much longer.
          TTFT tells you how responsive the server feels; total latency tells you how long the
          whole answer actually takes.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Time to first token" value="150 ms" tone="good" />
          <StatCard label="Total latency (200-token response)" value="4.0 sec" />
        </div>
      ),
    },
    // -------------------- 2. The Latency-Throughput Tradeoff --------------------
    {
      section: "2. The Latency-Throughput Tradeoff",
      title: "More Requests Together Raises Throughput...",
      body: (
        <p>
          Continuous Batching showed how grouping many requests together keeps the GPU&rsquo;s
          parallel capacity busy — exactly what raises throughput.
        </p>
      ),
      visual: <StatCard label="Larger batches, same GPU" value="higher throughput" tone="good" />,
    },
    {
      section: "2. The Latency-Throughput Tradeoff",
      title: "...But Can Raise Each One's Wait",
      body: (
        <p>
          Grouping requests together also means a request can sit briefly in the batch before its
          own turn, adding latency it would not have paid running alone. More throughput per GPU
          often costs a little latency per request — a tradeoff every serving system has to
          balance, not a flaw in any one of them.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Smaller batches" value="lower latency each, less throughput overall" />
          <StatCard label="Larger batches" value="higher throughput overall, more latency each" />
        </div>
      ),
    },
    // -------------------- 3. Reading a Metrics Dashboard --------------------
    {
      section: "3. Reading a Metrics Dashboard",
      title: "Scenario: High Time to First Token, Low Throughput",
      body: (
        <p>
          A dashboard shows time to first token far above normal, and throughput far below the
          GPU&rsquo;s usual maximum. Requests are arriving faster than the server can start them —
          the same queueing effect Model Serving showed, now visible directly in the metrics.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Time to first token" value="1.8 sec (usually 150 ms)" tone="warn" />
          <StatCard label="Throughput" value="6 req/sec (usually 20)" tone="warn" />
        </div>
      ),
    },
    {
      section: "3. Reading a Metrics Dashboard",
      title: "Scenario: Normal Time to First Token, High Total Latency",
      body: (
        <p>
          Time to first token looks perfectly normal, but total latency is unusually high. This
          usually is not a serving problem at all — it means the model is generating an unusually
          long response, one token at a time, not that requests are queueing.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Time to first token" value="140 ms (normal)" tone="good" />
          <StatCard label="Total latency" value="9 sec (usually 2 sec)" />
        </div>
      ),
    },
    {
      section: "3. Reading a Metrics Dashboard",
      title: "Scenario: High Throughput and High Latency, Together",
      body: (
        <p>
          Throughput is at its highest recorded level, and latency has crept up too. Read alone,
          that latency number looks bad. Read together with the throughput number, it usually
          means the server is intentionally batching more aggressively to serve more requests
          overall — the tradeoff from the last Section, working as intended. Reading these metrics
          together, not one at a time, is what makes a dashboard useful.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Throughput" value="24 req/sec (peak)" tone="good" />
          <StatCard label="Latency" value="800 ms (slightly up)" />
        </div>
      ),
    },
    // -------------------- 4. Hosted API vs. Self-Hosted --------------------
    {
      section: "4. Hosted API vs. Self-Hosted",
      title: "Two Different Cost Structures",
      body: (
        <p>
          A hosted API charges per token: no upfront hardware cost, but the total bill scales
          directly with usage. Self-hosting means paying for GPUs whether they are busy or not — a
          fixed cost, but each additional request costs almost nothing once the GPU is already
          running.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Hosted API" value="cost scales with usage" />
          <StatCard label="Self-hosted" value="fixed cost, near-zero per extra request" />
        </div>
      ),
    },
    {
      section: "4. Hosted API vs. Self-Hosted",
      title: "Where the Rest of This Module Comes Back In",
      body: (
        <p>
          Self-hosting only pays off if that fixed GPU capacity is actually used well — which is
          exactly what the rest of this module was about. Continuous batching, quantization, and
          reading these very metrics are how a self-hosted deployment gets enough throughput per
          GPU to make its fixed cost worth paying.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "4. Hosted API vs. Self-Hosted",
      title: "Control and Complexity, Not Just Cost",
      body: (
        <p>
          Cost is not the only factor. Self-hosting gives full control: choice of model, custom
          quantization, fine-tuning, and data that never leaves your own infrastructure — at the
          cost of operating that infrastructure yourself. A hosted API trades that control for
          convenience: someone else runs the GPUs, scales them, and keeps them updated.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Self-hosted" value="full control, you run the infrastructure" />
          <StatCard label="Hosted API" value="less control, zero infrastructure to run" />
        </div>
      ),
    },
    // -------------------- 5. Wrap-up --------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Latency is how long one request takes; throughput is how many requests finish per second — different metrics for the same server.</li>
            <li>Time to first token (TTFT) measures how quickly the first streamed token appears, which can look very different from total latency.</li>
            <li>Batching more requests together raises throughput but can raise each request&rsquo;s own latency — a tradeoff, not a bug.</li>
            <li>Reading these metrics together, not in isolation, is what lets you diagnose what is actually wrong with a server.</li>
            <li>A hosted API scales cost with usage and requires no infrastructure; self-hosting is a fixed cost that pays off once usage — and GPU utilization — is high enough.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "5. Wrap-up",
      title: "Closing: The End of This Module",
      body: (
        <div className="space-y-2">
          <p>
            That&rsquo;s every Unit in Inference. Model Serving, GPU, vLLM, Continuous Batching,
            Quantization, and Performance together cover how one GPU serves requests efficiently —
            from the request path itself to the levers that make it faster, cheaper, and easier to
            reason about.
          </p>
          <Link
            href="/inference"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Back to Inference overview →
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
              href="/inference/quantization"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to Quantization
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
