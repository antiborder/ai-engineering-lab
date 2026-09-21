"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";

// Same three versions Experiment Tracking used (quality 88/84/80) — reused
// here as the candidates a threshold gate decides on, not recomputed.
const VERSIONS = [
  { label: "v1", quality: 88 },
  { label: "v2", quality: 84 },
  { label: "v3", quality: 80 },
] as const;
type VersionLabel = (typeof VERSIONS)[number]["label"];

/** Module 5 (LLMOps), Unit "CI/CD & Deployment", Chapter 2 of 2 —
 * Pipeline & Deployment. Split out from Containers after a user question:
 * packaging (a format/technology topic) and this Chapter's workflow
 * (test → gate → promote) share only one connecting thread — the
 * pipeline's Deploy step happens to use a container — not enough to
 * justify keeping them in one Chapter.
 *
 * Self-contained by the same standard the rest of this module follows.
 * Reuses Experiment Tracking's v1/v2/v3 quality scores (88/84/80) as the
 * candidates a threshold gate decides on, giving that chapter's example
 * real downstream payoff instead of a fresh, disconnected number. */
export function PipelineWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const [threshold, setThreshold] = useState(82);
  const [selectedVersion, setSelectedVersion] = useState<VersionLabel>("v2");
  const resetGate = () => {
    setThreshold(82);
    setSelectedVersion("v2");
  };

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const chosen = VERSIONS.find((v) => v.label === selectedVersion)!;
  const passes = chosen.quality >= threshold;

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>A version is packaged into an image. This chapter covers what happens next.</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Pipeline</strong> — testing and gating a version automatically, every time.</li>
            <li><strong>Environment Promotion</strong> — moving one exact version through Development, Staging, and Production.</li>
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
          Getting a packaged version in front of real users takes two more things: checking
          automatically that it still works before anyone sees it, and rolling it out gradually
          instead of all at once.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Packaged image</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Test &amp; Gate</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Promote</div>
        </div>
      ),
    },
    // -------------------- 1. The Pipeline --------------------
    {
      section: "1. The Pipeline",
      title: "Why Automate the Path to Production",
      body: (
        <p>
          Releasing a new version by hand means someone has to remember every check, every time.
          Under time pressure, it&rsquo;s easy to skip one. An automated pipeline runs the exact
          same checks on
          every single change, with no step ever skipped by accident.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "1. The Pipeline",
      title: "Five Stages, One After Another",
      body: (
        <p>
          A common pipeline runs a fixed sequence. <strong>Code</strong> is changed,{" "}
          <strong>Test</strong> checks it still runs correctly, and <strong>Evaluate</strong>
          scores
          its output quality. A <strong>Threshold</strong> check decides pass or fail, and only a
          pass reaches <strong>Deploy</strong>.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-center text-sm flex-wrap">
          {["Code", "Test", "Evaluate", "Threshold?", "Deploy"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5">{s}</span>
              {i < arr.length - 1 && <span className="text-neutral-400">→</span>}
            </span>
          ))}
        </div>
      ),
    },
    {
      section: "1. The Pipeline",
      title: "Code and Test: Does It Still Run?",
      body: (
        <p>
          Test checks the basics: does the code run without crashing, do known inputs still
          produce the expected structure of output. This step catches broken code, but says
          nothing about whether the AI system&rsquo;s answers are actually good.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "1. The Pipeline",
      title: "Evaluate: Is the Output Actually Good?",
      body: (
        <p>
          Evaluate is the step specific to AI systems. Run the new version against a set of test
          questions with known good answers, and score how well it does. That&rsquo;s a single
          number
          summarizing output quality, not just whether the code runs.
        </p>
      ),
      visual: <StatCard label="Evaluate" value="a quality score, out of 100" />,
    },
    {
      section: "1. The Pipeline",
      title: "Threshold? The Gate That Decides",
      body: (
        <p>
          The threshold is the minimum score a version must clear to be trusted in production. At
          or above it, the pipeline continues to Deploy automatically. Below it, the pipeline
          stops — the version is fixed and resubmitted, not shipped as-is.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "1. The Pipeline",
      title: "Try it yourself: does this version clear the gate?",
      body: (
        <p>
          Pick a version and a threshold, and watch the pipeline decide. This is the exact same
          gate every version passes through, whether it clears the bar or not.
        </p>
      ),
      controls: (
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            {VERSIONS.map((v) => (
              <button
                key={v.label}
                onClick={() => setSelectedVersion(v.label)}
                className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                  selectedVersion === v.label
                    ? "bg-cyan-600 border-cyan-600 text-white"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {v.label} ({v.quality}/100)
              </button>
            ))}
          </div>
          <label className="block text-base w-full">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Threshold</span>
              <span className="text-neutral-800 tabular-nums">{threshold}/100</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetGate,
      visual: (
        <div className="flex items-center justify-center gap-2 text-base flex-wrap">
          <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">
            {selectedVersion}: {chosen.quality}/100
          </span>
          <span className="text-neutral-300">vs.</span>
          <span className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">
            Threshold: {threshold}
          </span>
          <span className="text-neutral-300">→</span>
          <span
            className={`px-3 py-1.5 rounded-full border ${
              passes ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {passes ? "Pass — deploys" : "Fail — stops here"}
          </span>
        </div>
      ),
    },
    // -------------------- 2. Environment Promotion --------------------
    {
      section: "2. Environment Promotion",
      title: "Development, Staging, Production",
      body: (
        <p>
          A version that passes the gate does not go straight to every user. It moves through
          environments: <strong>Development</strong> (where changes are made and tested loosely),{" "}
          <strong>Staging</strong> (a copy of production, for a final realistic check), then{" "}
          <strong>Production</strong> (real users, real traffic).
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-center text-sm flex-wrap">
          {["Development", "Staging", "Production"].map((s, i, arr) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5">{s}</span>
              {i < arr.length - 1 && <span className="text-neutral-400">→</span>}
            </span>
          ))}
        </div>
      ),
    },
    {
      section: "2. Environment Promotion",
      title: "A Deployment Points to One Exact Version",
      body: (
        <p>
          &ldquo;Deploy the latest code&rdquo; is not specific enough. A deployment has to
          reference one exact, named version. That&rsquo;s the same kind of version this
          module&rsquo;s
          Experiment Tracking chapter tracks. That is what makes a rollback possible later: there
          is always a specific earlier version to go back to.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Environment Promotion",
      title: "The Same Image, Promoted Forward",
      body: (
        <p>
          The container image built in the previous chapter is the version that passed the
          threshold gate. That exact same image moves through Staging and into Production — not
          rebuilt at each stage. Promotion moves one tested artifact forward; it does not
          rebuild it along the way.
        </p>
      ),
      visual: undefined,
    },
    // -------------------- 3. Wrap-up --------------------
    {
      section: "3. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A pipeline runs Code → Test → Evaluate → Threshold → Deploy automatically, the same way every time.</li>
            <li>A threshold gate stops a version that scores too low from ever reaching production.</li>
            <li>A deployment always references one exact version, promoted unchanged through Development, Staging, and Production.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "3. Wrap-up",
      title: "Closing: The Rest of This Module",
      body: (
        <div className="space-y-2">
          <p>
            A version is now live in production. Monitoring &amp; Observability — watching it run,
            tracing individual requests, and tracking cost — is next.
          </p>
          <Link
            href="/llmops"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Back to LLMOps overview →
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
          <button
            onClick={goBack}
            disabled={isFirst}
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
