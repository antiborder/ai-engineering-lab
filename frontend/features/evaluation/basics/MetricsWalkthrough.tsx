"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { Term } from "@/components/Term";

const REFERENCE = "Worn or tag-removed items only get a partial refund or store credit, not a full refund.";
const DEFAULT_A = "Yes, as long as it's within 30 days, you'll get a full refund.";
const DEFAULT_B = "Worn items get a 70% refund, not a full refund.";

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  return shared / Math.max(wordsA.size, wordsB.size);
}

/** Module 3 (Evaluation), Unit "Evaluation Basics", Chapter 3 of 3. This
 * is the reveal Chapter 2 set up: exact match flagged the bug that went
 * live, but only because it happened to be worded very differently — it
 * isn't a targeted signal. This Chapter shows a sneakier version of the
 * same bug (a fabricated "70% refund" figure, worded close to the real
 * answer) that a naive similarity check would miss, and faithfulness
 * catches. Ends bridging into Unit "Judging & Comparing" (computing
 * faithfulness well needs real judgment, i.e. an LLM judge). */
export function MetricsWalkthrough({
  onComplete,
  initialStep,
  onBackToPreviousChapter,
}: {
  onComplete?: () => void;
  initialStep?: number;
  onBackToPreviousChapter?: () => void;
}) {
  const [answerA, setAnswerA] = useState(DEFAULT_A);
  const [answerB, setAnswerB] = useState(DEFAULT_B);
  const resetAnswers = () => {
    setAnswerA(DEFAULT_A);
    setAnswerB(DEFAULT_B);
  };

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

  const scoreRow = (label: string, answer: string) => {
    const exact = answer.trim().toLowerCase() === REFERENCE.trim().toLowerCase();
    const overlap = wordOverlap(answer, REFERENCE);
    return (
      <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm space-y-1">
        <div className="text-neutral-500 font-medium">{label}</div>
        <div className="text-neutral-800">{answer}</div>
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          <span className="text-neutral-500">Exact match</span>
          <span className={exact ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>{exact ? "✓ true" : "✗ false"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Word overlap</span>
          <span className="text-cyan-700 font-medium">{Math.round(overlap * 100)}%</span>
        </div>
      </div>
    );
  };

  const steps: Step[] = [
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>Chapter 2 ran the bug through the pipeline. This chapter finds the metric that catches it:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Matching Metrics</strong> — exact match and semantic similarity, and where each is blind.</li>
            <li><strong>Judging Correctness</strong> — the metric that finally catches this bug reliably.</li>
            <li><strong>Measuring the Pipeline</strong> — retrieval quality and cost, not just the final answer.</li>
            <li><strong>Choosing a Metric</strong> — matching the metric to the task.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: Not Every Metric Would Have Caught This",
      story:
        'Priya: "So here\'s the sneaky version — same bug, wrong answer, but worded a lot more like the real one."\nMaya: "Let\'s see if exact match still catches it."',
      body: (
        <p>
          Exact match flagged the bug that went live — but only because it happened to be worded
          very differently from the right answer. A sneakier version of the same bug, worded
          closer to correct, would slip past a naive check. This chapter finds the metric that
          wouldn&rsquo;t miss it.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-xs flex-wrap">
          {["Exact match", "Semantic similarity", "Correctness", "Faithfulness", "Retrieval quality", "Latency", "Tokens", "Cost"].map((m) => (
            <span key={m} className="px-2.5 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800">{m}</span>
          ))}
        </div>
      ),
    },
    // -------------------- 1. Matching Metrics --------------------
    {
      section: "1. Matching Metrics",
      title: "Exact Match: Strict and Brittle",
      story:
        'Maya: "Okay, run the original bug through it — does exact match even catch it?"\nPriya: "It does, but watch why: it\'s the wording, not the mistake, that trips it."',
      body: (
        <p>
          <Term id="exact-match">Exact match</Term> checks whether the output is
          character-for-character identical to the expected answer. It flagged the bug that went
          live — but it would just as easily flag a correctly-worded paraphrase. It isn&rsquo;t a
          targeted signal for this kind of bug.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
          <div className="text-red-700">&ldquo;Yes, you&rsquo;ll get a full refund.&rdquo; vs. &ldquo;...only a partial refund or store credit.&rdquo;</div>
          <div className="text-neutral-400 mt-1">✗ not exact — but so would a correct paraphrase.</div>
        </div>
      ),
    },
    {
      section: "1. Matching Metrics",
      title: "Semantic Similarity: A Sneakier Version of the Same Bug",
      body: (
        <p>
          Semantic similarity scores meaning over exact wording, typically by comparing{" "}
          <Term id="cosine-similarity">embeddings</Term>. Imagine the AI assistant instead said
          worn items get a 70% refund: fluent, on-topic, worded close to the real answer, and
          still wrong.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
          <div className="text-amber-700">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo;</div>
          <div className="text-neutral-500 mt-1">vs. &ldquo;...only a partial refund or store credit.&rdquo;</div>
          <div className="text-neutral-400 mt-1">High similarity — but 70% is invented. Still wrong.</div>
        </div>
      ),
    },
    // -------------------- 2. Judging Correctness --------------------
    {
      section: "2. Judging Correctness",
      title: "Correctness vs. Faithfulness — the Metric That Catches It",
      story:
        'Priya: "Similarity likes that 70% answer. It shouldn\'t."\nMaya: "So what actually catches it?"\nPriya: "Whether it agrees with the real policy — that\'s faithfulness, not similarity."',
      body: (
        <p>
          Correctness and <Term id="faithfulness">faithfulness</Term> ask different questions.
          The 70%-refund answer scores well on similarity to typical phrasing, but faithfulness
          checks it against the actual return policy — no fixed percentage, ever — and fails it
          every time, same as the original bug.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-3 text-sm">
            <div className="bg-white border border-cyan-300 rounded-md p-2.5 text-center max-w-40">
              <div className="font-medium text-cyan-700 mb-0.5">Correctness</div>
              <div className="text-neutral-600">matches the expected wording</div>
            </div>
            <div className="bg-white border border-purple-300 rounded-md p-2.5 text-center max-w-40">
              <div className="font-medium text-purple-700 mb-0.5">Faithfulness</div>
              <div className="text-neutral-600">supported by the source</div>
            </div>
          </div>
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-neutral-500">Both &ldquo;full refund&rdquo; and &ldquo;70% refund&rdquo; fail faithfulness:</div>
            <div className="text-red-700 mt-1">Neither is supported by the actual return policy — no matter how each is worded.</div>
          </div>
        </div>
      ),
    },
    // -------------------- 3. Measuring the Pipeline --------------------
    {
      section: "3. Measuring the Pipeline",
      title: "Retrieval Quality, Measured Separately",
      body: (
        <p>
          For a system that retrieves documents before answering, <Term id="retrieval-quality">retrieval
          quality</Term> measures whether it found the right documents, independent of the final
          answer. A different question can retrieve the wrong doc entirely — a separate failure
          from getting the wording wrong.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="px-2.5 py-1.5 rounded-full border border-purple-300 bg-purple-50 text-purple-800">Retrieval quality</span>
            <span className="text-neutral-300">≠</span>
            <span className="px-2.5 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800">Answer quality</span>
          </div>
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-neutral-700">Q: &ldquo;What happens if I return a worn item?&rdquo;</div>
            <div className="text-red-700 mt-1">Retrieved: &ldquo;Refund payment methods&rdquo; (wrong — matched on &ldquo;refund&rdquo;)</div>
            <div className="text-neutral-500 mt-1">Should have retrieved: &ldquo;Return condition requirements&rdquo;</div>
          </div>
        </div>
      ),
    },
    {
      section: "3. Measuring the Pipeline",
      title: "Cost Metrics: Latency, Tokens, Price",
      body: (
        <p>
          Fixing the bug shouldn&rsquo;t blow the budget. Latency, <Term id="token">token</Term>{" "}
          usage, and price all affect whether a system is usable in production, alongside
          whether it&rsquo;s faithful.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs flex-wrap">
            {["Latency", "Tokens", "Price"].map((m) => (
              <span key={m} className="px-2.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">{m}</span>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            <div className="bg-white border border-neutral-200 rounded-md p-2.5">
              <div className="text-neutral-500">Fast, cheap model</div>
              <div className="text-neutral-800 mt-0.5">&ldquo;Store credit.&rdquo; — 200ms, low cost</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-md p-2.5">
              <div className="text-neutral-500">Slower, pricier model</div>
              <div className="text-neutral-800 mt-0.5">&ldquo;Store credit, or a partial refund to your original payment method, depending on item condition.&rdquo; — 1.4s, higher cost</div>
            </div>
          </div>
        </div>
      ),
    },
    // -------------------- 4. Choosing a Metric --------------------
    {
      section: "4. Choosing a Metric",
      title: "Choosing the Right Metric for the Task",
      body: (
        <div className="space-y-2">
          <p>Match the metric to the task — a policy question like this one needs faithfulness:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Fixed-format</strong> (a label, a number) — exact match.</li>
            <li><strong>Open-ended writing</strong> — semantic similarity, plus faithfulness if it draws on a source.</li>
            <li><strong>Retrieval-based systems</strong> — retrieval quality, measured on its own.</li>
            <li><strong>Every system</strong> — cost metrics too, alongside quality.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1 text-neutral-700">
          <div>Shipping fact (&ldquo;ships in 5–7 business days&rdquo;) — exact match.</div>
          <div>Paraphrased question — semantic similarity.</div>
          <div className="text-purple-700">Worn-item refund bug (&ldquo;can I return a worn item?&rdquo;) — faithfulness. The metric that catches it.</div>
          <div>Every question — cost metrics too.</div>
        </div>
      ),
    },
    // -------------------- 5. Try It Yourself --------------------
    {
      section: "5. Try It Yourself",
      title: "Try it yourself: score the bug and its sneaky cousin",
      body: (
        <p>
          The reference is the true return policy. Candidate A is the original bug; Candidate B
          is the 70%-refund near-miss. Edit either and watch exact match and word overlap (a
          simple stand-in for semantic similarity) recompute.
        </p>
      ),
      controls: (
        <div className="w-full space-y-2">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm">
            <div className="text-neutral-500">Reference answer</div>
            <div className="text-neutral-800">{REFERENCE}</div>
          </div>
          <input
            value={answerA}
            onChange={(e) => setAnswerA(e.target.value)}
            placeholder="Candidate A"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
          />
          <input
            value={answerB}
            onChange={(e) => setAnswerB(e.target.value)}
            placeholder="Candidate B"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
          />
        </div>
      ),
      resetAction: resetAnswers,
      visual: (
        <div className="grid sm:grid-cols-2 gap-2">
          {scoreRow("Candidate A — the bug", answerA)}
          {scoreRow("Candidate B — the sneaky cousin", answerB)}
        </div>
      ),
    },
    // -------------------- Wrap-up --------------------
    {
      section: "6. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Exact match is strict and cheap, but not a targeted signal — it flags any differently-worded answer, right or wrong.</li>
            <li>Semantic similarity catches paraphrases, but a fluent, similarly-worded wrong answer (like a fabricated percentage) can fool it.</li>
            <li>Faithfulness checks agreement with the actual reference — it caught both versions of this bug, worded differently or not.</li>
            <li>Retrieval quality and cost metrics matter too, measured separately from answer correctness.</li>
            <li>The right metric depends on the task — this policy question needed faithfulness specifically.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "6. Wrap-up",
      title: "Next: Computing Faithfulness Well",
      story:
        'Priya: "Faithfulness is what actually catches this, every time — no matter how it\'s worded."\nMaya: "So how do we compute faithfulness well?"\nPriya: "That takes real judgment. Time to bring in an LLM judge."',
      body: (
        <div className="space-y-2">
          <p>
            Everything above is also unlocked below if you want to score your own answers.
            Faithfulness is what catches this bug — but checking agreement with a reference
            reliably needs real judgment, not just string matching. That means using an LLM as a
            judge.
          </p>
          <Link
            href="/evaluation/judging"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white"
          >
            Continue to Judging &amp; Comparing →
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
            {isLast ? "Finish" : "Next"}
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
