"use client";

import { useState, type ReactNode } from "react";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { Equation } from "@/components/Equation";

// v1/v2/v3 are Experiment Tracking's exact versions, reused verbatim
// (quality 88/84/80, latency 900/650/300ms, cost $0.004/$0.002/$0.0009).
// v2 is the version Monitoring & Observability showed live in
// Production, with a sampled live score of 82/100 — that exact number
// is this chapter's "last known-good" baseline. v4 is new here: a
// change shipped to cut cost further, which barely clears the deploy
// gate (83, just above the 82 threshold CI/CD & Deployment used) but
// collapses once exposed to real traffic — the live-score gap Monitoring
// already warned about ("real traffic is never quite the same mix of
// questions as the fixed evaluation set that approved it"), taken to
// its full, serious consequence.
const V4 = { label: "v4", quality: 83, liveScore: 58, latencyMs: 600, cost: 0.0015 };
const V5_FIX = { label: "v5 (fix attempt)", liveScore: 83 };
const THRESHOLD = 82;

type CandidateLabel = "v4" | "v5 (fix attempt)";
const CANDIDATES: { label: CandidateLabel; liveScore: number }[] = [
  { label: "v4", liveScore: V4.liveScore },
  { label: "v5 (fix attempt)", liveScore: V5_FIX.liveScore },
];

/** Module 5 (LLMOps), Unit "Regression & Rollback" — the module's fourth
 * and last Unit (spec 28 + 29). Single-Chapter, no tab-switcher, per this
 * Unit's own plan in module-5-llmops.md.
 *
 * Built to match Evaluation Basics' care level (per explicit user
 * instruction), continuing the same one-scenario-per-chapter approach
 * Monitoring & Observability used: v2 (live, 82/100 sampled score) is
 * the last known-good baseline; v4 (shipped to cut cost) barely passes
 * the deploy gate but collapses to 58/100 once real traffic hits it —
 * directly paying off the gap Monitoring & Observability's "A Live
 * Evaluation Score" Step already flagged between a fixed evaluation set
 * and real traffic. Detection compares v4 against v2's own baseline (not
 * against zero); Rollback repoints Production back to v2 without
 * rebuilding anything, mirroring CI/CD & Deployment's "The Same Image,
 * Promoted Forward" Step in reverse.
 *
 * Self-contained: every reused number (v1/v2/v3's stats, v2's 82 live
 * score, the 82 threshold) is restated here rather than assumed, with
 * only a light, optional pointer back to the Units that established it —
 * matching Experiment Tracking's and Monitoring & Observability's own
 * established practice for cross-Unit references. */
export function RegressionRollbackWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  // -------------------- Try it yourself: does this version regress? --------------------
  const [candidate, setCandidate] = useState<CandidateLabel>("v4");
  const [regressionThreshold, setRegressionThreshold] = useState(THRESHOLD);
  const chosenCandidate = CANDIDATES.find((c) => c.label === candidate)!;
  const isRegression = chosenCandidate.liveScore < regressionThreshold;
  const resetRegressionCheck = () => {
    setCandidate("v4");
    setRegressionThreshold(THRESHOLD);
  };

  // -------------------- Try it yourself: roll back --------------------
  const [rolledBack, setRolledBack] = useState(false);

  const flowDiagram = (stages: { label: string; tone?: "danger" | "good" }[]) => (
    <div className="flex items-center justify-center gap-1.5 text-center text-sm flex-wrap">
      {stages.map((s, i) => (
        <span key={s.label} className="flex items-center gap-1.5">
          <span
            className={`rounded-md border px-2.5 py-1.5 ${
              s.tone === "danger"
                ? "border-red-300 bg-red-50 text-red-700"
                : s.tone === "good"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-neutral-200 bg-white text-neutral-700"
            }`}
          >
            {s.label}
          </span>
          {i < stages.length - 1 && <span className="text-neutral-400">→</span>}
        </span>
      ))}
    </div>
  );

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            v2 has been live and healthy. This chapter covers what happens when a new version
            makes things worse instead of better. It also covers how to get back to what worked.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Regression Detection</strong> — noticing a new version is actually worse, not better.</li>
            <li><strong>Rollback</strong> — reverting to the last version that worked, without rebuilding it.</li>
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
          A new version, v4, was shipped to cut cost further. It passed the deploy gate. A few
          hours after reaching real users, Monitoring&rsquo;s live score tells a different story
          than the deploy-time check did.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">v4 passes the gate</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">Live score collapses</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Detect, then roll back</div>
        </div>
      ),
    },
    // -------------------- 1. Regression Detection --------------------
    {
      section: "1. Regression Detection",
      title: "What a Regression Is",
      body: (
        <p>
          A <strong>regression</strong> is a new version that performs worse than the version it
          replaced — on quality, latency, or cost. The key word is <em>replaced</em>: a regression
          is judged against what was already working, not against some fixed, absolute bar.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "1. Regression Detection",
      title: "Comparing Against the Right Baseline",
      body: (
        <p>
          v2 is the version already live, with a sampled live score of 82/100 from Monitoring
          &amp; Observability. That number — not zero, not some arbitrary reference point — is
          the baseline every new version gets compared against.
        </p>
      ),
      visual: <StatCard label="v2 — the baseline" value="82/100" note="sampled live score, from Monitoring & Observability" />,
    },
    {
      section: "1. Regression Detection",
      title: "v4 Passed the Gate",
      body: (
        <p>
          v4&rsquo;s deploy-time evaluation scored 83/100 — just above the 82 threshold CI/CD
          &amp; Deployment&rsquo;s pipeline uses. The gate did its job and let it through; nothing
          about the deploy process was skipped or broken.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="v4 — deploy-time score" value="83/100" tone="good" note="clears the 82 threshold" />
          <StatCard label="Threshold" value="82" />
        </div>
      ),
    },
    {
      section: "1. Regression Detection",
      title: "The Reveal: v4's Live Score",
      body: (
        <p>
          A day of real traffic later, Monitoring&rsquo;s continuously re-sampled score for v4
          is 58/100 — 24 points below v2&rsquo;s own 82. The version that passed its gate is
          measurably worse than the version it replaced. That&rsquo;s true once real users are
          actually using it.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          {flowDiagram([
            { label: "v2 (baseline): 82/100" },
            { label: "v4 (new): 58/100", tone: "danger" },
            { label: "Regression", tone: "danger" },
          ])}
        </div>
      ),
    },
    {
      section: "1. Regression Detection",
      title: "Why the Fixed Evaluation Set Missed This",
      body: (
        <p>
          Monitoring &amp; Observability already flagged this gap: a deploy-time score comes from
          a fixed set of test questions. A live score comes from whatever real users actually ask.
          v4&rsquo;s change happened to do fine on that fixed set&rsquo;s particular questions. It
          did badly on a kind of question the fixed set barely covered. That mismatch was invisible
          until real traffic exposed it.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "1. Regression Detection",
      title: "Noise or Real? A Small Dip vs. a Big Drop",
      body: (
        <p>
          A sampled live score moves on its own. Monitoring &amp; Observability&rsquo;s own demo
          traffic jittered it by a few points in either direction on every simulated hour. A real
          regression has to be judged against that normal wobble. A 2-point dip is probably noise;
          v4&rsquo;s 24-point drop, sustained rather than one bad sample, is not.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Typical hour-to-hour wobble" value="± 2-4 points" />
          <StatCard label="v4's actual drop" value="24 points" tone="warn" />
        </div>
      ),
    },
    {
      section: "1. Regression Detection",
      title: "Not Just Quality: Latency and Cost Can Regress Too",
      body: (
        <div className="space-y-2">
          <p>
            The same comparison-against-baseline logic applies to any monitored number, not just
            quality — latency and cost can regress too. A drop is not automatically a rollback.
            It depends on how large the drop is, and whether something else improved enough to be
            worth it.
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>A small, acceptable trade-off:</strong> quality drops a little (88 → 84).
              But latency improves (900ms → 650ms) and cost drops ($0.004 → $0.002). A real
              trade-off, small enough to keep.
            </li>
            <li>
              <strong>v2 → v4, this chapter:</strong> quality drops sharply (82 → 58), with no
              gain elsewhere to justify it. Too large to accept.
            </li>
          </ul>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="A small, acceptable trade-off" value="88 → 84" note="quality drops slightly, latency and cost improve" />
          <StatCard label="v2 → v4 (this chapter)" value="82 → 58" tone="warn" note="too large to accept" />
        </div>
      ),
    },
    {
      section: "1. Regression Detection",
      title: "Try it yourself: does this version regress?",
      body: (
        <p>
          Pick a candidate and a threshold, and see whether it counts as a regression against
          v2&rsquo;s 82 baseline.
        </p>
      ),
      controls: (
        <div className="w-full space-y-3">
          <div className="flex gap-2 flex-wrap">
            {CANDIDATES.map((c) => (
              <button
                key={c.label}
                onClick={() => setCandidate(c.label)}
                className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                  candidate === c.label
                    ? "bg-cyan-600 border-cyan-600 text-white"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {c.label} ({c.liveScore}/100 live)
              </button>
            ))}
          </div>
          <label className="block text-base w-full">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Regression threshold</span>
              <span className="text-neutral-800 tabular-nums">{regressionThreshold}/100</span>
            </div>
            <input
              type="range"
              min={50}
              max={90}
              step={1}
              value={regressionThreshold}
              onChange={(e) => setRegressionThreshold(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetRegressionCheck,
      visual: (
        <div className="space-y-2">
          <Equation tex={"\\text{live score} < \\text{threshold} \\;\\Rightarrow\\; \\text{regression}"} />
          <div className="flex items-center justify-center gap-2 text-base flex-wrap">
            <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">
              {candidate}: {chosenCandidate.liveScore}/100
            </span>
            <span className="text-neutral-300">vs.</span>
            <span className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">
              Threshold: {regressionThreshold}
            </span>
            <span className="text-neutral-300">→</span>
            <span
              className={`px-3 py-1.5 rounded-full border ${
                isRegression ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"
              }`}
            >
              {isRegression ? "Regression — roll back" : "No regression — keep serving"}
            </span>
          </div>
        </div>
      ),
    },
    // -------------------- 2. Rollback --------------------
    {
      section: "2. Rollback",
      title: "Rollback: Reverting, Not Fixing Forward",
      body: (
        <p>
          <strong>Rollback</strong> means pointing Production back at the last version that
          worked — here, v2 — immediately. That happens before anyone tries to diagnose or patch
          v4. Fixing v4 in place can wait. Every minute v4 keeps serving real users is a minute of
          the regression they&rsquo;re actually experiencing.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Rollback",
      title: "Why This Is Possible: The AI Artifact Again",
      body: (
        <p>
          Rollback only works because v2 was never deleted. It is still a saved, version-tracked
          AI Artifact — the same concept Experiment Tracking introduced. It sits exactly as it was
          before v4 shipped. It&rsquo;s ready to serve again the moment Production points at it.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Rollback",
      title: "The Same Image, Pointed Backward",
      body: (
        <div className="space-y-2">
          <p>
            A deployed version is a saved, already-built package (an image) that Production
            points at. Normally that pointer only ever moves forward — a new image replaces the
            old one. Rollback moves it backward instead:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>No new image gets built.</li>
            <li>Nothing gets retested.</li>
            <li>Production&rsquo;s pointer simply switches from v4&rsquo;s image back to v2&rsquo;s, exactly as it was the day it was built.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "2. Rollback",
      title: "Rollback vs. Rebuilding",
      body: (
        <p>
          Rollback is faster and safer than rebuilding v2 from old source code. Getting back to
          v2 by rebuilding looks like the same thing as rollback, but it is not:
        </p>
      ),
      visual: (
        <div className="overflow-x-auto rounded-md border border-neutral-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500 bg-neutral-50">
                <th className="py-1.5 px-3 font-medium" />
                <th className="py-1.5 px-3 font-medium">Rollback</th>
                <th className="py-1.5 px-3 font-medium">Rebuilding from source</th>
              </tr>
            </thead>
            <tbody className="text-neutral-800">
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 px-3 font-medium">Speed</td>
                <td className="py-1.5 px-3 text-emerald-700">Instant — just repoints Production</td>
                <td className="py-1.5 px-3">Slow — a full build, then retesting</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 px-3 font-medium">What actually runs</td>
                <td className="py-1.5 px-3 text-emerald-700">The exact v2 image that already worked</td>
                <td className="py-1.5 px-3">A new image, only similar to the old one</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 px-3 font-medium">Risk</td>
                <td className="py-1.5 px-3 text-emerald-700">None — nothing is rebuilt or changed</td>
                <td className="py-1.5 px-3 text-red-700">Dependencies may have moved on since v2 was built, so the &ldquo;old&rdquo; build can behave differently</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 px-3 font-medium">Confidence</td>
                <td className="py-1.5 px-3 text-emerald-700">High — this exact image already ran successfully</td>
                <td className="py-1.5 px-3">Unproven — it has never actually run in this form</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      section: "2. Rollback",
      title: "What Rollback Does Not Fix",
      body: (
        <div className="space-y-2">
          <p>
            Rolling back restores v2&rsquo;s known-good behavior; it does not explain or repair
            whatever broke in v4. That still has to happen, after the rollback, not instead of it:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li>Find the specific questions or requests v4 answered wrong.</li>
            <li>Add them to the evaluation test set, so this exact failure gets caught automatically next time.</li>
            <li>Diagnose why v4 failed on them — a bad prompt change, a bad model swap, a bad config value.</li>
            <li>Fix the underlying issue in a new version.</li>
            <li>Run that new version through the same deploy gate before shipping it as v5.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "2. Rollback",
      title: "Try it yourself: roll back to the last known-good version",
      body: (
        <p>Roll back Production from v4 to v2, and watch the live score recover.</p>
      ),
      controls: (
        <button onClick={() => setRolledBack((r) => !r)} className={nextBtn}>
          {rolledBack ? "Undo (re-deploy v4)" : "Roll back to v2"}
        </button>
      ),
      visual: (
        <div className="space-y-2">
          {!rolledBack
            ? flowDiagram([
                { label: "v2 (serving)" },
                { label: "v4 (deployed)" },
                { label: "Regression ✗", tone: "danger" },
              ])
            : flowDiagram([
                { label: "v4 (regression ✗)", tone: "danger" },
                { label: "Rollback" },
                { label: "v2 (restored, serving)", tone: "good" },
              ])}
          <StatCard
            label="Production is now serving"
            value={rolledBack ? "v2" : "v4"}
            tone={rolledBack ? "good" : "warn"}
            note={rolledBack ? "Live score back to 82/100" : "Live score at 58/100"}
          />
        </div>
      ),
    },
    // -------------------- 3. Wrap-up --------------------
    {
      section: "3. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A regression is judged against the version it replaced, not against zero.</li>
            <li>A deploy-time score passing the gate does not guarantee the live score will hold up on real traffic.</li>
            <li>A real regression is a sustained drop clearly bigger than normal live-score wobble.</li>
            <li>Rollback repoints Production at the last known-good version&rsquo;s exact image — it does not rebuild or fix anything.</li>
            <li>Rollback stops the immediate damage; the underlying bug still needs a real fix, found through Evaluation.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "3. Wrap-up",
      title: "Closing: Improve, Then Return to Evaluation",
      body: (
        <p>
          v2 is back in Production. v4&rsquo;s regression is now a dataset entry — a question it
          got wrong. That entry is waiting in Evaluation, to be turned into a real fix, tested,
          and shipped as v5. This is the same loop every version in this app has gone through:
          build, evaluate, deploy, monitor, and improve.
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
