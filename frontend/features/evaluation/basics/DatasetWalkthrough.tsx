"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { PipelineDiagram } from "./PipelineDiagram";

/** Module 3 (Evaluation), Unit "Evaluation Basics", Chapter 1 of 3. Split
 * out of what used to be a single merged "Evaluation Pipeline" Chapter, per
 * the user's explicit request — this Chapter now owns the whole story setup
 * and dataset-building arc on its own: an online clothing retailer's
 * (Southwear) AI support assistant put a wrong answer live and nobody
 * caught it; this Chapter turns that bug into a test case, then builds the
 * dataset that would have caught it. Hands off to "The Evaluation Pipeline"
 * Chapter, which runs that dataset through the six-stage pipeline. */
export function DatasetWalkthrough({
  onComplete,
  initialStep,
  onAdvanceToNextChapter,
}: {
  onComplete?: () => void;
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
}) {
  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    story?: string;
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
          <p>This chapter follows one real bug from a wrong answer to a fix, verified:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Bug, as a Test Case</strong> — turning a wrong answer into something you can check for.</li>
            <li><strong>Building the Dataset</strong> — near-misses, other questions, and sourcing.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture of an Evaluation Pipeline",
      story:
        'Chloe: "Oh no, oh no! What do I do?"\nMaya: "Whoa, breathe. What happened?"\nChloe: "Our AI went completely dumb!"\nMaya: "Dumb how?"\nChloe: "It gave some weird answer to a customer! I don\'t know what to do!"\nMaya: "Hmm. Sounds like we need to evaluate this AI."',
      body: (
        <p>
          Evaluation is a pipeline, not a single step: the AI assistant answers every question
          in a dataset, those outputs get scored, and the score only means something once
          it&rsquo;s compared against something else. Skip a stage, and a wrong answer can slip
          through unnoticed until it&rsquo;s already live.
        </p>
      ),
      visual: <PipelineDiagram />,
    },
    {
      section: "Welcome",
      title: "This Case: A Wrong Answer Got Through",
      story:
        'Maya: "Okay, so what did the AI actually say?"\nChloe: "A customer asked if they\'d get a refund for a worn item. Our AI assistant told them yes, full refund."\nMaya: "Yeah, that\'s wrong — we don\'t give full refunds on worn items."\nChloe: "Exactly! We have to stop it from doing that!"',
      body: (
        <div className="space-y-2">
          <p>
            An AI support assistant for an online clothing retailer was asked whether a worn item
            could be returned for a full refund. It confidently said yes — but worn items only
            qualify for a partial refund or store credit. Nobody caught it before it went live.
          </p>
          <p>This chapter builds the dataset that would have caught it.</p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-red-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
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
        'Maya: "Right. First, let\'s turn this one case into something we can easily test later."\nChloe: "Turn it into... like a Q&A format?"\nMaya: "Exactly. Specifically, we organize it into three things: Question, Expected Answer, and Reference."\nChloe: "Uh-huh."\nMaya: "With it in this format, we can just ask the AI the Question and check whether it matches the Expected Answer."',
      body: (
        <p>
          A test case has a question, an expected answer, and often a reference. This bug
          becomes one: the question that the AI assistant got wrong, the answer it should have
          given, and the doc it should have agreed with.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-3 text-base max-w-sm mx-auto space-y-2">
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
        'Chloe: "Okay, I get Question and Expected Answer. But what\'s this Reference thing?"\nMaya: "Ah, the Reference is the source material the answer should be grounded in — a document, a passage, a fact."\nChloe: "Huh? So doesn\'t the Expected Answer basically say the same thing as the Reference?"\nMaya: "Often, yeah, honestly. But the reference is the real doc — the one thing here you know for sure is true."',
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
        <div className="flex items-center justify-center gap-3 text-base">
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
        'Chloe: "Can\'t we just use Question and Expected Answer, and skip the Reference?"\nMaya: "No. The Expected Answer is written based on the Reference, but it can still be wrong."\nChloe: "Ah, you mean typos — humans make mistakes typing things up."\nMaya: "That too, but there\'s also a chance of misreading or misinterpreting the source document."\nChloe: "Got it. I\'ll go dig up our return policy document."\nMaya: "Okay."',
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
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
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
        'The next day. Chloe pulls up a chair at Maya\'s desk, ready to actually plan this out.\nChloe: "I dug up our company\'s policy — the Return condition requirements doc. We\'re all set now, right?"\nMaya: "Ha — no. It\'s called a dataset because it needs more than one case."\nChloe: "But we just want to fix one wrong answer — do we really need other test cases too?"\nMaya: "Yeah. If we only test the exact same wording, we\'ll miss things. What if someone asks something similar, but phrased differently?"\nChloe: "Like... \'I already wore this jacket around the house — can I get my money back for it?\'"\nMaya: "Exactly — we build multiple test cases so we can catch things like that too."',
      body: (
        <p>
          A dataset is a collection of test cases, not a single one. Testing only this
          bug&rsquo;s exact wording leaves a gap: a near-miss question in the same area —
          worded differently, or covering a similar edge case — can slip through unnoticed
          unless it has its own case too.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-base flex-wrap">
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
        'Maya: "Also, we shouldn\'t just have a test case for this one bug — we need cases for other questions too."\nChloe: "Wait, really? I just want to fix this one wrong answer."\nMaya: "Even so — there are whole areas we haven\'t tested at all. We need to know how well the AI actually handles things overall, not just this one spot."\nChloe: "Ugh, well, when you put it that way..."\nMaya: "Refund timing, final-sale items — completely different questions, each with its own way of going wrong."\nChloe: "Great. So there could be a dozen more bugs like this just waiting."\nMaya: "...Probably, yeah. Let\'s go find them before customers do."',
      body: (
        <p>
          A dataset that only tests the worn-item bug leaves the rest of the AI assistant&rsquo;s
          job completely unchecked. It needs cases covering the fuller range of things customers
          actually ask about return policy.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-base flex-wrap">
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
        'Chloe: "So we need cases covering everything evenly, not just similar ones... doesn\'t that add up to a lot?"\nMaya: "Hmm, let\'s start with something like 100 cases."\nChloe: "What? 100?! Who\'s going to write that many? I\'m going home."\nMaya: "Relax. You don\'t have to write all of them yourself."\nChloe: "Then who does?"\nMaya: "Two ways, really — you hand-write the ones for known risk areas, like this one, and the rest get pulled straight from real production logs or support tickets."',
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
        <div className="bg-white border border-neutral-200 rounded-md p-3 text-base max-w-sm mx-auto space-y-2">
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
      title: "Can We Reuse the Training Data?",
      story:
        'Chloe: "Hmm, hand-writing everything sounds like a pain. I\'d rather import as much as I can."\nMaya: "Sounds good."\nChloe: "Oh, good idea! We should still have the Q&A data we used to train the AI. Let\'s just reuse that."\nMaya: "Wait, I wouldn\'t recommend that. If the AI already saw those exact questions and answers during training, testing on them again won\'t tell us anything real."\nChloe: "Oh... so it\'d just be repeating what it memorized, not actually showing it understands?"\nMaya: "Exactly. We need cases it\'s never seen before, to know if it actually generalizes."',
      body: (
        <div className="space-y-2">
          <p>
            This is a classic mistake called <strong>train/test contamination</strong> (or data
            leakage): evaluating a model on the same data it was trained on.
          </p>
          <p>
            A model can score well on training data simply by having memorized it — that says
            nothing about how it handles a question it has never seen before. A trustworthy
            evaluation set has to be held out from training, made of cases the model is seeing
            for the first time.
          </p>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "2. Building the Dataset",
      title: "Turning a Log Entry Into a Test Case",
      story:
        'Chloe: "But writing everything out is rough..."\nChloe: "Can we use our support chat logs for that."\nMaya: "That\'s reasonable."\nChloe: "But can we just reuse the Question and Answer straight from the logs?"\nMaya: "Only the Question should be reused as-is. The wording is real, but we have no idea if the answer given back then was actually correct — the agent could\'ve gotten it wrong, or the policy could\'ve changed since."\nChloe: "Ugh, that sounds like a pain in its own way. I\'ll leave that work for tomorrow."',
      body: (
        <div className="space-y-2">
          <p>Turning one imported log entry into a test case takes three steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li>Copy the customer&rsquo;s question exactly as written — that&rsquo;s the real value of importing.</li>
            <li>Find the current reference document that actually governs this question, regardless of what the log says.</li>
            <li>Write the expected answer from that reference, not from the old logged reply.</li>
          </ol>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-3 text-base max-w-sm mx-auto space-y-2">
          <div>
            <div className="text-neutral-500 font-medium mb-0.5">From the log</div>
            <div className="text-neutral-800">Q: &ldquo;can i return a top if i tried it on but it still has the tags???&rdquo;</div>
            <div className="text-red-700 mt-1">Old reply (not reused): &ldquo;Yes, since it still has tags you&rsquo;re fine, we&rsquo;ll refund you in full!&rdquo;</div>
          </div>
          <div className="border-t border-neutral-100 pt-2">
            <div className="text-cyan-700 font-medium mb-0.5">Test case built from it</div>
            <div className="text-neutral-800">Question: &ldquo;can i return a top if i tried it on but it still has the tags???&rdquo; (kept as-is)</div>
            <div className="text-neutral-800 mt-1">Expected answer: written fresh from the current return policy</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Building the Dataset",
      title: "From Raw Log to Clean Test Case",
      story:
        'A few days later.\nChloe: "Ta-da! I wrote up a test case."\nMaya: "Oh, nice!"\nChloe: "Look, here\'s the Question and Expected Answer, and this is the Reference."\nMaya: "Looks good. Oh — it looks like there\'s some personal info in there, so don\'t forget to mask it."\nChloe: "Okay."\nMaya: "Also, it\'s a good idea to note down the source not just for the reference, but for the question too."\nChloe: "Ah, so I should write down the support ticket number?"\nMaya: "Exactly."',
      body: (
        <div className="space-y-2">
          <p>
            Turning a raw log entry into a clean test case means more than just copying out
            the question. Before it&rsquo;s ready to use:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Personal information gets masked — names, emails, order numbers.</li>
            <li>Both the question and the reference get a noted source, so either can be traced back later.</li>
            <li>The case gets tagged with a category, so results can be broken down by topic.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3 text-base flex-wrap">
          <div className="bg-white border border-neutral-200 rounded-md p-3 max-w-56 space-y-1">
            <div className="text-neutral-500 font-medium text-sm uppercase tracking-wide">Raw support chat log</div>
            <div className="text-neutral-800">
              &ldquo;Hi, this is Jessica Chen (jessica.chen88@gmail.com, order #48291) — can i
              return a top if i tried it on but it still has the tags???&rdquo;
            </div>
          </div>
          <div className="text-neutral-400 text-xl">&rarr;</div>
          <div className="bg-white border border-cyan-200 rounded-md p-3 max-w-56 space-y-1.5">
            <div className="text-neutral-500 font-medium text-sm uppercase tracking-wide">Test case</div>
            <div className="text-purple-700 text-sm font-medium">Category: Return eligibility</div>
            <div>
              <div className="text-neutral-800">&ldquo;can i return a top if i tried it on but it still has the tags???&rdquo;</div>
              <div className="text-neutral-400 text-sm">source: support ticket #48291</div>
            </div>
            <div>
              <div className="text-neutral-800">Reference: &ldquo;...worn or tag-removed items may only receive a partial refund...&rdquo;</div>
              <div className="text-neutral-400 text-sm">source: Return condition requirements doc</div>
            </div>
          </div>
        </div>
      ),
    },
    // -------------------- 3. Wrap-up --------------------
    {
      section: "3. Wrap-up",
      title: "Checking an Imported Case: A Checklist",
      story:
        'Chloe: "Building a dataset takes a lot of care, huh."\nMaya: "Good catch. It really does."\nChloe: "One mistake in it and it goes straight into how the AI gets scored."\nMaya: "Also, how good the dataset is decides how efficient all the evaluation work after this is."\nChloe: "Ah, that\'s why we\'ve been checking everything so carefully."\nMaya: "Exactly. As a wrap-up for this whole thing, let\'s go over what actually needs checking."\nChloe: "Ooh, a cheat sheet. I like it."',
      body: (
        <div className="space-y-3">
          <div>
            <p className="font-medium text-neutral-800 mb-1">Checking one case</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-700">
              <li><strong>Question</strong> — kept exactly as the customer wrote it, not cleaned up or reworded.</li>
              <li><strong>Reference</strong> — the current policy, not an outdated version, and the clause that actually applies to this question.</li>
              <li><strong>Expected answer</strong> — written fresh from that reference, not copied from the old logged reply.</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-neutral-800 mb-1">Checking the dataset as a whole</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-700">
              <li><strong>Coverage</strong> — cases across the different topics customers actually ask about, not just this one bug.</li>
              <li><strong>Near-misses</strong> — the same question asked in different words, so a paraphrase doesn&rsquo;t slip past unnoticed.</li>
            </ul>
          </div>
        </div>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3 text-base">
          <div className="bg-white border border-cyan-300 rounded-md p-3 max-w-48 text-center">
            <div className="font-medium text-cyan-700 mb-1">Per case</div>
            <div className="text-neutral-600 text-sm">Question · Reference · Expected answer</div>
          </div>
          <div className="bg-white border border-purple-300 rounded-md p-3 max-w-48 text-center">
            <div className="font-medium text-purple-700 mb-1">Per dataset</div>
            <div className="text-neutral-600 text-sm">Coverage · Near-misses</div>
          </div>
        </div>
      ),
    },
    {
      section: "3. Wrap-up",
      title: "What you just learned",
      story:
        'Chloe: "Yay! The dataset is done!"\nMaya: "Nice work."\nChloe: "That journey was a long one..."\nMaya: "That was just the very first part of the evaluation pipeline, though."\nChloe: "Wait, what?! Our battle is just getting started?!"',
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A test case is a question, an expected answer, and often a reference to check the answer against.</li>
            <li>The expected answer is what you want said; the reference is what it should agree with — not the same thing.</li>
            <li>Good coverage means testing near-misses of a known bug, not just the happy path.</li>
            <li>A dataset also needs cases for entirely different questions, not just the one bug that started it.</li>
            <li>Either kind of case can be hand-written for precise control, or imported to capture what real users actually ask.</li>
            <li>Imported cases only reuse the question as-is — the expected answer always gets rewritten from the current reference, never from the old logged reply.</li>
            <li>Before trusting any case: mask personal info, note its source, and tag its category.</li>
          </ul>
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
      onAdvanceToNextChapter?.();
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  };
  const goBack = () => {
    setStep((s) => Math.max(0, s - 1));
  };

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
            {isLast ? (onAdvanceToNextChapter ? "Continue: The Evaluation Pipeline →" : "Finish") : "Next"}
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

        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
