"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Equation } from "@/components/Equation";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { ModelServingDiagram } from "./ModelServingDiagram";

const CAPACITY = 10; // requests/sec this server can finish — fixed for the walkthrough's demo

function averageWaitMs(arrivalRate: number): number {
  return 1000 / (CAPACITY - arrivalRate);
}

const REPLICA_LABELS = ["Replica A", "Replica B", "Replica C"];
// Relative work per request. Positions 2 and 5 (0-indexed) are both heavy
// and land on the same replica under round-robin (both ≡ 2 mod 3) — a
// real, reproducible worst case for blind rotation, not a cherry-picked one.
const REQUEST_DURATIONS = [1, 1, 4, 1, 1, 4];

function simulateLoads(strategy: "round-robin" | "least-loaded"): number[] {
  const loads = REPLICA_LABELS.map(() => 0);
  REQUEST_DURATIONS.forEach((duration, i) => {
    const target = strategy === "round-robin" ? i % loads.length : loads.indexOf(Math.min(...loads));
    loads[target] += duration;
  });
  return loads;
}

/** Module 4 (Inference), Unit "Model Serving" — the module's first Unit.
 * No Southwear/Chloe/Maya story here: Inference follows GenAI Systems'
 * house style (plain Welcome→Sections→Wrap-up, no dialogue), not
 * Evaluation's narrative one. Covers spec.txt 19.1: the Client → Inference
 * Server → Model → Tokens request path, why serving is a different
 * problem from training, and why traffic at scale (not a single request)
 * is what the rest of this module's Units (GPU, vLLM, Continuous Batching,
 * Quantization, Performance) exist to fix. The "Try it yourself" queueing step uses the real M/M/1 average
 * wait time formula (1/(μ-λ)) as a first, honest taste of why latency
 * doesn't grow linearly with traffic — not a fabricated number. */
export function ModelServingWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const [arrivalRate, setArrivalRate] = useState(5);
  const resetArrivalRate = () => setArrivalRate(5);

  const wait = averageWaitMs(arrivalRate);
  const nearCapacity = arrivalRate >= 8;

  const [strategy, setStrategy] = useState<"round-robin" | "least-loaded">("round-robin");
  const resetStrategy = () => setStrategy("round-robin");
  const loads = simulateLoads(strategy);
  const maxLoad = Math.max(...loads);

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
          <p>This chapter covers how a trained model actually answers live requests, end to end:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Training vs. Serving</strong> — two different jobs, with two different goals.</li>
            <li><strong>The Serving Pipeline</strong> — the path every request follows: client, server, model, tokens.</li>
            <li><strong>What Can Go Wrong at Scale</strong> — why one request is easy, and a thousand is not.</li>
            <li><strong>Scaling Beyond One Server</strong> — why adding a server isn&rsquo;t instant, and how load gets split across the ones you have.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "Where This Fits: The Whole Inference Module",
      body: (
        <div className="space-y-2">
          <p>This is the first of 6 chapters in the Inference module. They are not 6 independent topics.</p>
          <p>
            A single GPU can only hold so much in memory, and can only crunch so many numbers
            per second. Every other chapter in this module is about getting more out of that same
            GPU, without buying a second one. The next chapter explains exactly why those two
            limits exist.
          </p>
          <p>
            Some chapters make more room in memory. One chapter fits more requests into the same
            amount of number-crunching. The last chapter checks whether all of that actually paid
            off.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm">
            {["Model Serving", "GPU", "vLLM", "Continuous Batching", "Quantization", "Performance"].map((u, i) => (
              <span key={u} className="flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-1.5 rounded-full border font-medium whitespace-nowrap ${
                    i === 0 ? "border-cyan-600 bg-cyan-50 text-cyan-800" : "border-neutral-200 bg-white text-neutral-500"
                  }`}
                >
                  {u}
                </span>
                {i < 5 && <span className="text-neutral-300">→</span>}
              </span>
            ))}
          </div>
          <table className="w-full text-base border-collapse max-w-md mx-auto">
            <thead>
              <tr className="text-left text-neutral-500 text-sm">
                <th className="pb-1.5 pr-3 font-medium">What starts to run out</th>
                <th className="pb-1.5 pr-3 font-medium">How it&rsquo;s fixed</th>
                <th className="pb-1.5 font-medium">Chapter</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700">
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3">How many requests can run at once</td>
                <td className="py-1.5 pr-3">Batching requests together</td>
                <td className="py-1.5">Continuous Batching</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3">How much fits in memory per request</td>
                <td className="py-1.5 pr-3">PagedAttention</td>
                <td className="py-1.5">vLLM</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3">How much room the model itself takes</td>
                <td className="py-1.5 pr-3">Quantization</td>
                <td className="py-1.5">Quantization</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      section: "Welcome",
      title: "The Big Picture",
      body: (
        <p>
          Fundamentals and GenAI Systems showed you what a model computes, and how to call it once.
          This chapter shows what happens once real users start sending it requests, one after
          another, without stopping.
        </p>
      ),
      visual: <ModelServingDiagram />,
    },
    // -------------------- 1. Training vs. Serving --------------------
    {
      section: "1. Training vs. Serving",
      title: "Training and Serving Optimize for Different Things",
      body: (
        <p>
          Training and serving run the same kind of model, but they are two different jobs.
          Training happens offline, on data you already have, and it can take hours. Serving
          happens online, one real request at a time, and it has to answer in milliseconds.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Training" value="offline, optimizes accuracy" />
          <StatCard label="Serving" value="online, optimizes latency + cost" />
        </div>
      ),
    },
    {
      section: "1. Training vs. Serving",
      title: "The Same Weights, a New Job",
      body: (
        <p>
          Serving does not change the model itself. It reuses the exact weights training already
          produced. What changes is the software wrapped around those weights: how requests get
          received, queued, and answered.
        </p>
      ),
      visual: undefined,
    },
    // -------------------- 2. The Serving Pipeline --------------------
    {
      section: "2. The Serving Pipeline",
      title: "A Request's Path",
      body: <p>Once a model is deployed, every request follows the same four-stage path.</p>,
      visual: <ModelServingDiagram />,
    },
    {
      section: "2. The Serving Pipeline",
      title: "Client: Where a Request Starts",
      body: (
        <p>
          The client sends a prompt, plus settings like max output length, over the network to
          wherever the model is running.
        </p>
      ),
      visual: <ModelServingDiagram highlight={["client"]} />,
    },
    {
      section: "2. The Serving Pipeline",
      title: "Inference Server: The Traffic Controller",
      body: (
        <p>
          The inference server sits between the client and the model: it receives incoming
          requests, decides which ones to run right now, and manages the model&rsquo;s memory.
          Later Units in this module — GPU, vLLM, Continuous Batching — go deep on exactly this
          stage.
        </p>
      ),
      visual: <ModelServingDiagram highlight={["server"]} />,
    },
    {
      section: "2. The Serving Pipeline",
      title: "Model: The Same Forward Pass, Run Again and Again",
      body: (
        <p>
          This is the same forward pass from Fundamentals&rsquo; Transformers Unit. Serving runs
          it once per output token, feeding each new token back in to predict the next one — the{" "}
          autoregressive loop you already met in Tiny LLM.
        </p>
      ),
      visual: <ModelServingDiagram highlight={["model"]} />,
    },
    {
      section: "2. The Serving Pipeline",
      title: "Tokens: Streamed Back, Not All at Once",
      body: (
        <p>
          A served model usually streams tokens back one at a time, instead of waiting for the
          whole answer to finish. That is why the first token can arrive quickly, even for a long
          response — the Performance Unit measures this timing directly.
        </p>
      ),
      visual: <ModelServingDiagram highlight={["tokens"]} />,
    },
    // -------------------- 3. What Can Go Wrong at Scale --------------------
    {
      section: "3. What Can Go Wrong at Scale",
      title: "One Request Is Easy",
      body: (
        <p>
          A single request, on its own, is never the hard part. Almost any hardware can run one
          request through the pipeline above and return an answer.
        </p>
      ),
      visual: <StatCard label="1 request" value="answers almost instantly" tone="good" />,
    },
    {
      section: "3. What Can Go Wrong at Scale",
      title: "A Thousand Requests Is a Different Problem",
      body: (
        <p>
          Real products do not get one request at a time. They get many requests, from many
          users, arriving at once. The same pipeline has to handle all of them, on the same
          limited hardware.
        </p>
      ),
      visual: <StatCard label="1,000 requests/sec" value="same hardware, same pipeline" tone="warn" />,
    },
    {
      section: "3. What Can Go Wrong at Scale",
      title: "Three Ways Scale Bites Back",
      body: (
        <div className="space-y-2">
          <p>As traffic grows, three things get worse at the same time:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Latency</strong> — requests start waiting behind each other.</li>
            <li><strong>Memory</strong> — the server needs more space to track more requests at once.</li>
            <li><strong>Cost</strong> — more requests need more hardware, or more time on the hardware you have.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Latency" value="climbs" tone="warn" />
          <StatCard label="Memory" value="fills up" tone="warn" />
          <StatCard label="Cost" value="multiplies" tone="warn" />
        </div>
      ),
    },
    {
      section: "3. What Can Go Wrong at Scale",
      title: "Try it yourself: watch latency near capacity",
      body: (
        <div className="space-y-2">
          <p>
            This server can finish about {CAPACITY} requests per second — call that its{" "}
            <strong>capacity</strong>. Drag the arrival rate up toward that capacity and watch the
            average wait:
          </p>
          <Equation tex={"\\text{Average wait} \\approx \\frac{1}{\\mu - \\lambda}"} />
          <p>
            <strong>μ</strong> (mu) is the server&rsquo;s capacity, in requests per second.{" "}
            <strong>λ</strong> (lambda) is the arrival rate you are about to set. As λ gets close
            to μ, the wait does not just grow — it explodes.
          </p>
        </div>
      ),
      controls: (
        <div className="w-full max-w-[320px]">
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Arrival rate (λ)</span>
              <span className="text-neutral-800 tabular-nums">{arrivalRate.toFixed(1)} req/s</span>
            </div>
            <input
              type="range"
              min={1}
              max={9.9}
              step={0.1}
              value={arrivalRate}
              onChange={(e) => setArrivalRate(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetArrivalRate,
      visual: (
        <StatCard
          label={`λ = ${arrivalRate.toFixed(1)} req/s, μ = ${CAPACITY} req/s`}
          value={`${wait.toFixed(0)} ms average wait`}
          tone={nearCapacity ? "warn" : "good"}
        />
      ),
    },
    // -------------------- 4. Scaling Beyond One Server --------------------
    {
      section: "4. Scaling Beyond One Server",
      title: "Cold Start: A New Server Isn't Instant",
      body: (
        <p>
          When one server&rsquo;s queue backs up, the obvious fix is another server. But a modern
          model&rsquo;s weights can be tens of gigabytes. Before a new server can answer even one
          request, it has to load all of that from storage into GPU memory — commonly tens of
          seconds, sometimes minutes.
        </p>
      ),
      visual: <StatCard label="7B-parameter model (FP16)" value="~14 GB to load, ~20–60s" tone="warn" />,
    },
    {
      section: "4. Scaling Beyond One Server",
      title: "Autoscaling's Blind Spot",
      body: (
        <p>
          Autoscaling reacts to rising traffic by starting new servers. But a new server takes
          just as long to load the model as any other did — so it is not ready until well after
          the spike that triggered it. Requests keep queueing on the servers that were already
          warm.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "4. Scaling Beyond One Server",
      title: "Warm Pools: Paying to Skip the Wait",
      body: (
        <p>
          The common fix is to keep extra servers already loaded and idle, ready to take traffic
          the instant it arrives. This avoids the cold-start wait, at the cost of paying for GPU
          time nothing is using yet.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Cold replica" value="ready in ~30s" tone="warn" />
          <StatCard label="Warm replica" value="ready instantly" tone="good" />
        </div>
      ),
    },
    {
      section: "4. Scaling Beyond One Server",
      title: "Load Balancing: Which Replica Gets This Request?",
      body: (
        <div className="space-y-2">
          <p>Once several replicas are warm, every new request has to go to one of them.</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Round-robin</strong> rotates through replicas in a fixed order.</li>
            <li><strong>Least-loaded</strong> sends each request to whichever replica currently has the least work queued.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Scaling Beyond One Server",
      title: "Try it yourself: round-robin vs. least-loaded",
      body: (
        <p>
          Six requests arrive in a row, with different amounts of work: {REQUEST_DURATIONS.join(", ")}{" "}
          (relative units). Switch strategies and watch how unevenly the load can land across{" "}
          {REPLICA_LABELS.length} replicas.
        </p>
      ),
      controls: (
        <div className="flex gap-2">
          {(["round-robin", "least-loaded"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStrategy(s)}
              className={`px-3 py-1.5 rounded-md text-base border ${
                strategy === s
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      ),
      resetAction: resetStrategy,
      visual: (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {REPLICA_LABELS.map((label, i) => (
              <StatCard key={label} label={label} value={`${loads[i]}`} tone={loads[i] === maxLoad ? "warn" : "good"} />
            ))}
          </div>
          <p className="text-sm text-neutral-500">Max load: {maxLoad}</p>
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
            <li>Training and serving run the same model, but optimize for different things: accuracy offline vs. latency and cost online.</li>
            <li>Every request follows the same path: client → inference server → model → tokens.</li>
            <li>The inference server sits between the client and the model, deciding which requests run right now and managing memory.</li>
            <li>The model itself just repeats the same autoregressive forward pass, one token at a time.</li>
            <li>A single request is always easy. The real problem is many requests at once, on the same hardware.</li>
            <li>As arrival rate approaches server capacity, average wait time does not grow smoothly — it explodes.</li>
            <li>Adding a server is not instant — loading a model&rsquo;s weights is a real, tens-of-seconds cold start, which autoscaling that reacts to traffic can&rsquo;t outrun.</li>
            <li>Warm pools skip the cold start by paying for idle capacity; load balancing then decides which replica each request goes to — least-loaded avoids the pileups blind round-robin can cause.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "5. Wrap-up",
      title: "Closing: The Rest of This Module",
      body: (
        <div className="space-y-2">
          <p>
            The next Unit looks at the GPU itself — why it can run so many calculations at once,
            and why its memory, not just its speed, is what actually limits how many requests fit.
            After that, every other Unit is a different way to push that same GPU further without
            buying a second one: vLLM, Continuous Batching, Quantization, and Performance (which
            also covers the hosted-vs-self-hosted decision).
          </p>
          <Link
            href="/inference/gpu"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to GPU →
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
