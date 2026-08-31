"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";

interface ModelStat {
  id: string;
  label: string;
  answer: string;
  correct: boolean;
  quality: number;
  latencyMs: number;
  cost: number;
}

const MODELS: ModelStat[] = [
  { id: "A", label: "Model A", answer: "“Yes, as long as it's within 30 days, you'll get a full refund.”", correct: false, quality: 34, latencyMs: 200, cost: 0.001 },
  { id: "B", label: "Model B", answer: "“No — worn items only get a partial refund or store credit, not a full refund.”", correct: true, quality: 89, latencyMs: 500, cost: 0.0025 },
  { id: "C", label: "Model C", answer: "“No — since it's been worn, you'll only receive a partial refund or store credit, at our discretion, rather than a full refund.”", correct: true, quality: 95, latencyMs: 1400, cost: 0.004 },
];

type Priority = "quality" | "speed" | "cost";

function bestFor(priority: Priority): string {
  if (priority === "quality") return MODELS.reduce((a, b) => (b.quality > a.quality ? b : a)).id;
  if (priority === "speed") return MODELS.reduce((a, b) => (b.latencyMs < a.latencyMs ? b : a)).id;
  return MODELS.reduce((a, b) => (b.cost < a.cost ? b : a)).id;
}

/** Module 3 (Evaluation), Unit "Judging & Comparing", Chapter 2 of 3.
 * Continues the story: Chapter 1 built a judge that reliably catches the
 * worn-item refund bug (and its 70%-refund cousin). This Chapter asks
 * which model avoids making it in the first place, running the exact same
 * question through three candidate models — general 2026
 * evaluation-engineering content, not a tour of this app's implementation.
 *
 * Model A/B/C's latency/cost figures are the same as before this rewrite
 * (kept unchanged: 200ms/$0.001, 500ms/$0.0025, 1400ms/$0.004) and match
 * ModelComparisonLab's free-play defaults. Ends pointing at Chapter 3: the
 * team picks a candidate and releases it as v2 — did it help? */
export function ModelComparisonWalkthrough({
  onComplete,
  initialStep,
  onAdvanceToNextChapter,
  onBackToPreviousChapter,
}: {
  onComplete?: () => void;
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
  onBackToPreviousChapter?: () => void;
}) {
  const [priority, setPriority] = useState<Priority>("quality");
  const resetPriority = () => setPriority("quality");
  const winner = bestFor(priority);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white";

  interface Step {
    section: string;
    title: string;
    story?: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const statTable = (highlight?: string) => (
    <div className="bg-white border border-neutral-200 rounded-md overflow-hidden max-w-md mx-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-neutral-500 bg-neutral-50">
            <th className="px-2.5 py-1.5 font-medium">Model</th>
            <th className="px-2.5 py-1.5 font-medium">Quality</th>
            <th className="px-2.5 py-1.5 font-medium">Latency</th>
            <th className="px-2.5 py-1.5 font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {MODELS.map((m) => (
            <tr key={m.id} className={`border-t border-neutral-100 ${m.id === highlight ? "bg-cyan-50" : ""}`}>
              <td className="px-2.5 py-1.5 font-medium text-neutral-800">{m.label}</td>
              <td className="px-2.5 py-1.5 text-neutral-700">{m.quality}/100</td>
              <td className="px-2.5 py-1.5 text-neutral-700">{m.latencyMs}ms</td>
              <td className="px-2.5 py-1.5 text-neutral-700">${m.cost.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const steps: Step[] = [
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>Chapter 1 built a judge that catches the bug. This chapter finds a model that avoids it:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Comparing Systems</strong> — quality, latency, and cost, on the exact bug case and its sneaky cousin.</li>
            <li><strong>Consistency</strong> — does the winner give the same right answer every time?</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: Which Model Gets It Right?",
      story:
        'Priya: "Three candidate models, same dataset. Let\'s see who actually avoids the bug."\nMaya: "And who repeats it."',
      body: (
        <p>
          The team runs the worn-item refund question through three candidate models for
          Southwear&rsquo;s AI support assistant. One repeats the exact bug that started this
          module. Model comparison is what makes that visible before any of them go live.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          {statTable()}
        </div>
      ),
    },
    // -------------------- 1. Comparing Systems --------------------
    {
      section: "1. Comparing Systems",
      title: "Same Question, Different Systems",
      body: (
        <p>
          Model comparison runs the exact same dataset through more than one system — different
          models, prompts, or configurations — so every difference in the results comes from the
          system, not from the questions being different.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
          {MODELS.map((m) => (
            <span key={m.id} className="px-2.5 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">
              {m.label}
            </span>
          ))}
        </div>
      ),
    },
    {
      section: "1. Comparing Systems",
      title: "One System Still Gets It Wrong",
      body: (
        <p>
          All three answer the same worn-item question — but Model A repeats the exact bug that
          went live, while B and C both get it right, worded differently. Correctness isn&rsquo;t
          a given just because a model runs.
        </p>
      ),
      visual: (
        <div className="grid sm:grid-cols-3 gap-2 text-sm">
          {MODELS.map((m) => (
            <div key={m.id} className="bg-white border border-neutral-200 rounded-md p-2.5">
              <div className="text-neutral-500 font-medium">{m.label}</div>
              <div className={`mt-0.5 ${m.correct ? "text-neutral-800" : "text-red-700"}`}>{m.answer}</div>
              <div className={`mt-1 text-xs ${m.correct ? "text-emerald-700" : "text-red-700"}`}>
                {m.correct ? "✓ faithful" : "✗ repeats the bug"}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      section: "1. Comparing Systems",
      title: "The Wrong Model Fails in More Than One Way",
      story:
        'Maya: "Wait, Model A said something different last time I checked."\nPriya: "It did — same underlying failure, different disguise."',
      body: (
        <p>
          Model A doesn&rsquo;t always fail the same way. On one run it repeats the blunt
          &ldquo;full refund&rdquo; bug; on another, it invents the same sneaky &ldquo;70%
          refund&rdquo; cousin from Chapter 1. Both fail faithfulness, worded differently — a
          reminder to test more than one wrong answer, not just one.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1.5">
          <div>
            <div className="text-neutral-500 font-medium">Model A, run 1</div>
            <div className="text-red-700">&ldquo;Yes, you&rsquo;ll get a full refund.&rdquo;</div>
          </div>
          <div className="border-t border-neutral-100 pt-1.5">
            <div className="text-neutral-500 font-medium">Model A, run 2</div>
            <div className="text-red-700">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo;</div>
          </div>
          <div className="text-neutral-400 pt-1 border-t border-neutral-100">Both fail faithfulness — neither matches the actual policy.</div>
        </div>
      ),
    },
    {
      section: "1. Comparing Systems",
      title: "The Wrong Model Is Also the Fastest, Cheapest One",
      body: (
        <p>
          Model A wins on speed and price — 200ms, $0.001 — but it&rsquo;s also the one that&rsquo;s
          wrong. Speed and cost don&rsquo;t help if the answer fails faithfulness; correctness is
          the bar a candidate has to clear first.
        </p>
      ),
      visual: statTable(),
    },
    // -------------------- 2. Consistency --------------------
    {
      section: "2. Consistency",
      title: "Does It Give the Same Right Answer Twice?",
      body: (
        <p>
          Ask Model B the same question three times, and it may phrase the correct answer three
          different ways — all faithful, but not identical wording. A more deterministic setting
          repeats the exact same wording every time instead.
        </p>
      ),
      visual: (
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 space-y-1">
            <div className="text-neutral-500 font-medium">Less deterministic — 3 runs</div>
            <div className="text-neutral-700">&ldquo;No — worn items only get a partial refund or store credit.&rdquo;</div>
            <div className="text-neutral-700">&ldquo;Since it&rsquo;s worn, you&rsquo;d get store credit or a partial refund instead.&rdquo;</div>
            <div className="text-neutral-700">&ldquo;Worn items aren&rsquo;t eligible for a full refund — partial refund or store credit only.&rdquo;</div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 space-y-1">
            <div className="text-neutral-500 font-medium">More deterministic — 3 runs</div>
            <div className="text-neutral-700">&ldquo;No — worn items only get a partial refund or store credit.&rdquo;</div>
            <div className="text-neutral-700">&ldquo;No — worn items only get a partial refund or store credit.&rdquo;</div>
            <div className="text-neutral-700">&ldquo;No — worn items only get a partial refund or store credit.&rdquo;</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Consistency",
      title: "Picking a Candidate to Release",
      story:
        'Priya: "A is disqualified — it\'s just wrong, however you slice it."\nMaya: "Between B and C, then?"\nPriya: "C is most thorough but slowest and priciest. B is faithful, clear, and cheaper. Let\'s go with B."',
      body: (
        <p>
          A is disqualified on correctness alone. Between B and C, the choice is a real
          trade-off: C is most thorough but slowest and priciest; B is faithful, clear, and
          cheaper. The team picks B to release as v2.
        </p>
      ),
      visual: statTable("B"),
    },
    // -------------------- 3. Try It Yourself --------------------
    {
      section: "3. Try It Yourself",
      title: "Try it yourself: what wins depends on priority",
      body: (
        <p>
          Pick what matters most, computed from the numbers above. Notice: prioritizing speed or
          cost alone would pick Model A — the one that&rsquo;s wrong.
        </p>
      ),
      controls: (
        <div className="flex gap-2 flex-wrap">
          {(["quality", "speed", "cost"] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                priority === p ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              Prioritize {p}
            </button>
          ))}
        </div>
      ),
      resetAction: resetPriority,
      visual: (
        <div className="space-y-2">
          {statTable(winner)}
          <div className="text-center text-sm text-neutral-600">
            Winner for <strong>{priority}</strong>: <span className="text-cyan-700 font-medium">Model {winner}</span>
            {winner === "A" && <span className="text-red-700"> — wrong answer, despite winning this axis.</span>}
          </div>
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
            <li>Model comparison runs the same dataset through several systems, so results reflect the system, not the questions.</li>
            <li>The fastest, cheapest model can also be the wrong one — correctness is a floor to clear first.</li>
            <li>The same wrong model can fail in more than one worded way — worth testing more than one bad answer.</li>
            <li>A correct model can still phrase the same answer differently each run.</li>
            <li>The team picked Model B: faithful, clear, and a reasonable cost/latency trade-off against C.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Wrap-up",
      title: "Next: Release It and Check",
      story:
        'Maya: "So we release Model B as v2. Does it actually help?"\nPriya: "That\'s exactly what we check next."',
      body: (
        <p>
          Everything above is also unlocked below — compare models by your own priority. Model B
          releases as v2. The next chapter checks whether it actually helped.
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
      onAdvanceToNextChapter?.();
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
        <span className="text-xs uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst && !onBackToPreviousChapter}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-sm text-neutral-700"
          >
            Back
          </button>
          <button onClick={goNext} className={nextBtn}>
            {isLast ? (onAdvanceToNextChapter ? "Continue: Regression Testing →" : "Finish") : "Next"}
          </button>
        </div>
        <span className="text-xs text-neutral-500 sm:flex-1 sm:text-right">
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

        <h3 className="text-lg font-medium text-neutral-900">{current.title}</h3>
        <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
          </div>
        )}
        {current.resetAction && (
          <button onClick={current.resetAction} className="text-xs text-neutral-500 hover:text-neutral-800">
            ↺ Undo / reset this step
          </button>
        )}

        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
