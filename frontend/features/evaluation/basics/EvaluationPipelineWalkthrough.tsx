"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { Term } from "@/components/Term";
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

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  return shared / Math.max(wordsA.size, wordsB.size);
}

/** Module 3 (Evaluation), Unit "Evaluation Basics", Chapter 2 of 3. Picks
 * up right where Chapter 1 left off: we have a dataset containing the
 * worn-item refund bug. This Chapter runs it through the six-stage
 * pipeline (Artifact → Dataset → Run → Evaluation → Score → Comparison)
 * as a general 2026 concept, and ends on a cliffhanger Chapter 3 resolves:
 * which metric actually flags this bug as wrong? */
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
  const [ran, setRan] = useState(false);
  const [evaluated, setEvaluated] = useState(false);
  const reset = () => {
    setRan(false);
    setEvaluated(false);
  };

  const exact = PRESET.actual.trim().toLowerCase() === PRESET.expected.trim().toLowerCase();
  const overlap = wordOverlap(PRESET.actual, PRESET.expected);

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
          <p>We already have a dataset with the bug in it. This chapter runs it, stage by stage:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Six Stages</strong> — Artifact, Dataset, Run, Evaluation, Score, Comparison.</li>
            <li><strong>Why the Pipeline, Not Just a Metric</strong> — a dataset alone, or a metric alone, isn&rsquo;t evaluation.</li>
            <li><strong>Try It Yourself</strong> — run the bug&rsquo;s test case through the whole pipeline.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture",
      story:
        'Priya: "Okay, we have a dataset with the bug in it. Let\'s find out if running it actually catches anything."\nMaya: "Through what, exactly?"\nPriya: "The evaluation pipeline — six stages, start to finish."',
      body: (
        <p>
          Evaluation is a pipeline, not a single step: the <Term id="ai-artifact">AI artifact</Term>{" "}
          answers every question in the dataset, those outputs get scored, and the score only
          means something once it&rsquo;s compared against something else. Skip a stage and the
          worn-item bug could still slip through unnoticed.
        </p>
      ),
      visual: <PipelineDiagram />,
    },
    // -------------------- 1. The Six Stages --------------------
    {
      section: "1. The Six Stages",
      title: "An AI Artifact Is What You're Testing",
      story:
        'Maya: "So what exactly is being tested here — the AI assistant itself?"\nPriya: "Sort of. One specific, saved version of it: the model, the prompt, the docs it\'s allowed to use. A saved bundle like that is called an AI artifact."',
      body: (
        <div className="space-y-2">
          <p>
            In simple terms, an AI artifact is whatever single, specific configuration is
            saved and version-tracked as the thing under test.
          </p>
          <p>
            It can be a prompt, a RAG setup, an agent, a model choice — any of these, not
            just one type. Evaluation always measures one specific, reproducible AI
            artifact, so a later score can be traced back to exactly what produced it.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["artifact"]} />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto text-cyan-700">
            AI artifact: Southwear&rsquo;s AI support assistant — 1 model, 1 system prompt, the return-policy docs.
          </div>
        </div>
      ),
    },
    {
      section: "1. The Six Stages",
      title: "A Dataset Gives It Something to Answer",
      story:
        'Priya: "Next, the AI artifact needs something to answer."\nMaya: "That\'s the dataset from before — the one with the bug\'s test case in it?"\nPriya: "That one exactly."',
      body: (
        <p>
          Next, the dataset supplies the questions the AI artifact will answer, along with the
          expected answer for each one — including the test case built from the bug that went
          live.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["dataset"]} />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-neutral-700">Question: &ldquo;{PRESET.question}&rdquo;</div>
            <div className="text-cyan-700 mt-1">Expected: &ldquo;{PRESET.expected}&rdquo;</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. The Six Stages",
      title: "A Run Produces Outputs, Nothing Else Yet",
      story:
        'Maya: "So we just... ask the AI assistant the question and see what it says?"\nPriya: "That\'s a run. Nothing\'s graded yet — we\'re only collecting what it actually said."',
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
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-neutral-700">Output: &ldquo;{PRESET.actual}&rdquo;</div>
            <div className="text-neutral-400 mt-1">(the bug — not judged yet)</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. The Six Stages",
      title: "Evaluation Compares the Output",
      story:
        'Maya: "So does the pipeline catch it here?"\nPriya: "Almost — first, evaluation compares what the AI assistant said to what it should have said."',
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
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-neutral-700">Actual: &ldquo;{PRESET.actual}&rdquo;</div>
            <div className="text-cyan-700 mt-1">Expected: &ldquo;{PRESET.expected}&rdquo;</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. The Six Stages",
      title: "The Score: How Well It Matched",
      story:
        'Priya: "And that comparison produces a score. Right now, it\'s a flat pass or fail."\nMaya: "And this one fails."',
      body: (
        <p>
          A score is evaluation&rsquo;s output: a number or label summarizing how well the
          actual answer matched. Exact match already scores this output as a fail — but exact
          match would flag any differently-worded answer too, right or wrong.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["score"]} />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-red-700">Exact match: ✗ fail</div>
            <div className="text-neutral-400 mt-1">Is that the right metric for a policy question like this? The Metrics chapter covers the fix.</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. The Six Stages",
      title: "Comparison: One Run Isn't Enough on Its Own",
      story:
        'Priya: "Run every case in the dataset, not just this one, and average the scores — now you get one overall number for the whole run."\nMaya: "Say, 84 out of 100. Is that good?"\nPriya: "No idea yet — on its own, a score doesn\'t mean anything."',
      body: (
        <div className="space-y-2">
          <p>
            A run&rsquo;s overall score summarizes every test case in the dataset, not just
            this one bug.
          </p>
          <p>
            But even that single number says little by itself. 84 out of 100 means nothing
            without something to compare it against: an earlier version, a different model, a
            minimum bar the system needs to clear.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram highlight={["comparison"]} />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto">
            <div className="text-neutral-700">This run: 84/100 — last week: 91/100</div>
            <div className="text-neutral-400 mt-1">Comparison reveals it got worse.</div>
          </div>
        </div>
      ),
    },
    // -------------------- 2. Why the Pipeline, Not Just a Metric --------------------
    {
      section: "2. Why the Pipeline, Not Just a Metric",
      title: "Why You Need All Three",
      story:
        'Priya: "Take away any one piece and this whole thing falls apart."\nMaya: "Show me."',
      body: (
        <p>
          Without a dataset containing this exact case, without a run to produce the wrong
          answer, and without evaluation to actually check it, this bug goes live unnoticed —
          exactly what happened the first time.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <PipelineDiagram />
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm max-w-sm mx-auto space-y-1 text-neutral-700">
            <div>No dataset: the return-policy docs alone aren&rsquo;t test cases.</div>
            <div>No run: nothing to score.</div>
            <div>No evaluation: a wrong answer never gets flagged.</div>
          </div>
        </div>
      ),
    },
    // -------------------- 3. Try It Yourself --------------------
    {
      section: "3. Try It Yourself",
      title: "Try it yourself: run the bug through the pipeline",
      story: 'Priya: "See it end to end — run the case, then evaluate what comes back."',
      body: (
        <p>
          Here is the bug&rsquo;s test case. Click Run to see what the AI assistant actually
          answered, then click Evaluate to score that output against the expected answer.
        </p>
      ),
      controls: (
        <div className="w-full space-y-2">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm">
            <div className="text-neutral-500">Question</div>
            <div className="text-neutral-800">{PRESET.question}</div>
            <div className="text-neutral-500 mt-1.5">Expected answer</div>
            <div className="text-cyan-700">{PRESET.expected}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRan(true)} disabled={ran} className={`${nextBtn} disabled:opacity-40`}>
              Run
            </button>
            <button onClick={() => setEvaluated(true)} disabled={!ran || evaluated} className={`${nextBtn} disabled:opacity-40`}>
              Evaluate
            </button>
          </div>
        </div>
      ),
      resetAction: reset,
      visual: (
        <div className="space-y-2">
          {ran && (
            <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm">
              <div className="text-neutral-500">Actual output</div>
              <div className="text-neutral-800">{PRESET.actual}</div>
            </div>
          )}
          {evaluated && (
            <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Exact match</span>
                <span className={exact ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>{exact ? "✓ true" : "✗ false"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Word overlap</span>
                <span className="text-cyan-700 font-medium">{Math.round(overlap * 100)}%</span>
              </div>
            </div>
          )}
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
            <li>Evaluation is a pipeline: Artifact → Dataset → Run → Evaluation → Score → Comparison.</li>
            <li>An AI artifact is the specific, reproducible configuration under test.</li>
            <li>A run only collects outputs — nothing is judged until evaluation.</li>
            <li>Evaluation compares each output against what was expected; the score is the result.</li>
            <li>A score means little without a comparison to judge it against.</li>
            <li>Exact match flagged this bug — but it would flag any differently-worded answer too.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Wrap-up",
      title: "Next: Which Metric Actually Catches It?",
      story:
        'Priya: "Exact match caught it, but only because the wording was way off."\nMaya: "What if someone writes a wrong answer that sounds a lot more like the real one?"\nPriya: "Then we need a smarter metric. Let\'s go find it."',
      body: (
        <p>
          Everything above is also unlocked below if you want to run your own test case. The
          pipeline ran. Exact match flagged the bug, but it would flag a correct paraphrase too
          — not a targeted signal. Which metric actually would have caught this, and only this?
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
            {isLast ? (onAdvanceToNextChapter ? "Continue: Metrics →" : "Finish") : "Next"}
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
