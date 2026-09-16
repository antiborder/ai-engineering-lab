"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";

interface VersionStat {
  quality: number;
  latencyMs: number;
  cost: number;
}

const V1: VersionStat = { quality: 88, latencyMs: 900, cost: 0.004 };
const V2: VersionStat = { quality: 84, latencyMs: 650, cost: 0.002 };

/** Module 3 (Evaluation), Unit "Judging & Comparing", Chapter 3 of 3 —
 * the story's close. Chapter 2 picked Model B to release as v2. This
 * Chapter checks the outcome: v2 fixes the worn-item refund bug (and its
 * 70%-refund cousin), but a new, unrelated regression shows up elsewhere —
 * a terser refund-timing answer that drops a detail — netting an overall
 * score drop despite the fix. General 2026 evaluation-engineering content,
 * not a tour of this app's implementation.
 *
 * The v1→v2 numbers (quality 88→84, latency 900ms→650ms, cost
 * $0.004→$0.002) are a deliberate callback to this app's own original
 * product spec (docs/spec.txt section 18.8). Ends with an explicit
 * callback to the Evaluation Basics Chapter 1 incident that opened the
 * whole module. */
export function RegressionTestingWalkthrough({
  onComplete,
  initialStep,
  onBackToPreviousChapter,
}: {
  onComplete?: () => void;
  initialStep?: number;
  onBackToPreviousChapter?: () => void;
}) {
  const [showV2, setShowV2] = useState(false);
  const resetToggle = () => setShowV2(false);
  const shownVersion = showV2 ? V2 : V1;

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    story?: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const versionRow = (label: string, v: VersionStat, tone: "neutral" | "down" | "up") => (
    <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base">
      <div className="text-neutral-500 font-medium mb-1">{label}</div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-600">Quality</span>
        <span className={tone === "down" ? "text-red-700 font-medium" : "text-neutral-800"}>{v.quality}/100</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-600">Latency</span>
        <span className={tone === "up" ? "text-emerald-700 font-medium" : "text-neutral-800"}>{v.latencyMs}ms</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-neutral-600">Cost</span>
        <span className={tone === "up" ? "text-emerald-700 font-medium" : "text-neutral-800"}>${v.cost.toFixed(4)}</span>
      </div>
    </div>
  );

  const steps: Step[] = [
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>Chapter 2 released Model B as v2. This chapter checks what actually changed:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Reading a Regression</strong> — what the numbers actually say, and don&rsquo;t.</li>
            <li><strong>Trade-offs and Decisions</strong> — when a regression is still worth releasing.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: Did v2 Actually Help?",
      story:
        'Chloe: "So v2 is live. Did it actually help?"\nMaya: "Let\'s compare v1 and v2, side by side, on the whole dataset."',
      body: (
        <p>
          Regression testing compares v1&rsquo;s scores
          against v2&rsquo;s, side by side. v2 fixes the worn-item refund bug — but the overall
          quality score still went down. The next Steps explain why.
        </p>
      ),
      visual: (
        <div className="grid sm:grid-cols-2 gap-2">
          {versionRow("v1", V1, "neutral")}
          {versionRow("v2", V2, "neutral")}
        </div>
      ),
    },
    // -------------------- 1. Reading a Regression --------------------
    {
      section: "1. Reading a Regression",
      title: "Comparing v1 to v2 of the Same System",
      body: (
        <p>
          Regression testing re-runs the same dataset and metrics against a new version of one
          system, and compares the two score sets side by side — so a change that helps one thing
          while quietly breaking another gets caught before it goes live.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">v1</span>
          <span className="text-neutral-300">vs.</span>
          <span className="px-3 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800">v2</span>
        </div>
      ),
    },
    {
      section: "1. Reading a Regression",
      title: "The Bug Is Fixed",
      story:
        'Maya: "Good news first — run the original bug and its 70% cousin through v2."\nChloe: "Both come back right."',
      body: (
        <p>
          On the exact question that started this module, v2 is the fix: v1 said &ldquo;yes, full
          refund&rdquo;; v2 correctly says partial refund or store credit. The same holds for the
          70%-refund cousin — v2 gets both right.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-500">Q: &ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
          <div className="text-red-700">v1: &ldquo;Yes, you&rsquo;ll get a full refund.&rdquo; — the original bug</div>
          <div className="text-emerald-700">v2: &ldquo;No — worn items only get a partial refund or store credit.&rdquo; — fixed</div>
        </div>
      ),
    },
    {
      section: "1. Reading a Regression",
      title: "But Quality Still Went Down",
      body: (
        <p>
          v2 scores 84 overall, down from v1&rsquo;s 88 — even though it fixed the headline bug.
          Fixing one case doesn&rsquo;t guarantee nothing else moved; the next Step finds what did.
        </p>
      ),
      visual: versionRow("v2 vs. v1", V2, "down"),
    },
    // -------------------- 2. Trade-offs and Decisions --------------------
    {
      section: "2. Trade-offs and Decisions",
      title: "A New Regression, Somewhere Else",
      story:
        'Chloe: "So what dropped, if not the refund question?"\nMaya: "A completely different one — refund timing. v2 got terser and lost a detail."',
      body: (
        <p>
          On a refund-timing question, v2&rsquo;s faster, terser style drops a detail v1
          included — a small faithfulness loss on a different case, unrelated to the worn-item
          fix, that pulled the overall average down.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-500">Q: &ldquo;How long does a refund take once you get my item back?&rdquo;</div>
          <div className="text-emerald-700">v1: &ldquo;Refunds are issued to your original payment method within 5–7 business days after we receive and inspect the returned item.&rdquo;</div>
          <div className="text-amber-700">v2: &ldquo;Refunds take 5–7 business days.&rdquo; — correct, but drops &ldquo;original payment method&rdquo; and &ldquo;after we receive and inspect&rdquo;</div>
        </div>
      ),
    },
    {
      section: "2. Trade-offs and Decisions",
      title: "Faster and Cheaper Too",
      body: (
        <p>
          v2 also runs faster — 650ms instead of 900ms — and cheaper, $0.002 instead of $0.004.
          Read alone, that&rsquo;s a clean win; read next to the quality drop, it&rsquo;s a
          trade-off the team has to weigh.
        </p>
      ),
      visual: versionRow("v2 vs. v1", V2, "up"),
    },
    {
      section: "2. Trade-offs and Decisions",
      title: "Setting a Minimum Bar",
      body: (
        <p>
          A regression isn&rsquo;t automatically disqualifying — it depends on whether the new
          score still clears the minimum bar the system needs to meet, and whether the trade-off
          is one the team actually wants.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-base">
          <span className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">Minimum bar: 80/100</span>
          <span className="text-neutral-300">→</span>
          <span className="px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">v2&rsquo;s 84 still clears it</span>
        </div>
      ),
    },
    // -------------------- 3. Try It Yourself --------------------
    {
      section: "3. Try It Yourself",
      title: "Try it yourself: toggle v1 and v2",
      body: (
        <p>
          Toggle between v1 and v2 below and watch all three metrics update together, exactly as
          they would in a real regression report.
        </p>
      ),
      controls: (
        <div className="flex gap-2">
          <button
            onClick={() => setShowV2(false)}
            className={`px-3 py-1.5 rounded-md text-base border ${!showV2 ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"}`}
          >
            v1
          </button>
          <button
            onClick={() => setShowV2(true)}
            className={`px-3 py-1.5 rounded-md text-base border ${showV2 ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"}`}
          >
            v2
          </button>
        </div>
      ),
      resetAction: resetToggle,
      visual: versionRow(showV2 ? "v2" : "v1", shownVersion, "neutral"),
    },
    // -------------------- 4. Wrap-up --------------------
    {
      section: "4. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Regression testing compares a system&rsquo;s new version against its old one, on the same dataset and metrics.</li>
            <li>Fixing one bug doesn&rsquo;t guarantee nothing else moved — read every metric together, not alone.</li>
            <li>A regression isn&rsquo;t automatically disqualifying if the new score still clears the minimum bar.</li>
            <li>Optimization is a trade-off, not a pure win — someone has to decide if it&rsquo;s worth it.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Wrap-up",
      title: "Closing the Loop",
      story:
        'Chloe: "So we went from a customer getting a wrong answer, to catching that, to catching the next thing that broke too."\nMaya: "That\'s the whole point. It doesn\'t stop here — it just keeps running."\nSouthwear\'s AI support assistant is more trustworthy today than it was at the start of this module. Not because the work is finished, but because evaluation itself never stops running.',
      body: (
        <div className="space-y-2">
          <p>
            This module started with one wrong answer nobody caught before it went live. Six
            chapters later, that exact bug is fixed, verified, and live — and evaluation just
            caught the next regression too. It isn&rsquo;t a one-time fix; it&rsquo;s the ongoing
            process that keeps catching what changes next.
          </p>
          <p>Everything above is also unlocked below — toggle between versions yourself.</p>
          <Link
            href="/evaluation/rag"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to RAG Evaluation →
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
  const goBack = () => {
    if (isFirst && onBackToPreviousChapter) {
      onBackToPreviousChapter();
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-sm uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst && !onBackToPreviousChapter}
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
        {current.story && (
          <div className="pb-3 border-b border-neutral-200">
            <StoryLine text={current.story} />
          </div>
        )}

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
