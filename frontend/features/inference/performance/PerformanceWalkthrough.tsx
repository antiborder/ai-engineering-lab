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
            about reading what that behavior looks like in a server&rsquo;s own metrics. Those
            metrics are
            latency, throughput, and time to first token. Using them together, we make one final
            decision.
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
          A server produces a handful of metrics every second. Those metrics are how long each
          request takes, how
          many finish per second, and how quickly the first word appears. Read separately, these
          metrics can mislead. Read together, they tell you exactly what to fix — and eventually,
          whether to run the GPU yourself at all.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Throughput" value="requests per second" />
          <StatCard label="Time to first token" value="time to the first word" />
          <StatCard label="Latency" value="time per request" />
        </div>
      ),
    },
    // -------------------- 1. Latency, Throughput, and Time to First Token --------------------
    {
      section: "1. Latency, Throughput, and Time to First Token",
      title: "Average Latency, Recapped",
      body: (
        <p>
          Model Serving showed that a single request answers almost instantly. But that latency —
          how long one request takes, start to finish — climbs sharply as traffic approaches a
          server&rsquo;s capacity. Averaged across every request in a period, this is what a
          dashboard calls <strong>average latency</strong>.
        </p>
      ),
      visual: (
        <StatCard
          label={`Same ${CAPACITY} req/sec server, at 8 req/sec arrivals`}
          value={`${averageWaitMs(8)} ms average latency`}
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
          can differ by up to 24×. That&rsquo;s what the published benchmarks in that chapter
          showed.
        </p>
      ),
      visual: <StatCard label="vLLM vs. naive serving, same GPU" value="up to 24× throughput" tone="good" />,
    },
    {
      section: "1. Latency, Throughput, and Time to First Token",
      title: "A New Measurement: Time to First Token",
      body: (
        <p>
          Model Serving showed that a served model streams tokens back one at a time. That&rsquo;s
          instead of
          waiting for the whole answer to finish. <strong>Time to first token (TTFT)</strong>
          measures
          exactly that moment. It&rsquo;s how long the reader waits before the very first token of
          the
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
          For one response, the two can diverge a lot. In this example, the first token streams
          back in 150 ms. But the full response is 200 tokens long. So the total latency for that
          one request is much longer. TTFT tells you how responsive the server feels; total
          latency tells you how long that one answer actually takes.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Time to first token" value="150 ms" tone="good" />
          <StatCard label="Total latency (200-token response)" value="4.0 sec" />
        </div>
      ),
    },
    {
      section: "1. Latency, Throughput, and Time to First Token",
      title: "From One Request to a Dashboard: Three Metrics, Averaged",
      body: (
        <p>
          A live dashboard never shows just one response — it shows every request from a period,
          averaged. From here on, this chapter tracks exactly three metrics:{" "}
          <strong>throughput</strong>, <strong>average time to first token</strong>, and{" "}
          <strong>average latency</strong>. Time to first token and total latency were both just
          about one request. Averaged across many requests, they become the two time-based metrics
          a real dashboard actually shows.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Throughput" value="requests/sec" />
          <StatCard label="Average time to first token" value="TTFT, averaged" />
          <StatCard label="Average latency" value="total latency, averaged" />
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
          own turn. That adds latency it would not have paid running alone. More throughput per
          GPU
          often costs a little latency per request. That&rsquo;s a tradeoff every serving system
          has to
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
      title: "Let's Look at a Dashboard",
      body: (
        <div className="space-y-2">
          <p>A dashboard shows these three values. Watch how they change across different situations:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Throughput</li>
            <li>Average time to first token</li>
            <li>Average latency</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Throughput" value="20 req/sec" />
          <StatCard label="Average time to first token" value="150 ms" />
          <StatCard label="Average latency" value="500 ms" />
        </div>
      ),
    },
    {
      section: "3. Reading a Metrics Dashboard",
      title: "Scenario: Responses Are Just Longer Than Usual",
      body: (
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          <li>
            <strong>Symptom:</strong> time to first token and throughput both look close to
            normal — only average latency is elevated.
          </li>
          <li>
            <strong>Likely cause:</strong> the model is generating unusually long responses, one
            token at a time. The server still starts each response just as quickly as ever. So
            it
            is not a queueing problem — each response simply takes longer to finish once started.
          </li>
        </ul>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Throughput" value="18 req/sec" note="usually 20" />
          <StatCard label="Average time to first token" value="140 ms" note="normal" tone="good" />
          <StatCard label="Average latency" value="9 sec" note="usually 2 sec" tone="warn" />
        </div>
      ),
    },
    {
      section: "3. Reading a Metrics Dashboard",
      title: "Scenario: Throughput and Latency Rising Together, On Purpose",
      body: (
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          <li>
            <strong>Symptom:</strong> throughput is at its highest recorded level. Both time
            to first token and average latency have crept up slightly too.
          </li>
          <li>
            <strong>Likely cause:</strong> the server is intentionally batching more aggressively
            to serve more requests overall. That&rsquo;s the Section 2 tradeoff, working as
            intended, not a
            regression.
          </li>
        </ul>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Throughput" value="24 req/sec" note="peak" tone="good" />
          <StatCard label="Average time to first token" value="220 ms" note="usually 150 ms" tone="warn" />
          <StatCard label="Average latency" value="800 ms" note="usually 500 ms" tone="warn" />
        </div>
      ),
    },
    {
      section: "3. Reading a Metrics Dashboard",
      title: "Scenario: All Three Metrics Move Together",
      body: (
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          <li>
            <strong>Symptom:</strong> throughput has fallen well below its usual level. Both
            time to first token and average latency have risen sharply.
          </li>
          <li>
            <strong>Likely cause:</strong> more than one real cause can produce exactly this
            pattern:
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>
                A traffic spike outran autoscaling. Model Serving showed a new server takes a
                real, tens-of-seconds cold start. So requests keep queueing on servers that are
                already warm.
              </li>
              <li>
                A fragmented KV cache is crowding out room for other requests. vLLM showed naive
                reservation can waste 60&ndash;80% of a GPU&rsquo;s KV cache memory.
              </li>
            </ul>
            <div className="mt-1">
              Telling them apart needs a signal beyond these three metrics. Check whether a
              scaling event just fired, or whether GPU/KV-cache memory utilization is unusually
              high.
            </div>
          </li>
        </ul>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Throughput" value="6 req/sec" note="usually 20" tone="warn" />
          <StatCard label="Average time to first token" value="1.8 sec" note="usually 150 ms" tone="warn" />
          <StatCard label="Average latency" value="3.5 sec" note="usually 500 ms" tone="warn" />
        </div>
      ),
    },
    // -------------------- 4. Hosted API vs. Self-Hosted --------------------
    {
      section: "4. Hosted API vs. Self-Hosted",
      title: "What Is a Hosted API?",
      body: (
        <p>
          A hosted API means someone else already has the model running, on their own GPUs, in
          their own datacenter. That&rsquo;s the same shape as GenAI Systems&rsquo; LLM API
          chapter. Your app
          sends a request over the internet, their server runs it, and you get an answer back. You
          never touch the hardware; you just pay for what you use.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Your app</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Internet</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
            Provider&rsquo;s GPU
            <br />
            (they run it)
          </div>
        </div>
      ),
    },
    {
      section: "4. Hosted API vs. Self-Hosted",
      title: "What Is Self-Hosting?",
      body: (
        <p>
          Self-hosting means running the model yourself, on a GPU you rent or own. Everything this
          module covered — the serving engine, GPU memory, batching, quantization — becomes your
          responsibility to set up and keep running, not someone else&rsquo;s.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Your app</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
            Your own GPU
            <br />
            (rented or owned)
          </div>
        </div>
      ),
    },
    {
      section: "4. Hosted API vs. Self-Hosted",
      title: "The Comparison, Side by Side",
      body: (
        <p>
          Same two options, put next to each other. Neither is universally better — the right
          choice depends on how much traffic you have and how much control you need.
        </p>
      ),
      visual: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-1 pr-3 font-medium"></th>
                <th className="py-1 px-3 font-medium">Hosted API</th>
                <th className="py-1 px-3 font-medium">Self-Hosted</th>
              </tr>
            </thead>
            <tbody className="text-neutral-800">
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Who runs the GPU</td>
                <td className="py-1.5 px-3">The provider</td>
                <td className="py-1.5 px-3">You</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Cost structure</td>
                <td className="py-1.5 px-3">Scales with usage, no upfront cost</td>
                <td className="py-1.5 px-3">Fixed cost, near-zero per extra request</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Control</td>
                <td className="py-1.5 px-3">Limited to what the API exposes</td>
                <td className="py-1.5 px-3">Full — model choice, quantization, fine-tuning</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Setup &amp; operations</td>
                <td className="py-1.5 px-3">None — fully managed</td>
                <td className="py-1.5 px-3">You run and maintain everything</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      section: "4. Hosted API vs. Self-Hosted",
      title: "Where the Rest of This Module Comes Back In",
      body: (
        <p>
          Self-hosting only pays off if that fixed GPU capacity is actually used well. That&rsquo;s
          exactly what the rest of this module was about. Continuous batching, quantization, and
          reading these very metrics are how a self-hosted deployment gets enough throughput per
          GPU. That&rsquo;s what makes its fixed cost worth paying.
        </p>
      ),
      visual: undefined,
    },
    // -------------------- 5. Wrap-up --------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A dashboard tracks three metrics: throughput, average time to first token, and average latency. Each is an average across every request in a period, not one request&rsquo;s own numbers.</li>
            <li>Time to first token measures how quickly the first streamed token appears. That can look very different from a single request&rsquo;s total latency.</li>
            <li>Batching more requests together raises throughput but can raise average latency — a tradeoff, not a bug.</li>
            <li>The same three metrics, read together, diagnose what is likely wrong — but not always uniquely. Only average latency rising usually just means longer responses. Throughput and latency rising together on purpose is Continuous Batching&rsquo;s own tradeoff, not a problem. All three worsening together can mean more than one thing, like a cold-starting server or a fragmented KV cache. That needs a signal beyond these three metrics to tell apart.</li>
            <li>A hosted API scales cost with usage and requires no infrastructure. Self-hosting is a fixed cost that pays off once usage — and GPU utilization — is high enough.</li>
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
            Quantization, and Performance together cover how one GPU serves requests efficiently.
            That covers everything from the request path itself to the levers that make it
            faster, cheaper, and easier to
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
