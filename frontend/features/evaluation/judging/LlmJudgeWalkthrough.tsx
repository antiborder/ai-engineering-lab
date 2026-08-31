"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { Term } from "@/components/Term";

const REFERENCE = "Items that are worn or missing tags may only receive a partial refund or store credit, at Southwear's discretion.";

function judge(answer: string): { pass: boolean; explanation: string } {
  const a = answer.toLowerCase();
  if (a.includes("70%") || a.includes("70 percent")) {
    return {
      pass: false,
      explanation: "Contradicts the reference — it names no fixed percentage. 70% is invented, not policy.",
    };
  }
  if (a.includes("full refund") && !a.includes("partial")) {
    return {
      pass: false,
      explanation: "Contradicts the reference: worn items only get a partial refund or store credit, never a full refund.",
    };
  }
  if (a.includes("partial") || a.includes("store credit")) {
    return { pass: true, explanation: "Matches the reference: worn items get a partial refund or store credit, not a full refund." };
  }
  return { pass: false, explanation: "Doesn't state the partial-refund-or-store-credit outcome the reference gives." };
}

/** Module 3 (Evaluation), Unit "Judging & Comparing", Chapter 1 of 3.
 * Continues the story from Evaluation Basics: Chapters 1-3 found two bad
 * answers — the AI support assistant's "full refund" bug that went live,
 * and its sneaky "70% refund" cousin — that only faithfulness reliably
 * catches. This Chapter builds the tool that computes faithfulness well —
 * an LLM judge — as a general 2026 evaluation-engineering concept, not a
 * tour of this app's implementation. Ends pointing at Chapter 2: now that
 * the bug is reliably catchable, which model actually avoids making it? */
export function LlmJudgeWalkthrough({
  onComplete,
  initialStep,
  onAdvanceToNextChapter,
}: {
  onComplete?: () => void;
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
}) {
  const [answer, setAnswer] = useState("Yes, as long as it's within 30 days, you'll get a full refund.");
  const resetAnswer = () => setAnswer("Yes, as long as it's within 30 days, you'll get a full refund.");
  const verdict = judge(answer);

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

  const steps: Step[] = [
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>Chapters 1-3 found two bad answers only faithfulness catches. This chapter builds the judge:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Judge Loop</strong> — what goes in, and what actually comes out.</li>
            <li><strong>Judge Bias</strong> — confidence, order, and consistency problems.</li>
            <li><strong>When to Still Use a Human</strong> — the judge&rsquo;s own limits.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: Computing Faithfulness for Real",
      story:
        'Priya: "Faithfulness is the metric that catches this. But scoring it well takes real judgment, not a formula."\nMaya: "So who does the judging?"\nPriya: "Another model — an LLM judge."',
      body: (
        <p>
          Faithfulness needs judgment, not string matching — checking whether an answer really
          agrees with a reference isn&rsquo;t a fixed formula. An{" "}
          <Term id="llm-judge">LLM judge</Term> reads a question, an answer, and a reference,
          then returns a score and an explanation, doing that judgment for every test case.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs flex-wrap">
            <span className="px-2.5 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">Question</span>
            <span className="px-2.5 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">Answer</span>
            <span className="px-2.5 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">Reference</span>
            <span className="text-neutral-300">→</span>
            <span className="px-3 py-1.5 rounded-full border-2 border-cyan-500 bg-cyan-50 text-cyan-800 font-medium">Judge</span>
            <span className="text-neutral-300">→</span>
            <span className="px-2.5 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">Score</span>
            <span className="px-2.5 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700">Explanation</span>
          </div>
        </div>
      ),
    },
    // -------------------- 1. The Judge Loop --------------------
    {
      section: "1. The Judge Loop",
      title: "Question, Answer, Reference In — Score and Explanation Out",
      story:
        'Maya: "Run the original bug through it. Does the judge actually catch it?"\nPriya: "Watch."',
      body: (
        <p>
          The judge is itself a model call: given the same three fields as any evaluation —
          question, answer, reference — it returns a score plus a plain-language reason, not a
          bare number. Here it is on the original bug.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1">
          <div className="text-neutral-500">Q: &ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
          <div className="text-neutral-800">Answer: &ldquo;Yes, as long as it&rsquo;s within 30 days, you&rsquo;ll get a full refund.&rdquo;</div>
          <div className="text-purple-700">Reference: &ldquo;{REFERENCE}&rdquo;</div>
          <div className="border-t border-neutral-100 pt-1 mt-1">
            <div className="text-red-700">Score: 0/100</div>
            <div className="text-neutral-600">Explanation: contradicts the reference — worn items only get a partial refund or store credit, never a full refund.</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. The Judge Loop",
      title: "A Score Alone Isn't Enough",
      body: (
        <p>
          The explanation is what makes a score usable: it says why an answer failed, so someone
          can check the judge&rsquo;s reasoning and group failures by cause instead of just
          counting them.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="px-3 py-1.5 rounded-full border border-red-300 bg-red-50 text-red-700">Score: 0/100</span>
          <span className="text-neutral-300">alone →</span>
          <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-500">&ldquo;...but why?&rdquo;</span>
        </div>
      ),
    },
    // -------------------- 2. Judge Bias --------------------
    {
      section: "2. Judge Bias",
      title: "The Sneaky Cousin Is the Harder Test",
      story:
        'Priya: "Now the harder one — the AI assistant\'s 70%-refund answer. Same judge."\nMaya: "That one sounds more convincing than the first."\nPriya: "Exactly why it\'s the harder test."',
      body: (
        <p>
          Confidence can matter more than correctness. The blunt &ldquo;full refund&rdquo; is
          easy to flag; the &ldquo;70% refund&rdquo; cousin is fluent and sounds precise, so a
          weaker judge can be tempted to pass it anyway — even though the reference names no
          fixed percentage at all.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1.5">
          <div>
            <div className="text-neutral-800">&ldquo;Yes, you&rsquo;ll get a full refund.&rdquo;</div>
            <div className="text-amber-700">Bluntly wrong — easy to catch.</div>
          </div>
          <div className="border-t border-neutral-100 pt-1.5">
            <div className="text-neutral-800">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo;</div>
            <div className="text-amber-700">Fluent, sounds precise — a good judge still fails it.</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judge Bias",
      title: "Position Bias: Order Can Flip the Verdict",
      body: (
        <p>
          When a judge compares two answers, which one is shown first can shift the verdict, even
          with identical content in each slot. Real setups run both orders and average, to cancel
          this out.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">A first, B second</span>
            <span className="text-cyan-700 font-medium">&ldquo;A wins&rdquo;</span>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 pt-1.5">
            <span className="text-neutral-600">Same A &amp; B, B first</span>
            <span className="text-purple-700 font-medium">&ldquo;B wins&rdquo;</span>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judge Bias",
      title: "The Same Case, Judged Twice",
      body: (
        <p>
          Ask the same judge to score the same case twice, and the two scores can differ — judges
          are models too, and models don&rsquo;t always answer identically on repeat. Averaging
          several judgments smooths this out.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Run 1</span>
            <span className="text-neutral-800">62/100 — &ldquo;partially supported&rdquo;</span>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-100 pt-1.5">
            <span className="text-neutral-600">Run 2, same case</span>
            <span className="text-neutral-800">71/100 — &ldquo;mostly supported&rdquo;</span>
          </div>
        </div>
      ),
    },
    // -------------------- 3. When to Still Use a Human --------------------
    {
      section: "3. When to Still Use a Human",
      title: "The Judge's Own Limits",
      body: (
        <p>
          Reach for a human rater when the stakes are high, the judgment is genuinely subjective,
          or you&rsquo;re calibrating the judge itself — checking its scores against a small set
          of human-labeled cases before trusting it at scale.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="bg-white border border-cyan-300 rounded-md p-2.5 text-center max-w-40">
            <div className="font-medium text-cyan-700 mb-0.5">LLM judge</div>
            <div className="text-neutral-600">high volume, low stakes, fast feedback</div>
          </div>
          <div className="bg-white border border-purple-300 rounded-md p-2.5 text-center max-w-40">
            <div className="font-medium text-purple-700 mb-0.5">Human rater</div>
            <div className="text-neutral-600">high stakes, subjective calls, calibration</div>
          </div>
        </div>
      ),
    },
    // -------------------- 4. Try It Yourself --------------------
    {
      section: "4. Try It Yourself",
      title: "Try it yourself: judge a candidate answer",
      body: (
        <p>
          Edit the candidate answer below — try the original bug, the 70%-refund cousin, or the
          correct answer — and watch a simple rule-based judge score it against the reference.
        </p>
      ),
      controls: (
        <div className="w-full space-y-2">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm">
            <div className="text-neutral-500">Reference</div>
            <div className="text-neutral-800">{REFERENCE}</div>
          </div>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Candidate answer"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
          />
        </div>
      ),
      resetAction: resetAnswer,
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500">Verdict</span>
            <span className={verdict.pass ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>
              {verdict.pass ? "✓ pass" : "✗ fail"}
            </span>
          </div>
          <div className="text-neutral-600">{verdict.explanation}</div>
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
            <li>An LLM judge takes a question, answer, and reference, and returns a score plus an explanation.</li>
            <li>The explanation matters as much as the score — it says why, not just how much.</li>
            <li>A fluent, close-to-right wrong answer is a harder test for a judge than a bluntly wrong one.</li>
            <li>Judges can shift verdicts based on order, and disagree with themselves on repeat.</li>
            <li>Use a human rater for high-stakes or subjective cases, and to calibrate the judge itself.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "5. Wrap-up",
      title: "Next: Which Model Avoids the Bug?",
      story:
        'Priya: "We can now reliably catch this bug, wherever it shows up."\nMaya: "So which model actually avoids making it in the first place?"\nPriya: "Let\'s find out."',
      body: (
        <p>
          Everything above is also unlocked below if you want to judge your own candidate
          answers. The judge can now reliably catch this bug wherever it shows up. The next
          question: does switching models avoid making it in the first place?
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
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-xs uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          {isFirst ? (
            <a
              href="/evaluation/basics"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-700"
            >
              ← Back to Evaluation Basics
            </a>
          ) : (
            <button
              onClick={goBack}
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-700"
            >
              Back
            </button>
          )}
          <button onClick={goNext} className={nextBtn}>
            {isLast ? (onAdvanceToNextChapter ? "Continue: Model Comparison →" : "Finish") : "Next"}
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
