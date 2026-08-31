"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";

interface TestCase {
  question: string;
  expected: string;
  reference: string;
}

const STARTER_CASES: TestCase[] = [
  {
    question: "Can I get a refund if I've already worn the item?",
    expected: "No — worn items only qualify for a partial refund or store credit.",
    reference: "Items that are worn or missing tags may only receive a partial refund or store credit, at Southwear's discretion.",
  },
];

/** Module 3 (Evaluation), Unit "Evaluation Basics", Chapter 1 of 3.
 *
 * This Unit tells one continuous story across all 3 Chapters, continuing
 * into Unit "Judging & Comparing": an online clothing retailer's (Southwear)
 * AI support assistant put a wrong answer live ("Yes, you'll get a full refund"
 * for a worn item — the docs say worn items only get a partial refund or
 * store credit) and nobody caught it. This Chapter builds the dataset that
 * would have. Chapter 2 runs it through the pipeline. Chapter 3 finds out
 * which metric actually flags the bug. Reveal the incident up front
 * (Step 2) rather than holding it back — clarity for the learner beats
 * narrative suspense, per the user's explicit direction.
 *
 * Teaches the real 2026 evaluation-engineering concept throughout, not a
 * tour of this app (pedagogy-guidelines.md's "Subject matter" section) —
 * "this app" is only mentioned in the Try-it-yourself Step. */
export function DatasetBuilderWalkthrough({
  onComplete,
  initialStep,
  onAdvanceToNextChapter,
}: {
  onComplete?: () => void;
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
}) {
  const [cases, setCases] = useState<TestCase[]>(STARTER_CASES);
  const [draft, setDraft] = useState<TestCase>({ question: "", expected: "", reference: "" });
  const addCase = () => {
    if (!draft.question.trim() || !draft.expected.trim()) return;
    setCases((c) => [...c, draft]);
    setDraft({ question: "", expected: "", reference: "" });
  };
  const removeCase = (i: number) => setCases((c) => c.filter((_, idx) => idx !== i));
  const resetCases = () => {
    setCases(STARTER_CASES);
    setDraft({ question: "", expected: "", reference: "" });
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

  const steps: Step[] = [
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter follows one real bug into the dataset that would have caught it:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Bug, as a Test Case</strong> — turning a wrong answer into something you can check for.</li>
            <li><strong>Building the Dataset</strong> — near-misses of this bug, other questions entirely, and where cases come from.</li>
            <li><strong>Making It Trustworthy</strong> — label quality decides whether the result can be believed.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: A Wrong Answer Got Through",
      story:
        'Southwear\'s support desk. Maya, from customer support, is talking with Priya, an evaluation engineer.\nMaya: "A customer asked if they\'d get a refund for a worn item. Our AI assistant said yes, full refund."\nPriya: "That\'s... not right, is it?"\nMaya: "Nope. Worn items only get a partial refund or store credit. Nobody caught this before it went live."\nThe AI assistant got it wrong, and nobody caught it before it went live. Time to learn how to evaluate it properly.',
      body: (
        <div className="space-y-2">
          <p>
            An AI support assistant for an online clothing retailer was asked whether a worn item
            could be returned for a full refund. It confidently said yes — but worn items only
            qualify for a partial refund or store credit. Nobody caught it before it went live.
          </p>
          <p>This chapter builds the dataset that would have.</p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-red-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
          <div className="text-neutral-500">Q: &ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
          <div className="text-red-700 mt-1">Answer given: &ldquo;Yes, as long as it&rsquo;s within 30 days, you&rsquo;ll get a full refund.&rdquo;</div>
          <div className="text-neutral-400 mt-1">Wrong — worn items only get a partial refund or store credit.</div>
        </div>
      ),
    },
    // -------------------- 1. The Bug, as a Test Case --------------------
    {
      section: "1. The Bug, as a Test Case",
      title: "Turning the Bug Into a Test Case",
      story:
        'Maya: "So how do we stop this exact thing from happening again?"\nPriya: "First step: turn this one bug into something we can check for automatically."',
      body: (
        <p>
          A test case has a question, an expected answer, and often a reference. This bug
          becomes one: the question that the AI assistant got wrong, the answer it should have
          given, and the doc it should have agreed with.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm max-w-sm mx-auto space-y-2">
          <div>
            <div className="text-neutral-500 font-medium mb-0.5">Question</div>
            <div className="text-neutral-800">&ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
          </div>
          <div className="border-t border-neutral-100 pt-2">
            <div className="text-cyan-700 font-medium mb-0.5">Expected answer</div>
            <div className="text-neutral-800">&ldquo;No — worn items only qualify for a partial refund or store credit, not a full refund.&rdquo;</div>
          </div>
          <div className="border-t border-neutral-100 pt-2">
            <div className="text-purple-700 font-medium mb-0.5">Reference</div>
            <div className="text-neutral-800">&ldquo;Items that are worn or missing tags may only receive a partial refund or store credit.&rdquo; (doc: &ldquo;Return condition requirements&rdquo;)</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. The Bug, as a Test Case",
      title: "What Is a Reference?",
      story:
        'Maya: "Question, Answer — okay, I get those. But what\'s this Reference thing? Why do we need it too?"\nPriya: "It\'s the actual doc the answer has to agree with — not just the wording we\'re hoping for."\nMaya: "Why? Isn\'t the Answer basically the same thing as the Reference?"\nPriya: "Often, yeah. But the reference is the real doc — the one thing here you know for sure is true."',
      body: (
        <div className="space-y-2">
          <p>An expected answer and a reference are not the same thing:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Expected answer</strong> — what you want the system to say.</li>
            <li>
              <strong>Reference</strong> — the source material that answer should be grounded
              in: a document, a passage, a fact.
            </li>
          </ul>
        </div>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3 text-sm">
          <div className="bg-white border border-cyan-300 rounded-md p-2.5 text-center max-w-40">
            <div className="font-medium text-cyan-700 mb-0.5">Expected answer</div>
            <div className="text-neutral-600">what you want said</div>
          </div>
          <div className="bg-white border border-purple-300 rounded-md p-2.5 text-center max-w-40">
            <div className="font-medium text-purple-700 mb-0.5">Reference</div>
            <div className="text-neutral-600">what it should agree with</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. The Bug, as a Test Case",
      title: "Why a Reference Is Needed",
      story:
        'Maya: "Okay — so what actually breaks if we just compare to the Answer and skip the reference?"\nPriya: "Two things, actually. Watch what happens when we check this answer against the real doc instead."',
      body: (
        <div className="space-y-2">
          <p>The reference protects the evaluation from two different failure modes:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Matching wording isn&rsquo;t the same as matching the truth.</strong> A
              correct answer can be phrased completely differently from the expected answer,
              and a wrong one can still happen to resemble it. The reference checks agreement
              with the real policy directly — not with any one fixed phrasing.
            </li>
            <li>
              <strong>The expected answer itself can be wrong.</strong> A person writes it by
              hand — the reference is the one thing here you already know is true.
            </li>
          </ol>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
          <div className="text-red-700">Answer given: &ldquo;Yes, you&rsquo;ll get a full refund.&rdquo;</div>
          <div className="text-purple-700 mt-1">Reference: &ldquo;...worn items may only receive a partial refund...&rdquo;</div>
        </div>
      ),
    },
    // -------------------- 2. Building the Dataset --------------------
    {
      section: "2. Building the Dataset",
      title: "What Is a Dataset?",
      story:
        'A few days later, planning out the dataset properly.\nMaya: "So — we just add a reference to today\'s question and answer, and we\'re set?"\nPriya: "No. It\'s called a dataset because it needs more than one case."',
      body: (
        <p>
          A dataset is a collection of test cases, not a single one. Today&rsquo;s worn-item
          case, with its reference, is only the first entry.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm max-w-sm mx-auto space-y-1.5">
          <div className="text-neutral-500 text-xs font-medium">A dataset — 3 of many test cases</div>
          <div className="border-t border-neutral-100 pt-1.5">
            <div className="text-neutral-800">&ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
            <div className="text-cyan-700">&rarr; No — partial refund or store credit only.</div>
          </div>
          <div className="border-t border-neutral-100 pt-1.5">
            <div className="text-neutral-800">&ldquo;How long does a refund take once you get my item back?&rdquo;</div>
            <div className="text-cyan-700">&rarr; 5&ndash;7 business days after it&rsquo;s received and inspected.</div>
          </div>
          <div className="border-t border-neutral-100 pt-1.5">
            <div className="text-neutral-800">&ldquo;Can I return a final sale item?&rdquo;</div>
            <div className="text-cyan-700">&rarr; No — final sale items can&rsquo;t be returned.</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Building the Dataset",
      title: "Coverage: One Case Isn't Enough",
      story:
        'Maya: "Wait — this is all about one bug. Do we really need more than one test case for it?"\nPriya: "We do — testing only its exact wording leaves a gap. What if someone asks almost the same thing, worded differently?"\nMaya: "Like whether removing the tags without wearing it still counts?"\nPriya: "Exactly. A close cousin like that would slip right through."',
      body: (
        <p>
          The worn-item case catches that one bug. A near-miss question in the same area — like
          whether removing the tags counts the same way — needs its own case, or a similar bug
          slips through unnoticed.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-sm flex-wrap">
          {[
            { label: "“Can I get a refund if I’ve worn it?” (the bug)", edge: false },
            { label: "“What if I removed the tags but never wore it?” (near-miss)", edge: true },
            { label: "“How long until my refund shows up?” (unrelated)", edge: false },
          ].map((s, i) => (
            <span
              key={i}
              className={`px-2.5 py-1.5 rounded-full border text-center ${
                s.edge ? "border-amber-300 bg-amber-50 text-amber-800" : "border-neutral-300 bg-white text-neutral-600"
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>
      ),
    },
    {
      section: "2. Building the Dataset",
      title: "Testing Beyond This One Bug",
      story:
        'Maya: "Don\'t we need to handle other kinds of questions too, not just this one?"\nPriya: "We do — refund timing, final-sale items, completely different questions with their own bugs."',
      body: (
        <p>
          A dataset that only tests the worn-item bug leaves the rest of the AI assistant&rsquo;s
          job completely unchecked. It needs cases covering the fuller range of things customers
          actually ask about return policy.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-sm flex-wrap">
          {["Worn-item refunds", "Refund timing", "Final-sale items", "…and more"].map((t) => (
            <span key={t} className="px-2.5 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-600">
              {t}
            </span>
          ))}
        </div>
      ),
    },
    {
      section: "2. Building the Dataset",
      title: "Hand-Written vs. Imported",
      story:
        'Maya: "So how do we actually come up with all these new cases — the near-misses, the other topics, all of it?"\nPriya: "Two ways. Both work for either kind."',
      body: (
        <div className="space-y-2">
          <p>Whichever kind of case you need next, more come from two places:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Hand-written</strong> — a domain expert authors cases for known risk
              areas, like this one, giving precise control over what gets tested.
            </li>
            <li>
              <strong>Imported</strong> — pulled from production logs or support tickets.
              Captures what real users actually ask, often stranger than anyone would write by
              hand.
            </li>
          </ul>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm max-w-sm mx-auto space-y-2">
          <div>
            <div className="text-neutral-500 font-medium mb-0.5">Hand-written</div>
            <div className="text-neutral-800">&ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo; — written straight from the bug report.</div>
          </div>
          <div className="border-t border-neutral-100 pt-2">
            <div className="text-neutral-500 font-medium mb-0.5">Imported</div>
            <div className="text-neutral-800">&ldquo;can i return a top if i tried it on but it still has the tags???&rdquo; — a real support ticket, messier than anyone would write by hand.</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Building the Dataset",
      title: "Try it yourself: build a mini dataset",
      story: 'Priya: "Want to see what a small dataset actually looks like? Try building one."',
      body: (
        <p>
          Add a test case below — a question and the answer you&rsquo;d expect. Real datasets
          for a production system often hold hundreds or thousands of cases; this sandbox keeps
          the number small so you can see every one of them at once.
        </p>
      ),
      controls: (
        <div className="w-full space-y-2">
          <input
            value={draft.question}
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
            placeholder="Question"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
          />
          <input
            value={draft.expected}
            onChange={(e) => setDraft((d) => ({ ...d, expected: e.target.value }))}
            placeholder="Expected answer"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
          />
          <input
            value={draft.reference}
            onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
            placeholder="Reference (optional)"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
          />
          <button
            onClick={addCase}
            disabled={!draft.question.trim() || !draft.expected.trim()}
            className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-sm font-medium text-white"
          >
            Add test case
          </button>
        </div>
      ),
      resetAction: resetCases,
      visual: (
        <div className="space-y-1.5">
          <div className="text-xs text-neutral-500">{cases.length} test case{cases.length === 1 ? "" : "s"} in this dataset</div>
          <ol className="space-y-1.5">
            {cases.map((c, i) => (
              <li key={i} className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm flex items-start justify-between gap-2">
                <div>
                  <div className="text-neutral-800">{c.question}</div>
                  <div className="text-cyan-700 mt-0.5">→ {c.expected}</div>
                </div>
                <button onClick={() => removeCase(i)} className="text-neutral-400 hover:text-red-600 shrink-0" aria-label="Remove test case">✕</button>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    // -------------------- 3. Making It Trustworthy --------------------
    {
      section: "3. Making It Trustworthy",
      title: "Label Quality Sets the Ceiling",
      story:
        'Maya: "Wait — what if we get the expected answer wrong when we write the case?"\nPriya: "Then the dataset scores the bug as correct. Our mistake would end up protecting theirs."',
      body: (
        <p>
          Every score compares the actual output against the dataset&rsquo;s expected answer and
          reference. If this case&rsquo;s own expected answer were mislabeled, the dataset could
          reward the very bug it was built to catch.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full border border-red-300 bg-red-50 text-red-700 font-medium">Bad label</span>
            <span className="text-neutral-300">→</span>
            <span className="px-3 py-1.5 rounded-full border border-red-300 bg-red-50 text-red-700 font-medium">Bug goes live anyway</span>
          </div>
          <div className="bg-white border border-red-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-neutral-500">Q: &ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
            <div className="text-red-700 mt-1">Mislabeled expected: &ldquo;Yes, full refund.&rdquo; (wrong — the docs say partial refund or store credit only)</div>
            <div className="text-neutral-600 mt-1">Now the bug scores as correct.</div>
          </div>
        </div>
      ),
    },
    // -------------------- Wrap-up --------------------
    {
      section: "4. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A test case is a question, an expected answer, and often a reference to check the answer against.</li>
            <li>The expected answer is what you want said; the reference is what it should agree with — not the same thing.</li>
            <li>Good coverage means testing near-misses of a known bug, not just the happy path.</li>
            <li>A dataset also needs cases for entirely different questions, not just the one bug that started it.</li>
            <li>Either kind of case can be hand-written for precise control, or imported to capture what real users actually ask.</li>
            <li>Label quality is a ceiling: a mislabeled case can reward the exact bug it was meant to catch.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Wrap-up",
      title: "Next: Run It Through the Pipeline",
      story:
        'Maya: "Okay, we\'ve got a dataset with the bug in it. Now what?"\nPriya: "Now we find out if actually running it catches anything."\nA dataset with the bug inside, ready to go. Next: does running it actually catch it?',
      body: (
        <p>
          We now have a dataset that includes the bug. Everything above is also unlocked below
          if you want to keep building your own dataset. When you&rsquo;re ready, continue: does
          running this dataset actually catch the bug?
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
          <button
            onClick={goBack}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-sm text-neutral-700"
          >
            Back
          </button>
          <button onClick={goNext} className={nextBtn}>
            {isLast ? (onAdvanceToNextChapter ? "Continue: The Evaluation Pipeline →" : "Finish") : "Next"}
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
