"use client";

import { useState, type ReactNode } from "react";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { Equation } from "@/components/Equation";

// Reuses Experiment Tracking's exact v1/v2/v3 numbers (quality 88/84/80,
// latency 900/650/300ms, cost $0.004/$0.002/$0.0009) as the versions this
// chapter's production system can run. v2 is "live now" — the exact
// version CI/CD & Deployment's Environment Promotion chapter walked
// through promoting into Production. v3 (the INT8-quantized version) is
// the cheaper option a reader can switch to in the cost Try-It-Yourself.
const VERSIONS = [
  { label: "v1", quality: 88, latencyMs: 900, cost: 0.004 },
  { label: "v2", quality: 84, latencyMs: 650, cost: 0.002 },
  { label: "v3", quality: 80, latencyMs: 300, cost: 0.0009 },
] as const;
type VersionLabel = (typeof VERSIONS)[number]["label"];

// One running scenario threads every Section together, the same way
// Evaluation Basics threads one refund-policy bug through Correctness,
// Faithfulness, and Relevancy: yesterday's p95 latency spike (Monitoring)
// turns out to be the same request whose trace gets inspected
// (Observability), and its retrieval-heavy path is also why v3 — cheaper
// per request — is worth considering (Cost). The trace's own stage
// latencies are written to sum to exactly BASELINE.p95LatencyMs, so a
// careful reader can check the arithmetic themselves.
const BASELINE = {
  requests: 14280,
  errors: 128,
  avgLatencyMs: 310,
  p95LatencyMs: 2320,
  avgInputTokens: 420,
  avgOutputTokens: 165,
  productionScore: 82,
};

const SLOW_TRACE = [
  { name: "Request", latencyMs: 10 },
  { name: "Agent", latencyMs: 40 },
  { name: "RAG", latencyMs: 20 },
  { name: "Retriever", latencyMs: 1850 },
  { name: "LLM", latencyMs: 390 },
  { name: "Response", latencyMs: 10 },
];

// Per-span detail for SLOW_TRACE — only the LLM span is a model call, so
// only it carries tokens; its cost ($0.0018) plus the Retriever's own
// vector-search cost ($0.0002) sum to exactly v2's $0.002/request from
// Experiment Tracking, so this table's numbers agree with Cost
// Monitoring's own, rather than being a disconnected illustration.
const SPAN_DETAILS: {
  name: string;
  latencyMs: number;
  status: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
}[] = [
  { name: "Request", latencyMs: 10, status: "ok" },
  { name: "Agent", latencyMs: 40, status: "ok" },
  { name: "RAG", latencyMs: 20, status: "ok" },
  { name: "Retriever", latencyMs: 1850, status: "ok", cost: 0.0002 },
  { name: "LLM", latencyMs: 390, status: "ok", inputTokens: BASELINE.avgInputTokens, outputTokens: BASELINE.avgOutputTokens, cost: 0.0018 },
  { name: "Response", latencyMs: 10, status: "ok" },
];

const ERROR_TRACE = [
  { name: "Request", latencyMs: 10 },
  { name: "Agent", latencyMs: 30 },
  { name: "RAG", latencyMs: 15 },
  { name: "Retriever", latencyMs: 210 },
  { name: "LLM (timeout, retried)", latencyMs: 5000 },
  { name: "LLM (retry)", latencyMs: 380 },
  { name: "Response", latencyMs: 10 },
];

// A right-skewed shape: most requests are fast, with a thin tail
// stretching far to the right. Weighted-midpoint average of these
// buckets works out to ~310ms (BASELINE.avgLatencyMs), and the 95th
// percentile falls inside the 1.5s-2.5s bucket, consistent with
// BASELINE.p95LatencyMs (2320ms) — the two Steps that use this chart
// aren't just illustrative, the numbers actually agree.
const LATENCY_BUCKETS = [
  { range: "0-100ms", pct: 35 },
  { range: "100-200ms", pct: 25 },
  { range: "200-300ms", pct: 15 },
  { range: "300-500ms", pct: 10 },
  { range: "500-800ms", pct: 6 },
  { range: "800ms-1.5s", pct: 5 },
  { range: "1.5s-2.5s", pct: 3 },
  { range: "2.5s+", pct: 1 },
] as const;

/** Module 5 (LLMOps), Unit "Monitoring & Observability" (spec 25 + 26 +
 * 27, cost folded in rather than its own Unit, plus spec 9's Shared
 * Observability Model as the unifying concept). Single-Chapter, no
 * tab-switcher, per this module's own established pattern for this Unit
 * (see module-5-llmops.md).
 *
 * Built to match Evaluation Basics' care level (per explicit user
 * instruction), not Experiment Tracking's deliberately lighter touch:
 * one concrete scenario threaded through every Section (a p95 latency
 * spike, inspected as a real trace, that also motivates the cost
 * comparison), each concept given its own Step rather than bundled, and
 * a genuine reveal Evaluation Basics-style — the average latency looks
 * fine (310ms) and only the distribution's tail (p95) exposes the
 * problem, the same "not every metric would have caught this" shape as
 * that Unit's own opening hook.
 *
 * Self-contained: Agent/RAG/Retriever/LLM are each explained fresh where
 * they appear in the trace, with only a light, optional pointer back to
 * GenAI Systems for a reader who's already done that module — never a
 * load-bearing dependency, matching Experiment Tracking's established
 * practice for cross-module references.
 *
 * A "Guardrails / Safety Monitoring" 2026 gap-check was raised while
 * planning this Unit and deliberately kept out — already covered by
 * GenAI Systems' AgentWalkthrough.tsx (untrusted-tool-result injection +
 * an approve/deny gate), which is the better-fitting home since the risk
 * arrives through what an agent reads and acts on, not through a
 * production-metrics dashboard. See module-5-llmops.md's note. */
export function MonitoringWalkthrough({
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
    controls?: ReactNode;
    resetAction?: () => void;
  }

  // -------------------- Try it yourself: demo traffic (Monitoring) --------------------
  const [traffic, setTraffic] = useState(BASELINE);
  const resetTraffic = () => setTraffic(BASELINE);
  const simulateHour = () => {
    setTraffic((t) => {
      const newRequests = 400 + Math.floor(Math.random() * 300);
      const errorRate = 0.006 + Math.random() * 0.01;
      const newErrors = Math.round(newRequests * errorRate);
      const jitter = 1 + (Math.random() - 0.5) * 0.3;
      return {
        requests: t.requests + newRequests,
        errors: t.errors + newErrors,
        avgLatencyMs: Math.round(t.avgLatencyMs * (1 + (Math.random() - 0.5) * 0.1)),
        p95LatencyMs: Math.round(t.p95LatencyMs * jitter),
        avgInputTokens: t.avgInputTokens,
        avgOutputTokens: t.avgOutputTokens,
        productionScore: Math.min(100, Math.max(0, Math.round(t.productionScore + (Math.random() - 0.5) * 4))),
      };
    });
  };

  // -------------------- Try it yourself: inspect a trace (Observability) --------------------
  const [inspected, setInspected] = useState<string | null>(null);

  // -------------------- Try it yourself: cost (Cost Monitoring) --------------------
  const [costVersion, setCostVersion] = useState<VersionLabel>("v2");
  const [monthlyRequests, setMonthlyRequests] = useState(400000);
  const chosenCostVersion = VERSIONS.find((v) => v.label === costVersion)!;
  const estimatedMonthlyCost = chosenCostVersion.cost * monthlyRequests;
  const resetCost = () => {
    setCostVersion("v2");
    setMonthlyRequests(400000);
  };

  // A waterfall/Gantt layout: one row per stage, each bar positioned by
  // its own cumulative start time within a shared timeline track. Since
  // stages run one after another, each row's bar necessarily starts
  // further right than the row above it — stacking the rows top-to-bottom
  // turns that into an actual staircase of bars, not just staggered
  // labels, and every stage (even a 10ms one) gets its own full-width row
  // instead of competing for space with its neighbors inside one bar.
  const traceBar = (stages: { name: string; latencyMs: number }[], focusName?: string | null) => {
    const total = stages.reduce((s, x) => s + x.latencyMs, 0);
    let cumulative = 0;
    const rows = stages.map((s) => {
      const start = cumulative;
      cumulative += s.latencyMs;
      return { ...s, start };
    });
    return (
      <div className="space-y-1.5">
        <div className="space-y-1">
          {rows.map((r) => (
            <div key={r.name} className="grid grid-cols-[92px_1fr] gap-2 items-center">
              <div
                className={`text-xs text-right truncate ${
                  focusName === r.name ? "text-red-700 font-semibold" : "text-neutral-600"
                }`}
              >
                {r.name}
              </div>
              <div className="relative h-5 bg-neutral-100 rounded">
                <div
                  className={`absolute top-0 h-full rounded flex items-center px-1.5 text-[11px] font-medium text-white whitespace-nowrap overflow-hidden ${
                    focusName === r.name ? "bg-red-500" : "bg-cyan-600"
                  }`}
                  style={{
                    left: `${(r.start / total) * 100}%`,
                    width: `${Math.max((r.latencyMs / total) * 100, 1.2)}%`,
                  }}
                  title={`${r.name}: ${r.latencyMs}ms`}
                >
                  {r.latencyMs / total > 0.1 ? `${r.latencyMs}ms` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[92px_1fr] gap-2 text-[10px] text-neutral-500">
          <div />
          <div className="flex justify-between">
            <span>0ms</span>
            <span>{total}ms</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-neutral-600 pt-1">
          {stages.map((s) => (
            <span key={s.name} className={focusName === s.name ? "text-red-700 font-medium" : ""}>
              {s.name}: {s.latencyMs}ms
            </span>
          ))}
        </div>
        <div className="text-sm text-neutral-500">Total: {total}ms</div>
      </div>
    );
  };

  const latencyHistogram = (markers?: { range: string; label: string }[]) => {
    const maxPct = Math.max(...LATENCY_BUCKETS.map((b) => b.pct));
    const markerFor = (range: string) => markers?.find((m) => m.range === range);
    return (
      <div className="space-y-1">
        <div className="flex items-end gap-1 h-32">
          {LATENCY_BUCKETS.map((b) => {
            const marker = markerFor(b.range);
            return (
              <div key={b.range} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                <span className="text-xs text-neutral-500">{b.pct}%</span>
                <div
                  className={`w-full rounded-t-sm ${marker ? "bg-amber-400" : "bg-cyan-200"}`}
                  style={{ height: `${(b.pct / maxPct) * 100}%` }}
                  title={`${b.range}: ${b.pct}% of requests`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 text-[11px] text-neutral-500">
          {LATENCY_BUCKETS.map((b) => (
            <span key={b.range} className="flex-1 text-center">{b.range}</span>
          ))}
        </div>
        {markers && markers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 text-sm pt-1">
            {markers.map((m) => (
              <span key={m.range} className="text-amber-700 font-medium">↑ {m.label}</span>
            ))}
          </div>
        )}
        <p className="text-sm text-neutral-500 text-center pt-1">
          Most requests are fast; a thin tail stretches far to the right.
        </p>
      </div>
    );
  };

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            A version is live in Production. This chapter is about what happens after that. It
            covers
            how you&rsquo;d actually know whether it&rsquo;s working. It also covers what to do
            when one specific
            request goes wrong, and what it&rsquo;s costing.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Monitoring</strong> — is the system healthy right now, in aggregate?</li>
            <li><strong>Observability</strong> — what happened inside one specific request?</li>
            <li><strong>Cost Monitoring</strong> — what is this actually costing, at scale?</li>
            <li><strong>The Shared Telemetry Model</strong> — how one record answers all three questions.</li>
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
          Version v2 went live yesterday, promoted through the pipeline from the last chapter.
          This morning, someone asks: &ldquo;is it working?&rdquo; That turns out to be three
          different questions, not one. Is it healthy overall? What happened in this one
          complaint someone just filed? Is it affordable at the traffic it&rsquo;s actually
          getting? One scenario runs through this whole chapter to answer all three.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Is it healthy?</div>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">What happened in this one request?</div>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">What does it cost?</div>
        </div>
      ),
    },
    // -------------------- 1. Monitoring --------------------
    {
      section: "1. Monitoring",
      title: "Monitoring vs. Evaluation: Continuous, Not Once",
      body: (
        <p>
          <strong>Evaluation</strong> runs a version against a fixed set of test questions with
          known good answers, once, before it ships. <strong>Monitoring</strong> watches the
          version continuously, on real traffic, after it ships. Most real traffic has no
          pre-written correct answer to check against. Monitoring is what tells you a healthy
          version has stayed healthy, days or weeks after the evaluation that approved it.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">
            Evaluation
            <br />
            <span className="text-neutral-500">Fixed test set, once, before shipping</span>
          </div>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
            Monitoring
            <br />
            <span className="text-neutral-500">Real traffic, continuously, after shipping</span>
          </div>
        </div>
      ),
    },
    {
      section: "1. Monitoring",
      title: "Requests: How Much Traffic",
      body: (
        <p>
          The most basic number: how many requests the system handled in some window of time.
          On its own it says nothing about quality. It just establishes the scale everything
          else in this chapter has to be read against.
        </p>
      ),
      visual: <StatCard label="Requests (last 24h)" value={BASELINE.requests.toLocaleString()} />,
    },
    {
      section: "1. Monitoring",
      title: "Errors: How Often Does It Fail",
      body: (
        <p>
          An error is a request that failed outright. That&rsquo;s a timeout, a crashed call, an
          invalid
          response the system couldn&rsquo;t recover from. The error rate is errors divided by
          total requests.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <Equation tex={"\\text{error rate} = \\frac{\\text{errors}}{\\text{requests}}"} />
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Requests" value={BASELINE.requests.toLocaleString()} />
            <StatCard label="Errors" value={BASELINE.errors.toLocaleString()} tone="warn" />
            <StatCard label="Error rate" value={`${((BASELINE.errors / BASELINE.requests) * 100).toFixed(1)}%`} tone="warn" />
          </div>
        </div>
      ),
    },
    {
      section: "1. Monitoring",
      title: "Latency Has a Shape, Not Just an Average",
      body: (
        <p>
          Latency isn&rsquo;t one number — every request has its own latency, and together they
          form a distribution. Most requests here are fast (a short question, or one already
          served from cache). But a smaller share take a genuinely slower path through the
          system. A single average blends the fast majority and the slow minority into one
          number. That blend can hide exactly the part you&rsquo;d want to know about.
        </p>
      ),
      visual: latencyHistogram(),
    },
    {
      section: "1. Monitoring",
      title: "Why p95, Not the Average",
      body: (
        <p>
          <strong>p95</strong> is the latency below which 95% of requests fall — the number the
          slowest 1-in-20 requests exceed. Here, the average looks fine at {BASELINE.avgLatencyMs}
          ms. p95 tells a different story: {BASELINE.p95LatencyMs}ms, nearly 7.5x slower. The
          average was never wrong, exactly. It just averaged away the one detail that mattered.
          A real slice of users are having a much worse time than &ldquo;fine on average&rdquo;
          suggests.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          {latencyHistogram([
            { range: "300-500ms", label: `Average: ${BASELINE.avgLatencyMs}ms` },
            { range: "1.5s-2.5s", label: `p95: ${BASELINE.p95LatencyMs}ms` },
          ])}
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Average latency" value={`${BASELINE.avgLatencyMs}ms`} tone="good" />
            <StatCard label="p95 latency" value={`${BASELINE.p95LatencyMs}ms`} tone="warn" note="the slowest 1-in-20 requests" />
          </div>
        </div>
      ),
    },
    {
      section: "1. Monitoring",
      title: "A Live Evaluation Score",
      body: (
        <p>
          Some teams also automatically re-score a sample of live traffic, continuously. That&rsquo;s
          the same kind of
          metric Evaluation Basics covers — not a one-time check at deploy. Here
          that sampled score is {BASELINE.productionScore}/100. That&rsquo;s close to but not
          identical to the
          84/100 v2 scored at deploy time. Real traffic is never quite the same mix of questions
          as the fixed evaluation set that approved it.
        </p>
      ),
      visual: <StatCard label="Sampled production score" value={`${BASELINE.productionScore}/100`} />,
    },
    {
      section: "1. Monitoring",
      title: "Model Version: Which One Is Actually Serving",
      body: (
        <p>
          Every one of the numbers above is only meaningful attached to a specific version.
          That&rsquo;s the
          exact one the CI/CD & Deployment chapter promoted into Production. Without recording
          which version served each request, a quality drop can&rsquo;t be traced back to a
          specific change. Monitoring and the version history from Experiment Tracking are meant
          to be read together, not separately.
        </p>
      ),
      visual: <StatCard label="Model version serving" value="v2" note="promoted to Production 2 days ago" />,
    },
    {
      section: "1. Monitoring",
      title: "Try it yourself: generate traffic and watch the dashboard",
      body: (
        <p>
          Simulate another hour of live traffic and watch every number above move together.
          This is the same kind of safe, synthetic traffic generation a real monitoring setup
          uses. It tests its own dashboards before relying on them for real incidents.
        </p>
      ),
      controls: (
        <button onClick={simulateHour} className={nextBtn}>
          Simulate next hour of traffic
        </button>
      ),
      resetAction: resetTraffic,
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard label="Requests" value={traffic.requests.toLocaleString()} />
          <StatCard label="Errors" value={traffic.errors.toLocaleString()} tone="warn" />
          <StatCard label="Error rate" value={`${((traffic.errors / traffic.requests) * 100).toFixed(1)}%`} tone="warn" />
          <StatCard label="Avg latency" value={`${traffic.avgLatencyMs}ms`} tone="good" />
          <StatCard label="p95 latency" value={`${traffic.p95LatencyMs}ms`} tone="warn" />
          <StatCard label="Production score" value={`${traffic.productionScore}/100`} />
        </div>
      ),
    },
    // -------------------- 2. Observability --------------------
    {
      section: "2. Observability",
      title: "Why an Aggregate Number Isn't Enough",
      body: (
        <p>
          A p95 of {BASELINE.p95LatencyMs}ms says the slow tail exists, but not which requests
          are in it, or why. Someone now reports: &ldquo;my request took over two seconds.&rdquo;
          Monitoring&rsquo;s aggregate numbers can&rsquo;t answer that — they were never about
          any one request in the first place. <strong>Observability</strong> is the ability to
          zoom into exactly one.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Observability",
      title: "A Trace: One Request's Full Journey",
      body: (
        <p>
          A <strong>trace</strong> is the complete record of everything one single request did,
          identified by one trace ID. Instead of one latency number, a trace breaks that number
          into the sequence of operations that produced it. That&rsquo;s the same request from the
          complaint
          above, inspected directly.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Observability",
      title: "Walking the Trace",
      body: (
        <p>
          This system answers a question by retrieving supporting documents before generating a
          response. That&rsquo;s the same RAG pattern GenAI Systems covers, walked here as one
          request&rsquo;s
          trace. An <strong>Agent</strong> decides what to do, and hands off to a{" "}
          <strong>RAG</strong> step that orchestrates retrieval. A <strong>Retriever</strong> does
          the actual document search. An <strong>LLM</strong> generates the answer from what was
          retrieved, and a <strong>Response</strong> is returned. Every one of those five hops
          adds its own slice of the total latency.
        </p>
      ),
      visual: traceBar(SLOW_TRACE),
    },
    {
      section: "2. Observability",
      title: "A Span: One Operation's Own Numbers",
      body: (
        <p>
          Each hop in a trace is called a <strong>span</strong>. It has its own start time,
          latency,
          status, and (for a model call) its own token count and cost. That&rsquo;s independent of
          every other
          span in the trace. A trace is really just an ordered list of spans. Reading one span in
          isolation is how you find which specific hop is responsible for the total.
        </p>
      ),
      visual: (
        <div className="overflow-x-auto rounded-md border border-neutral-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500 bg-neutral-50">
                <th className="py-1.5 px-3 font-medium">Operation</th>
                <th className="py-1.5 px-3 font-medium">Latency</th>
                <th className="py-1.5 px-3 font-medium">Status</th>
                <th className="py-1.5 px-3 font-medium">Tokens (in/out)</th>
                <th className="py-1.5 px-3 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="text-neutral-800">
              {SPAN_DETAILS.map((s) => (
                <tr key={s.name} className="border-t border-neutral-200">
                  <td className="py-1.5 px-3 font-medium">{s.name}</td>
                  <td className="py-1.5 px-3">{s.latencyMs}ms</td>
                  <td className="py-1.5 px-3 text-emerald-700">{s.status}</td>
                  <td className="py-1.5 px-3">{s.inputTokens !== undefined ? `${s.inputTokens} / ${s.outputTokens}` : "—"}</td>
                  <td className="py-1.5 px-3">{s.cost !== undefined ? `$${s.cost.toFixed(4)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      section: "2. Observability",
      title: "Try it yourself: find the slow span",
      body: (
        <p>
          Click each stage of the trace below — the same {BASELINE.p95LatencyMs}ms request from
          Monitoring&rsquo;s reveal — and find which one is actually responsible for the total.
        </p>
      ),
      controls: (
        <div className="flex gap-1.5 flex-wrap">
          {SLOW_TRACE.map((s) => (
            <button
              key={s.name}
              onClick={() => setInspected(s.name)}
              className={`px-2.5 py-1.5 rounded-md text-sm font-medium border ${
                inspected === s.name
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      ),
      resetAction: () => setInspected(null),
      visual: (
        <div className="space-y-2">
          {traceBar(SLOW_TRACE, inspected)}
          {inspected && (
            <StatCard
              label={`Span: ${inspected}`}
              value={`${SLOW_TRACE.find((s) => s.name === inspected)!.latencyMs}ms`}
              tone={inspected === "Retriever" ? "warn" : "default"}
              note={
                inspected === "Retriever"
                  ? "This one span is 80% of the whole request — this, not the LLM, is the bottleneck."
                  : undefined
              }
            />
          )}
        </div>
      ),
    },
    {
      section: "2. Observability",
      title: "Errors Inside a Trace: Which Hop Failed",
      body: (
        <p>
          A trace also explains errors, not just slowness. Here the first LLM call times out.
          The Agent chapter&rsquo;s own retry rule applies (one retry, not unlimited). The second
          attempt succeeds, and the request returns a correct answer, just a very slow one. This
          request counts toward the slow tail, not the error count: it succeeded, but much more
          slowly than usual.
        </p>
      ),
      visual: traceBar(ERROR_TRACE, "LLM (timeout, retried)"),
    },
    // -------------------- 3. Cost Monitoring --------------------
    {
      section: "3. Cost Monitoring",
      title: "Token Usage: What Actually Drives Cost",
      body: (
        <p>
          A version can be fast, correct, and still unaffordable once real traffic is applied to
          its per-request price. That price starts with tokens. Every request has its own
          input and output token count; cost is tokens × price per token.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Avg input tokens" value={`${BASELINE.avgInputTokens}`} />
          <StatCard label="Avg output tokens" value={`${BASELINE.avgOutputTokens}`} />
        </div>
      ),
    },
    {
      section: "3. Cost Monitoring",
      title: "From One Request to a Monthly Bill",
      body: (
        <p>
          Multiply the cost of one request by how many requests happen in a month. A small
          per-request cost becomes a large total cost at that volume.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <Equation tex={"\\text{estimated monthly cost} = \\text{cost per request} \\times \\text{requests per month}"} />
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Cost per request (v2)" value="$0.002" />
            <StatCard label="Requests / month" value={(BASELINE.requests * 30).toLocaleString()} note="24h volume × 30" />
            <StatCard label="Estimated monthly cost" value={`$${(0.002 * BASELINE.requests * 30).toFixed(2)}`} tone="warn" />
          </div>
        </div>
      ),
    },
    {
      section: "3. Cost Monitoring",
      title: "Try it yourself: change the model, watch the estimate",
      body: (
        <p>
          Switch between the three versions from Experiment Tracking and adjust monthly volume.
          That&rsquo;s the same v3 (quantized, cheaper, slightly lower quality) from that chapter.
          It&rsquo;s a real
          option here too, not just a hypothetical.
        </p>
      ),
      controls: (
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            {VERSIONS.map((v) => (
              <button
                key={v.label}
                onClick={() => setCostVersion(v.label)}
                className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                  costVersion === v.label
                    ? "bg-cyan-600 border-cyan-600 text-white"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {v.label} (${v.cost.toFixed(4)}/req, {v.quality}/100)
              </button>
            ))}
          </div>
          <label className="block text-base w-full">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Requests / month</span>
              <span className="text-neutral-800 tabular-nums">{monthlyRequests.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={50000}
              max={1000000}
              step={10000}
              value={monthlyRequests}
              onChange={(e) => setMonthlyRequests(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetCost,
      visual: (
        <StatCard
          label={`Estimated monthly cost (${costVersion})`}
          value={`$${estimatedMonthlyCost.toFixed(2)}`}
          tone={costVersion === "v3" ? "good" : "default"}
        />
      ),
    },
    // -------------------- 4. The Shared Telemetry Model --------------------
    {
      section: "4. The Shared Telemetry Model",
      title: "One Record, Emitted by Every Operation",
      body: (
        <p>
          Every operation this chapter has shown — a full request, or one span inside it. It
          emits
          one structured record with the same shape every time. Here is one real example: the LLM
          span from the trace earlier. It&rsquo;s the same numbers as its row in the span table.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { field: "trace_id", meaning: "Groups every record in this one request's trace together", example: "req_8f2a1c" },
            { field: "request_id", meaning: "This request's own ID — usually the same value as trace_id", example: "req_8f2a1c" },
            { field: "artifact_id", meaning: "Which saved AI Artifact this is", example: "art_myrag" },
            { field: "artifact_version", meaning: "Which version of that artifact", example: "v2" },
            { field: "module", meaning: "Which part of the system produced this record (rag, agent, llm_api, ...)", example: "llm_api" },
            { field: "operation", meaning: "The specific action within that module", example: "generate" },
            { field: "model", meaning: "The model this call used — one piece of what a version bundles together", example: "Model B" },
            { field: "latency", meaning: "How long this operation took", example: "390ms" },
            { field: "input_tokens", meaning: "Tokens sent to the model (model calls only)", example: "420" },
            { field: "output_tokens", meaning: "Tokens the model generated (model calls only)", example: "165" },
            { field: "cost", meaning: "Price of this operation (model calls only)", example: "$0.0018" },
            { field: "status", meaning: "Did this operation succeed", example: "ok" },
            { field: "error", meaning: "What went wrong, if anything — empty on success", example: "—" },
            { field: "timestamp", meaning: "When this happened", example: "2026-09-19T08:14:02Z" },
          ].map((row) => (
            <StatCard key={row.field} label={row.field} value={row.example} note={row.meaning} />
          ))}
        </div>
      ),
    },
    {
      section: "4. The Shared Telemetry Model",
      title: "Three Questions, One Dataset",
      body: (
        <div className="space-y-2">
          <p>Every number in this chapter came from this same set of records, read three different ways:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Monitoring</strong> — aggregate every record: sum requests, count errors, compute latency percentiles.</li>
            <li><strong>Observability</strong> — filter to one <code>trace_id</code>, and read that trace&rsquo;s records in order.</li>
            <li><strong>Cost Monitoring</strong> — sum the <code>cost</code> field, grouped by <code>artifact_version</code> or by time.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    // -------------------- Wrap-up --------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Monitoring is continuous, on real traffic, unlike Evaluation&rsquo;s one-time fixed test set.</li>
            <li>An average can look healthy while p95 exposes a real slow tail an average hides.</li>
            <li>Observability zooms into one request&rsquo;s trace, made of spans, to find which specific operation is responsible.</li>
            <li>Cost Monitoring turns a per-request price into a monthly bill by multiplying by real traffic volume.</li>
            <li>All three are the same underlying structured records, read three different ways.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "5. Wrap-up",
      title: "Closing: The Rest of This Module",
      body: (
        <p>
          Monitoring caught the slow tail; Observability explained it. What happens when
          monitoring instead catches a real quality drop after a deploy? And what happens when
          you need to get back to the version that worked? Regression & Rollback is next.
        </p>
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
