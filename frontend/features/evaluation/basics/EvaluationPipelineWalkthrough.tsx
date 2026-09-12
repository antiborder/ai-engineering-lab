"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { PipelineDiagram } from "./PipelineDiagram";

interface PresetCase {
  question: string;
  expected: string;
  actual: string;
}

const PRESET: PresetCase = {
  question: "Can I get a refund if I've already worn the item?",
  expected: "No — worn items only qualify for a partial refund or store credit.",
  actual: "Yes, as long as it's within 30 days, you'll get a full refund.",
};

/** Module 3 (Evaluation), Unit "Evaluation Basics", Chapter 2 of 3. Split
 * out of what used to be a single merged "Evaluation Pipeline" Chapter, per
 * the user's explicit request — the dataset-building arc now lives entirely
 * in the "Dataset" Chapter that precedes this one. This Chapter picks up
 * right after that dataset is built, and runs it through the six-stage
 * pipeline (Artifact, Dataset, Run, Evaluation, Score, Comparison). Ends on
 * a cliffhanger the Metrics Chapter resolves: which metric actually flags
 * this bug as wrong? */
export function EvaluationPipelineWalkthrough({
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
      story:
        'Chloe: "Wait, what?! Our battle is just getting started?!"\nMaya: "Relax, the hard part\'s over."\nChloe: "I see. So what\'s left to do?"\nMaya: "You just run the dataset you built through the evaluation pipeline."\nChloe: "Evaluation pipeline?"\nMaya: "It\'s a system that automatically evaluates the AI."',
      body: (
        <div className="space-y-2">
          <p>With the dataset built, this chapter runs it through the pipeline:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Artifact</strong> — what&rsquo;s actually under test.</li>
            <li><strong>Dataset</strong> — the questions and answers it&rsquo;s tested against.</li>
            <li><strong>Run</strong> — collecting outputs, nothing judged yet.</li>
            <li><strong>Evaluation &amp; Score</strong> — comparing outputs, then scoring them.</li>
            <li><strong>Comparison</strong> — a score only means something next to another one.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture of an Evaluation Pipeline",
      story:
        'Maya: "Let me show you the overall map of evaluation."\nChloe: "Ooh."\nMaya: "Here\'s the rundown:"\nMaya: "1. Give the Dataset and Artifact to the AI to run inference."\nMaya: "2. Evaluate the result to get a Score."\nMaya: "3. Compare that Score across multiple AIs to decide which one to use."',
      body: (
        <ol className="list-decimal list-inside space-y-1 text-neutral-700">
          <li>Give the Dataset and Artifact to the AI to run inference.</li>
          <li>Evaluate the result, and it produces a Score.</li>
          <li>Compare that Score across multiple AIs to decide which one to use.</li>
        </ol>
      ),
      visual: <PipelineDiagram />,
    },
    // -------------------- 1. Artifact --------------------
    {
      section: "1. Artifact",
      title: "An AI Artifact Is What You're Testing",
      story:
        'Chloe: "Okay, so what exactly is being tested here — the AI assistant itself, as a whole thing?"\nMaya: "Sort of, but more specific than that. One saved, version-tracked snapshot of it."\nChloe: "So... a snapshot?"\nMaya: "Basically. A saved bundle like that even has a name — it\'s called an AI artifact."',
      body: (
        <p>
          In simple terms, an AI artifact is whatever single, specific configuration is
          saved and version-tracked as the thing under test.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["artifact"]} />
        </div>
      ),
    },
    {
      section: "1. Artifact",
      title: "What's Actually Inside an Artifact?",
      story:
        'Chloe: "Wait, \'artifact\'? What is that, actually?"\nMaya: "Let\'s get concrete. For Southwear\'s assistant, it\'s two things."\nChloe: "Like what?"\nMaya: "First, the model — whichever LLM is actually answering."\nChloe: "Okay, and the second thing?"\nMaya: "The system prompt — the instructions it\'s given, including the return policy text itself. Southwear sets that once, not the customer."\nChloe: "Ah, so those two together are the artifact."\nMaya: "Exactly."',
      body: (
        <div className="space-y-2">
          <p>For Southwear&rsquo;s support assistant, the artifact is exactly two things:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>The model — which LLM is answering.</li>
            <li>
              The system prompt — the instructions it&rsquo;s given, including the return
              policy text itself, set once by Southwear, not by the customer.
            </li>
          </ul>
          <p>
            More generally, an artifact can be a prompt, a RAG setup, an agent, a model
            choice — any of these, not just one type. Evaluation always measures one
            specific, reproducible AI artifact, so a later score can be traced back to
            exactly what produced it.
          </p>
          <p>
            If a system retrieves documents at answer time instead of having them written
            into the prompt — a RAG setup — that retrievable document set becomes a third,
            separately version-tracked part of the artifact, alongside the model and prompt.
          </p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto text-cyan-700">
          AI artifact: Southwear&rsquo;s AI support assistant — 1 model, 1 system prompt (return policy included).
        </div>
      ),
    },
    {
      section: "1. Artifact",
      title: "Why Pin Down the Artifact?",
      story:
        'Chloe: "Wait, why do we even need a fancy name for it? Isn\'t it just... the AI assistant?"\nMaya: "Because \'the AI assistant\' can quietly change. Tweak the prompt, swap the model — and it\'s a different artifact, even if you still call it by the same name."\nChloe: "Okay, but does that actually matter?"\nMaya: "It matters the moment you compare two scores. Say last week\'s run scored 91, and today\'s scores 84 — was that from your fix, or did someone change the prompt in between?"\nChloe: "Oh. So without pinning it down, you can\'t even tell what caused the drop."',
      body: (
        <div className="space-y-2">
          <p>
            Without a pinned-down artifact, a score change is ambiguous: it could reflect a
            real improvement or regression, or it could just mean something else was swapped in
            between runs — a different prompt, or a different model.
          </p>
          <p>Version-tracking the artifact is what makes a score traceable back to one specific cause.</p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-red-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
          <div className="text-neutral-500">Last week: prompt v1 → 91/100</div>
          <div className="text-neutral-500">This week: prompt v2, untracked → 84/100</div>
          <div className="text-red-700 mt-1">Did the fix help or hurt? With no pinned artifact, there&rsquo;s no way to tell.</div>
        </div>
      ),
    },
    {
      section: "2. Dataset",
      title: "A Dataset Gives It Something to Answer",
      story:
        'Chloe: "Next up is Dataset, right?"\nMaya: "Good news — we already built that dataset. Now it finally gets to do its job."\nChloe: "Wow! Amazing! ...Though I already knew that."\nMaya: "Well, you did just build it."\nChloe: "Questions, each paired with an expected answer and a reference to back it up, right?"\nMaya: "That\'s right!"',
      body: (
        <p>
          The dataset we built supplies the questions the AI artifact will answer, along with
          the expected answer for each one — starting with the worn-item bug&rsquo;s test case.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["dataset"]} />
        </div>
      ),
    },
    {
      section: "3. Run",
      title: "A Run Produces Outputs, Nothing Else Yet",
      story:
        'Chloe: "So we just... ask the AI assistant the question and see what it says?"\nMaya: "Pretty much, yeah. That\'s called a run. Nothing\'s graded yet — we\'re only collecting what it actually said."\nChloe: "Feels almost anticlimactic."\nMaya: "Just wait."',
      body: (
        <p>
          A run sends every test case&rsquo;s question through the AI artifact and records whatever
          it actually answered. Nothing is judged yet — a run only collects outputs, ready for
          the next stage to score.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["run"]} />
        </div>
      ),
    },
    {
      section: "3. Run",
      title: "One Run, Many Cases",
      story:
        'Chloe: "So a run is just... asking it this one question?"\nMaya: "No — a run sends every case in the dataset through the artifact, all 100 of them. This one bug is just the case we\'re following closely."\nChloe: "Oh, so behind the scenes it\'s actually answering a hundred different questions right now?"\nMaya: "Exactly. We actually get an output back from the AI for all 100 questions right here."',
      body: (
        <p>
          A run isn&rsquo;t limited to one question — it sends every test case in the dataset
          through the artifact and records an output for each. This chapter keeps following
          the worn-item bug&rsquo;s case specifically, but in a real run, all 100 cases get
          answered at once.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["run"]} />
        </div>
      ),
    },
    {
      section: "4. Evaluation & Score",
      title: "Evaluation Compares the Output",
      story:
        'Chloe: "So next, you evaluate the output that came back from the AI?"\nMaya: "That\'s right! First, evaluation compares what the AI assistant actually said to what it should have said."\nChloe: "So you\'re checking whether it actually got the answer right?"\nMaya: "And that comparison produces a score. Right now it\'s about as simple as it gets — a flat pass or fail."',
      body: (
        <p>
          Evaluation takes each actual output and checks it against its expected answer, using
          a metric to decide how well they match. Here, that means comparing the AI
          assistant&rsquo;s answer to what the docs actually say.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["evaluation"]} />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
            <div className="text-neutral-700">Actual: &ldquo;{PRESET.actual}&rdquo;</div>
            <div className="text-cyan-700 mt-1">Expected: &ldquo;{PRESET.expected}&rdquo;</div>
          </div>
        </div>
      ),
    },
    {
      section: "4. Evaluation & Score",
      title: "From Per-Case Scores to a Run Score",
      story:
        'Chloe: "Like, what about the question from the other day?"\nMaya: "Oh, the worn-item refund question? Run it through the current artifact, and that one comes back a fail."\nChloe: "So the run\'s score is... fail? That doesn\'t sound like a very useful number."\nMaya: "Right, because that\'s just one case\'s score. The run\'s actual score comes from combining all 100 — say, how many passed out of the total."\nChloe: "Ah, so one number for the whole batch."\nMaya: "Exactly — that\'s the number people usually mean when they say \'the score.\'"',
      body: (
        <p>
          Evaluation scores every case individually — this one failed. A run&rsquo;s overall
          score combines every case&rsquo;s result into one number, often the percentage that
          passed. That combined number, not any single case&rsquo;s result, is what people
          usually mean by &ldquo;the score.&rdquo;
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
          <div className="text-red-700">This case: ✗ fail</div>
          <div className="text-neutral-700 mt-1">Combined with the other 99 cases&rsquo; results...</div>
          <div className="text-cyan-700 font-medium mt-1">Run score: 84/100 passed</div>
        </div>
      ),
    },
    {
      section: "4. Evaluation & Score",
      title: "The Score: How Well It Matched",
      story:
        'Chloe: "So if the AI gets it wrong, we\'ll find out right here?"\nMaya: "That mistake is exactly what shows up in the Score — it\'s Evaluation\'s result, output for the artifact."\nChloe: "So this is where we finally find out which model is best, right?"\nMaya: "Not quite. This stage only produces the Score — figuring out which model is best comes later."\nChloe: "Huh? A Score alone doesn\'t decide that?"\nMaya: "Not until you compare Scores across artifacts."',
      body: (
        <p>
          A score is evaluation&rsquo;s output: a number or a pass/fail-style category
          summarizing how well the actual answer matched. Exact match already scores this
          output as a fail — but exact match would flag any differently-worded answer too,
          right or wrong.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["score"]} />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
            <div className="text-red-700">Exact match: ✗ fail</div>
            <div className="text-neutral-400 mt-1">Is that the right metric for a policy question like this? The Metrics chapter covers the fix.</div>
          </div>
        </div>
      ),
    },
    {
      section: "5. Comparison",
      title: "Comparison: One Run Isn't Enough on Its Own",
      story:
        'Maya: "Suppose our AI assistant got the score 84 out of 100. Is that good or bad?"\nChloe: "Bad... isn\'t it? I mean, it\'s not a perfect score."\nMaya: "Not necessarily. If you always held out for a perfect 100, you\'d never actually ship anything."\nChloe: "Huh? So 84 is fine, then?"\nMaya: "Not exactly \'fine\' — but realistically, there are cases where nothing you do gets you all the way to 100."\nMaya: "The honest answer is: you can\'t judge it from that number alone."',
      body: (
        <p>
          A run&rsquo;s score means little by itself. 84 out of 100 says nothing without
          something to compare it against: an earlier version, a different model, a minimum
          bar the system needs to clear.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["comparison"]} />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
            <div className="text-neutral-700">This run: 84/100 — last week: 91/100</div>
            <div className="text-neutral-400 mt-1">Comparison reveals it got worse.</div>
          </div>
        </div>
      ),
    },
    {
      section: "5. Comparison",
      title: "Three Things to Compare a Score Against",
      story:
        'Chloe: "Wait, then what\'s the point of it?"\nMaya: "It only means something when compared with something."\nChloe: "Huh. Like what, for example?"\nMaya: "For instance, when you change the system prompt."\nChloe: "Oh, so by comparing them, you can tell which prompt was better?"\nMaya: "Right. Another case is when you change the model itself."\nChloe: "Like, training it further with additional data?"\nMaya: "Exactly! There\'s also comparing it against a fixed bar you decided on ahead of time."\nChloe: "I see. So a score like 84 only means something once you compare it to something else."',
      body: (
        <div className="space-y-2">
          <p>A score only means something once you compare it to something else. Three common comparisons:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>A different system prompt</strong> — did the wording change help or hurt?</li>
            <li><strong>A different model</strong> — which model actually scores higher on the same test?</li>
            <li><strong>A minimum bar</strong> — a threshold fixed in advance, like &ldquo;must score at least 90 before shipping.&rdquo;</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1.5">
          <div className="text-neutral-700 font-medium">This run (prompt v2): 84/100</div>
          <div className="text-neutral-500">vs. prompt v1 (91): the older prompt was better</div>
          <div className="text-neutral-500">vs. a different model (92): the other model wins</div>
          <div className="text-neutral-500">vs. the minimum bar (90): fails</div>
        </div>
      ),
    },
    // -------------------- 6. Wrap-up --------------------
    {
      section: "6. Wrap-up",
      title: "What you just learned",
      story:
        'Maya: "That\'s the whole flow of the Evaluation Pipeline. So, how was it?"\nChloe: "Phew, that was a long one."\nMaya: "Good work."\nChloe: "I get the overall flow now, but..."\nChloe: "I still don\'t actually know how evaluation works."\nMaya: "Ah, right — we\'ve been skipping over that part this whole time."\nChloe: "Wait, is that what\'s coming up next?"\nMaya: "Nope. Starting tomorrow."\nChloe: "Ha, of course you\'d say that — you really know how to work a cliffhanger!"',
      body: (
        <div className="space-y-2">
          <p>Evaluation is a pipeline:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>AI artifact</strong> — the specific, reproducible configuration under test.</li>
            <li><strong>Run</strong> — every case in the dataset gets answered.</li>
            <li><strong>Evaluation</strong> — each output is compared against what was expected.</li>
            <li><strong>Score</strong> — the overall result of evaluating an artifact.</li>
            <li><strong>Comparison</strong> — a score only means something next to another one.</li>
          </ul>
        </div>
      ),
      visual: <PipelineDiagram />,
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
            {isLast ? (onAdvanceToNextChapter ? "Continue: Metrics →" : "Finish") : "Next"}
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
