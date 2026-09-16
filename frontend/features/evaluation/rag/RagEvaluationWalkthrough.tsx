"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { Equation } from "@/components/Equation";
import { RagFlowDiagram } from "./RagFlowDiagram";

interface RagDoc {
  id: string;
  label: string;
  relevant: boolean;
}

const DOCS: RagDoc[] = [
  { id: "domestic", label: "Domestic Shipping Policy", relevant: false },
  { id: "international", label: "International Shipping Policy", relevant: true },
  { id: "returns", label: "Returns Policy", relevant: false },
  { id: "warranty", label: "Warranty Policy", relevant: false },
  { id: "sizing", label: "Sizing Guide", relevant: false },
];

const DEFAULT_RETRIEVED: Record<string, boolean> = {
  domestic: true,
  international: false,
  returns: true,
  warranty: true,
  sizing: false,
};

const QUESTION = "Do international orders qualify for free shipping over $50?";
const DOMESTIC_TEXT = "Domestic orders over $50 ship free. Orders under $50 incur a $5 shipping fee.";
const INTERNATIONAL_TEXT = "International orders over $75 ship free. Orders under $75 incur a flat $14 international shipping fee.";
const BUGGY_ANSWER = "Yes! Orders over $50 ship free.";

/** Module 3 (Evaluation), Unit "RAG Evaluation", 1 Chapter. Continues the
 * story from Evaluation Basics / Judging & Comparing: Southwear's support
 * assistant (previously a plain LLM with one policy baked into its
 * prompt) has been expanded into a Help Center Assistant that searches a
 * whole library of policy documents before answering — a real RAG
 * system. That extra step introduces a failure mode the earlier Units
 * never covered: getting the search wrong. Ends without a forward link
 * (Agent Evaluation isn't live yet) but teases it in the closing Step's
 * dialogue. */
export function RagEvaluationWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const [retrieved, setRetrieved] = useState<Record<string, boolean>>(DEFAULT_RETRIEVED);
  const resetRetrieved = () => setRetrieved(DEFAULT_RETRIEVED);

  const retrievedDocs = DOCS.filter((d) => retrieved[d.id]);
  const relevantRetrieved = retrievedDocs.filter((d) => d.relevant).length;
  const totalRetrieved = retrievedDocs.length;
  const totalRelevant = DOCS.filter((d) => d.relevant).length;
  const precision = totalRetrieved === 0 ? null : relevantRetrieved / totalRetrieved;
  const recall = relevantRetrieved / totalRelevant;

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

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            Judging &amp; Comparing verified a fix and caught a regression — but that assistant
            only ever worked from one policy, baked directly into its prompt. Southwear just
            expanded it into a full Help Center Assistant that searches across many documents
            instead. This chapter finds the new kind of bug that comes with that change:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Diagnosing the Failure</strong> — a wrong answer can come from bad retrieval or bad generation; telling them apart.</li>
            <li><strong>Retrieval Quality</strong> — precision and recall, measured on the search step alone.</li>
            <li><strong>Beyond Retrieval</strong> — why a faithful-sounding answer can still be built on the wrong document.</li>
            <li><strong>Diagnosing in Practice</strong> — checking both, in order, to find the real cause.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: Two Ways a RAG Answer Can Be Wrong",
      story:
        'Chloe: "Southwear\'s just given the assistant access to way more documents — shipping, returns, warranty, sizing, all of it."\nMaya: "Nice. But more documents means more places to go looking — and more chances to go looking in the wrong one."\nChloe: "Wait, isn\'t that just the same kind of bug as before?"\nMaya: "No — this one\'s different. Watch."',
      body: (
        <p>
          Southwear&rsquo;s assistant now searches a whole library of policy documents before
          answering, instead of working from one fixed policy written into its prompt. That
          extra step — search, then answer — opens up a failure mode last chapter never had:
          getting the search itself wrong.
        </p>
      ),
      visual: <RagFlowDiagram />,
    },
    // -------------------- 1. Diagnosing the Failure --------------------
    {
      section: "1. Diagnosing the Failure",
      title: "Same Symptom, Different Disease",
      story:
        'Chloe: "Okay, show me. What\'s the bug this time?"\nMaya: "A customer asked whether international orders get free shipping over $50. The assistant said yes."\nChloe: "Is that... wrong?"\nMaya: "Completely. The international threshold is $75, not $50 — that\'s the domestic number."\nChloe: "So it just got the number wrong, like last time?"\nMaya: "Not exactly. Last time, the AI had the right information and worded it badly. This time — let\'s check what it actually had to work with."',
      body: (
        <p>
          A wrong answer can come from two very different places: the AI said something not
          supported by what it found (a generation problem, like last chapter&rsquo;s bug), or it
          never found the right information to begin with (a retrieval problem). Telling these
          apart matters — they need completely different fixes.
        </p>
      ),
      visual: (
        <div className="grid sm:grid-cols-2 gap-2 text-base">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5">
            <div className="font-medium text-neutral-700">Generation problem</div>
            <div className="text-neutral-500 text-sm mt-1">Had the right document, worded the answer wrong. (Last chapter&rsquo;s bug.)</div>
          </div>
          <div className="bg-white border border-purple-300 rounded-md p-2.5">
            <div className="font-medium text-purple-700">Retrieval problem</div>
            <div className="text-neutral-500 text-sm mt-1">Never found the right document in the first place. (Today&rsquo;s bug?)</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. Diagnosing the Failure",
      title: "What Did It Actually Retrieve?",
      story:
        'Chloe: "So what did it actually pull up before answering?"\nMaya: "Let\'s look."\nChloe: "...that\'s the Domestic Shipping Policy. The customer asked about international."\nMaya: "Exactly. It never even opened the right document."',
      body: (
        <p>
          Southwear&rsquo;s Help Center now searches five documents. For this question, only one
          of them is actually relevant — the International Shipping Policy. What the retriever
          actually returned were three completely different documents, and that wasn&rsquo;t one
          of them.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">Q: &ldquo;{QUESTION}&rdquo;</div>
          <div className="text-red-700 mt-1">Retrieved: Domestic Shipping Policy, Returns Policy, Warranty Policy</div>
          <div className="text-emerald-700">Should have retrieved: International Shipping Policy</div>
        </div>
      ),
    },
    {
      section: "1. Diagnosing the Failure",
      title: "The Fluent, Confident, Wrong Answer",
      story:
        'Chloe: "But the answer it gave sounded totally normal. It didn\'t hesitate at all."\nMaya: "That\'s the scary part. It\'s not making anything up — it\'s accurately summarizing the wrong document."\nChloe: "So it\'s... faithful? Just faithful to the wrong thing?"\nMaya: "Exactly that."',
      body: (
        <p>
          The assistant&rsquo;s answer — &ldquo;{BUGGY_ANSWER}&rdquo; — is an accurate summary of
          the Domestic Shipping Policy it retrieved. Checked only against what it found, the
          answer is completely faithful. The problem isn&rsquo;t the generation step at all —
          it&rsquo;s what got handed to it.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">Retrieved doc: &ldquo;{DOMESTIC_TEXT}&rdquo;</div>
          <div className="text-neutral-800 mt-1">Answer: &ldquo;{BUGGY_ANSWER}&rdquo;</div>
          <div className="text-amber-700 mt-1">Faithful to what it found — it just found the wrong thing.</div>
        </div>
      ),
    },
    // -------------------- 2. Retrieval Quality --------------------
    {
      section: "2. Retrieval Quality",
      title: "Retrieval Quality, Measured Separately",
      story:
        'Chloe: "Okay so how do we catch this kind of thing before it ships?"\nMaya: "We measure the retrieval step on its own — completely separately from whether the final answer sounds good."\nChloe: "Why separately? Isn\'t the answer all that matters?"\nMaya: "Because a bad answer built on the right document, and a bad answer built on the wrong one, need completely different fixes. You can\'t tell which one you have unless you check retrieval by itself."',
      body: (
        <p>
          Retrieval quality measures whether the search step
          found the right documents, independent of what the model does with them afterward.
          It&rsquo;s checked before, and separately from, the final answer.
        </p>
      ),
      visual: <RagFlowDiagram highlight="retrieve" />,
    },
    {
      section: "2. Retrieval Quality",
      title: "Retrieval Precision: How Much of It Was Useful?",
      story:
        'Chloe: "So how do you actually score that?"\nMaya: "Two ways. First: of everything it retrieved, how much was even relevant?"',
      body: (
        <div className="space-y-2">
          <p>Precision looks only at what was retrieved, and asks how much of it was relevant:</p>
          <Equation tex={"\\text{Precision} = \\frac{\\text{relevant docs retrieved}}{\\text{total docs retrieved}}"} />
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">Retrieved 3 docs: Domestic Shipping Policy, Returns Policy, Warranty Policy</div>
          <div className="text-neutral-500">0 of 3 are actually relevant to this question.</div>
          <div className="text-cyan-700 font-medium">Precision: 0/3 = 0.0</div>
        </div>
      ),
    },
    {
      section: "2. Retrieval Quality",
      title: "Retrieval Recall: Did It Even Get the Right Doc?",
      story:
        'Maya: "Second: of everything actually relevant out there, how much did it find?"\nChloe: "And here... it found none of it."',
      body: (
        <div className="space-y-2">
          <p>Recall looks at everything relevant that exists, and asks how much made it in:</p>
          <Equation tex={"\\text{Recall} = \\frac{\\text{relevant docs retrieved}}{\\text{total relevant docs that exist}}"} />
          <p>
            A low precision still has the right doc buried in there somewhere. A low recall means
            it was never retrieved at all — the harder failure.
          </p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">Only 1 doc is relevant: International Shipping Policy.</div>
          <div className="text-red-700">It was never retrieved at all — three unrelated documents came back instead.</div>
          <div className="text-purple-700 font-medium">Recall: 0/1 = 0.0</div>
        </div>
      ),
    },
    // -------------------- 3. Beyond Retrieval --------------------
    {
      section: "3. Beyond Retrieval",
      title: "Answer Quality Isn't the Same as Faithfulness",
      story:
        'Chloe: "Okay but suppose it had retrieved the right document. Are we done then?"\nMaya: "Not quite — the generation step can still mess it up on its own."\nChloe: "How? At that point it\'s just reading the right doc."\nMaya: "Reading isn\'t the same as reading correctly. It could misquote a number, drop a caveat, anything."',
      body: (
        <p>
          Even with the correct document in hand, generation is a separate step that can still
          fail on its own — misreading a figure, dropping a condition, overgeneralizing what the
          source actually said. Retrieval quality and generation quality are two independent
          things to check.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
          <span className="px-2.5 py-1.5 rounded-full border border-purple-300 bg-purple-50 text-purple-800">Retrieval quality</span>
          <span className="text-neutral-300">≠</span>
          <span className="px-2.5 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800">Generation quality</span>
        </div>
      ),
    },
    {
      section: "3. Beyond Retrieval",
      title: "Faithful to the Wrong Document",
      story:
        'Chloe: "Wait, so if we run faithfulness on today\'s bug, does it even catch it?"\nMaya: "Let\'s check. What does the answer say, and what did it actually retrieve?"\nChloe: "\'Orders over $50 ship free\' — and it retrieved the Domestic policy, which says exactly that."\nMaya: "So by the numbers, that\'s a perfectly faithful answer."\nChloe: "...even though it\'s completely wrong?"\nMaya: "Even though it\'s completely wrong. Faithfulness only checks against what was retrieved — not against the truth."',
      body: (
        <div className="space-y-2">
          <p>
            Faithfulness is checked against whatever was retrieved
            — not against ground truth. Here, the claim &ldquo;over $50 ships free&rdquo; is fully
            supported by the retrieved Domestic Shipping Policy, so faithfulness scores it a
            perfect 1.0. Faithfulness alone can&rsquo;t see that the wrong document was retrieved
            in the first place — that failure is invisible to it by design.
          </p>
        </div>
      ),
      visual: (
        <div className="grid sm:grid-cols-2 gap-2 text-base">
          <div className="bg-white border border-emerald-300 rounded-md p-2.5">
            <div className="text-neutral-500 text-sm">vs. what was retrieved</div>
            <div className="text-emerald-700 font-medium mt-1">Faithfulness: 1.0 — fully supported</div>
          </div>
          <div className="bg-white border border-red-300 rounded-md p-2.5">
            <div className="text-neutral-500 text-sm">vs. the correct policy</div>
            <div className="text-red-700 mt-1">&ldquo;{INTERNATIONAL_TEXT}&rdquo;</div>
            <div className="text-red-700 font-medium mt-1">Wrong — $75 is the real international threshold</div>
          </div>
        </div>
      ),
    },
    // -------------------- 4. Diagnosing in Practice --------------------
    {
      section: "4. Diagnosing in Practice",
      title: "Putting the Diagnosis Together",
      story:
        'Chloe: "So faithfulness alone would\'ve let this ship?"\nMaya: "Right past it. That\'s exactly why you check retrieval quality first, separately."\nChloe: "So the order matters — retrieval quality, then faithfulness?"\nMaya: "Exactly. If retrieval quality is bad, you already have your answer — fix the search. Only if retrieval looks fine do you even need to ask whether generation was faithful."',
      body: (
        <p>
          Diagnosing a wrong RAG answer means checking two things, in order. First, retrieval
          quality (precision and recall) — if that&rsquo;s bad, the fix is in the search step, and
          faithfulness doesn&rsquo;t need to be asked at all. Only once retrieval looks fine does a
          low faithfulness score actually point at generation.
        </p>
      ),
      visual: (
        <div className="max-w-sm mx-auto space-y-1.5 text-base">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center">Wrong answer</div>
          <div className="text-center text-neutral-300">↓</div>
          <div className="bg-white border border-purple-300 rounded-md p-2.5 text-center">Retrieval quality bad? → fix the search</div>
          <div className="text-center text-neutral-300">↓ retrieval was fine</div>
          <div className="bg-white border border-cyan-300 rounded-md p-2.5 text-center">Faithfulness bad? → fix the generation</div>
        </div>
      ),
    },
    // -------------------- 5. Try It Yourself --------------------
    {
      section: "5. Try It Yourself",
      title: "Try it yourself: diagnose the shipping bug",
      body: (
        <p>
          Toggle which documents the retriever actually returned for this question, and watch
          precision and recall recompute. Try including the International Shipping Policy and
          see what changes.
        </p>
      ),
      controls: (
        <div className="w-full space-y-1.5">
          {DOCS.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-base text-neutral-700">
              <input
                type="checkbox"
                checked={retrieved[d.id]}
                onChange={(e) => setRetrieved((r) => ({ ...r, [d.id]: e.target.checked }))}
              />
              {d.label}
              {d.relevant && <span className="text-sm text-emerald-700">(the relevant one)</span>}
            </label>
          ))}
        </div>
      ),
      resetAction: resetRetrieved,
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">
            Retrieved: {totalRetrieved === 0 ? "nothing" : retrievedDocs.map((d) => d.label).join(", ")}
          </div>
          <div className="text-cyan-700 font-medium">
            Precision: {precision === null ? "n/a" : `${relevantRetrieved}/${totalRetrieved} = ${precision.toFixed(2)}`}
          </div>
          <div className="text-purple-700 font-medium">
            Recall: {relevantRetrieved}/{totalRelevant} = {recall.toFixed(2)}
          </div>
        </div>
      ),
    },
    // -------------------- 6. Wrap-up --------------------
    {
      section: "6. Wrap-up",
      title: "What you just learned",
      story:
        'Maya: "So — same \'wrong answer\' symptom as before, but a completely different disease this time."\nChloe: "Yeah, I was ready to blame the wording again. Turns out it never even had the right document."\nMaya: "That\'s the whole point of checking retrieval separately. Ready for the recap?"\nChloe: "Hit me."',
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A wrong RAG answer can come from a retrieval failure (wrong document) or a generation failure (right document, worded wrong) — and they need different fixes.</li>
            <li>Retrieval quality is measured independently of the final answer&rsquo;s wording.</li>
            <li>Retrieval precision asks how much of what was retrieved was relevant; recall asks how much of what&rsquo;s relevant was actually retrieved.</li>
            <li>Faithfulness only checks an answer against what was retrieved — it can score a wrong answer as perfectly faithful if the wrong document was retrieved in the first place.</li>
            <li>Diagnose in order: check retrieval quality first, and only trust a low faithfulness score as a generation problem once retrieval checks out.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "6. Wrap-up",
      title: "Closing: One Pipeline, Many Places to Fail",
      story:
        'Chloe: "So is that it? Have we covered every way an AI system can go wrong?"\nMaya: "Every way this system can. A chatbot answering one question at a time is still one of the simpler shapes an AI system takes."\nChloe: "There\'s more?"\nMaya: "Systems that take several actions in a row, using tools along the way — that\'s a whole different kind of failure to catch. Let\'s go look."',
      body: (
        <div className="space-y-2">
          <p>
            This chapter added a new layer to the diagnostic toolkit: when an AI system searches
            before it answers, a wrong result can come from the search step, the generation step,
            or both — and telling them apart is what makes the fix targeted instead of a guess.
          </p>
          <Link
            href="/evaluation/agents"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to Agent Evaluation →
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
            <a
              href="/evaluation/judging"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to Judging &amp; Comparing
            </a>
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
