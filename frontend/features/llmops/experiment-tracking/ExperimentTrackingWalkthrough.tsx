"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";

// v1/v2 numbers are the exact ones Evaluation's Regression Testing chapter
// established (Model A → Model B): quality 88→84, latency 900ms→650ms,
// cost $0.004→$0.002. Reused verbatim, not recomputed, so a reader who did
// that chapter recognizes this exact comparison. v3 is new here: the same
// Model B, quantized to INT8 — reusing Inference's Quantization Unit's own
// numbers (roughly 2x speedup, modest quality risk at INT8, not INT4's
// high risk) rather than inventing a fresh multiplier.
interface RunStat {
  changed: string;
  quality: number;
  latencyMs: number;
  cost: number;
}
const V1: RunStat = { changed: "Baseline", quality: 88, latencyMs: 900, cost: 0.004 };
const V2: RunStat = { changed: "Switched to Model B", quality: 84, latencyMs: 650, cost: 0.002 };
const V3: RunStat = { changed: "Model B, quantized to INT8", quality: 80, latencyMs: 300, cost: 0.0009 };

/** Module 5 (LLMOps), Unit "Experiment Tracking" — the module's first
 * Unit. Plain house style (no Southwear/Chloe/Maya dialogue), matching
 * Inference rather than Evaluation, per explicit user choice.
 *
 * Reuses Evaluation's exact v1/v2 numbers (Model A → Model B: quality
 * 88→84, latency 900ms→650ms, cost $0.004→$0.002) and Inference's
 * Quantization numbers (INT8: real speed/cost gains, modest quality
 * risk) as its running example — but per explicit instruction, every
 * explanation here must stand on its own: a reader who never opened
 * Evaluation, GenAI Systems, or Inference should still follow this
 * Chapter completely. Concepts drawn from those modules (AI Artifact,
 * comparing two versions, what quantization means) are each explained
 * fresh, in one self-contained paragraph, not assumed as "you already
 * learned this" — earlier modules get only a light, optional "see also"
 * pointer for readers who *have* done them, never a load-bearing
 * dependency. This is a deliberately different, lighter-touch depth than
 * Evaluation Basics' or Inference's own original chapters — the goal is
 * enough self-contained context to use the skill here, not a full replay
 * of those chapters' own teaching arcs. */
export function ExperimentTrackingWalkthrough({
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

  const runRow = (label: string, r: RunStat, tone: "default" | "warn" | "good" = "default") => (
    <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base">
      <div className="text-neutral-500 font-medium mb-1">{label}</div>
      <div className="text-neutral-500 text-sm mb-1.5">{r.changed}</div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-600">Quality</span>
        <span className="text-neutral-800">{r.quality}/100</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-600">Latency</span>
        <span className={tone === "good" ? "text-emerald-700 font-medium" : "text-neutral-800"}>{r.latencyMs}ms</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-600">Cost</span>
        <span className={tone === "good" ? "text-emerald-700 font-medium" : "text-neutral-800"}>${r.cost.toFixed(4)}</span>
      </div>
    </div>
  );

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            You can save one version of a system, and compare it against another. This chapter is
            about doing that for real, over time — tracking every version you try, not just two.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>What Gets Versioned</strong> — what a saved version of an AI system actually stores.</li>
            <li><strong>Tracking Many Experiments</strong> — going from one comparison to a whole running history.</li>
            <li><strong>My RAG: Three Versions Compared</strong> — the same running example, extended to a third version.</li>
            <li><strong>Choosing a Winner</strong> — deciding what actually ships.</li>
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
          Any AI system you build has versions: you try something, save it, change something,
          save that too. Comparing just the newest two tells you if one change helped. This
          chapter is about doing that systematically, across every version you&rsquo;ve ever
          tried — not just the latest two.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">v1 vs. v2</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
            v1, v2, v3&hellip; tracked together
          </div>
        </div>
      ),
    },
    // -------------------- 1. What Gets Versioned --------------------
    {
      section: "1. What Gets Versioned",
      title: "The AI Artifact: One Saved, Versioned Snapshot",
      body: (
        <p>
          An <strong>AI Artifact</strong> is a saved, named, version-tracked snapshot of one exact
          setup. That&rsquo;s which model, which prompt, which settings, bundled together under
          one name and
          version number, like &ldquo;My RAG v1.&rdquo; Saving one lets you reload that exact
          setup later, or compare it fairly against a later change.
        </p>
      ),
      visual: <StatCard label="AI Artifact" value="one saved, version-tracked snapshot" />,
    },
    {
      section: "1. What Gets Versioned",
      title: "Six Kinds of Things Worth Versioning",
      body: (
        <p>
          Six kinds of things are worth tracking a version history for:
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard label="Prompts" value="what you ask the model" />
          <StatCard label="Models" value="which model answers" />
          <StatCard label="RAG configurations" value="which documents get retrieved, and how" />
          <StatCard label="Datasets" value="what it was built or tested on" />
          <StatCard label="Application versions" value="the app as a whole" />
          <StatCard label="Inference configurations" value="temperature, precision, max tokens" />
        </div>
      ),
    },
    {
      section: "1. What Gets Versioned",
      title: "A Version Only Counts If It's a Full Snapshot",
      body: (
        <p>
          A label like &ldquo;v2&rdquo; means nothing on its own. A real version records the full
          configuration that produced it. That&rsquo;s which model, which prompt, which dataset,
          which
          settings. That way, a later comparison is exact and fair, not a guess from memory.
        </p>
      ),
      visual: undefined,
    },
    // -------------------- 2. Tracking Many Experiments --------------------
    {
      section: "2. Tracking Many Experiments",
      title: "Comparing Two Versions of the Same System",
      body: (
        <p>
          Change something — swap the model, tweak a prompt. You don&rsquo;t actually know if
          it helped until you compare the new version against the old one, on the same questions.
          Compare
          across more than one metric: quality, latency, and cost, side by side, not just quality
          alone.
        </p>
      ),
      visual: (
        <div className="grid sm:grid-cols-2 gap-2">
          {runRow("v1", V1)}
          {runRow("v2", V2)}
        </div>
      ),
    },
    {
      section: "2. Tracking Many Experiments",
      title: "...Experiment Tracking Compares Every Version You've Tried",
      body: (
        <p>
          The real difference is scale. Instead of one single before/after check, every version
          stays in one running table. That way, you can look back at any earlier version, not
          just the
          one immediately before it.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">v1</div>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">v2</div>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">v3</div>
        </div>
      ),
    },
    {
      section: "2. Tracking Many Experiments",
      title: "What Changed, Not Just What Scored",
      body: (
        <p>
          Alongside the resulting scores, track which axis actually moved for each run.
          That&rsquo;s model,
          prompt, dataset, RAG configuration, or inference configuration. So later you know not
          just whether a run was better, but why.
        </p>
      ),
      visual: undefined,
    },
    // -------------------- 3. My RAG: Three Versions Compared --------------------
    {
      section: "3. My RAG: Three Versions Compared",
      title: "Same App, Three Real Changes",
      body: (
        <p>
          My RAG&rsquo;s three saved versions each changed a different thing. v1 → v2 changed{" "}
          <em>which model</em> answers (Model A → Model B). v2 → v3 changes{" "}
          <em>how that same model runs</em> (Model B at full precision → Model B quantized).
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">v1: Model A</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">v2: Model B</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">v3: Model B, INT8</div>
        </div>
      ),
    },
    {
      section: "3. My RAG: Three Versions Compared",
      title: "The Full Comparison Table",
      body: <p>All three versions, the same three metrics, one table.</p>,
      visual: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-1 pr-3 font-medium"></th>
                <th className="py-1 px-3 font-medium">v1</th>
                <th className="py-1 px-3 font-medium">v2</th>
                <th className="py-1 px-3 font-medium">v3</th>
              </tr>
            </thead>
            <tbody className="text-neutral-800">
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">What changed</td>
                <td className="py-1.5 px-3">{V1.changed}</td>
                <td className="py-1.5 px-3">{V2.changed}</td>
                <td className="py-1.5 px-3">{V3.changed}</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Quality</td>
                <td className="py-1.5 px-3 font-mono">{V1.quality}/100</td>
                <td className="py-1.5 px-3 font-mono">{V2.quality}/100</td>
                <td className="py-1.5 px-3 font-mono">{V3.quality}/100</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Latency</td>
                <td className="py-1.5 px-3 font-mono">{V1.latencyMs}ms</td>
                <td className="py-1.5 px-3 font-mono">{V2.latencyMs}ms</td>
                <td className="py-1.5 px-3 font-mono">{V3.latencyMs}ms</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-500">Cost</td>
                <td className="py-1.5 px-3 font-mono">${V1.cost.toFixed(4)}</td>
                <td className="py-1.5 px-3 font-mono">${V2.cost.toFixed(4)}</td>
                <td className="py-1.5 px-3 font-mono">${V3.cost.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      section: "3. My RAG: Three Versions Compared",
      title: "v1 → v2: A Different Model, a Real Trade-off",
      body: (
        <p>
          Model B fixes real mistakes Model A made. But on other questions it does a little
          worse. So the <em>average</em> quality score across a full test set actually comes out
          lower than Model A&rsquo;s. That&rsquo;s true even though the switch fixed genuine
          problems. At the same
          time, Model B is faster and cheaper to run. What changed was the model itself.
        </p>
      ),
      visual: runRow("v2 vs. v1", V2),
    },
    {
      section: "3. My RAG: Three Versions Compared",
      title: "v2 → v3: Same Model, Lower Precision",
      body: (
        <p>
          <strong>Quantizing</strong> a model means storing its internal numbers with fewer bits.
          That&rsquo;s
          8 bits per number (&ldquo;INT8&rdquo;) instead of the usual 16. That shrinks the model
          and makes it run faster, at some cost to output quality. INT8 specifically is a fairly
          safe trade: real speed and cost gains, only a small quality dip. Applying that here: v3
          keeps every one of Model B&rsquo;s choices exactly, but runs it at INT8. Latency and
          cost roughly halve again, and quality dips a little further.
        </p>
      ),
      visual: runRow("v3 vs. v2", V3, "good"),
    },
    {
      section: "3. My RAG: Three Versions Compared",
      title: "Three Versions, Three Different Trade-offs",
      body: (
        <p>
          No version wins on every axis. v1 is the slow, expensive, most accurate baseline. v2
          trades some quality for a different, better model. v3 trades a little more quality for
          real speed and cost, on top of v2&rsquo;s own choice. Each version optimizes a different
          combination — the point is not that one is universally &ldquo;best.&rdquo;
        </p>
      ),
      visual: undefined,
    },
    // -------------------- 4. Choosing a Winner --------------------
    {
      section: "4. Choosing a Winner",
      title: "No Single Metric Decides Alone",
      body: (
        <p>
          Read quality, latency, and cost together, not one at a time. Picking by cost alone
          would choose the cheapest version even if its quality is too low to trust. Picking by
          quality alone would ignore a version that is nearly as good for a fraction of the cost.
          The same rule applies whether there are two versions on the table or three.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "4. Choosing a Winner",
      title: "Setting a Minimum Bar, Across Three",
      body: (
        <p>
          A minimum quality bar still does the same filtering job it did with two versions. At a
          bar of 80, v3 just clears it. A bar of 82 would rule v3 out, and leave the choice
          between
          v1 and v2 only.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-base flex-wrap">
          <span className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">Minimum bar: 80/100</span>
          <span className="text-neutral-300">→</span>
          <span className="px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">v1, v2, v3 all clear it</span>
        </div>
      ),
    },
    {
      section: "4. Choosing a Winner",
      title: "Promoting a Version",
      body: (
        <p>
          Once a version is chosen — say v3, for a product where speed and cost matter more than
          quality — that choice becomes the candidate that moves into the next
          stage: tested, gated, and deployed.
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
            <li>Six kinds of things are worth a version history: prompts, models, RAG configurations, datasets, application versions, and inference configurations.</li>
            <li>A version only counts if it records a full configuration snapshot, not just a name.</li>
            <li>Experiment tracking scales a single before/after comparison into a running table of every version you&rsquo;ve tried.</li>
            <li>Tracking what changed — not just the resulting scores — is what turns &ldquo;this run was better&rdquo; into &ldquo;this run was better because of X.&rdquo;</li>
            <li>No single metric decides alone, whether comparing two versions or several. A minimum bar filters candidates, then the remaining trade-off is a real decision.</li>
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
            A version has been chosen. CI/CD &amp; Deployment — testing it, gating it against a
            threshold, and promoting it through Development, Staging, and Production — is next.
          </p>
          <Link
            href="/llmops/ci-cd"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to CI/CD &amp; Deployment →
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
              href="/llmops"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to LLMOps
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
