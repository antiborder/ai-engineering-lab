"use client";

import { useState, type ReactNode } from "react";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";

// Grounded in this app's own real target infrastructure (spec.txt sections
// 34/36/37: Cloud Run, Firestore, Cloud Storage, Artifact Registry, IAM),
// not an invented generic cloud example. The running scenario is this
// app's own backend Cloud Run service, threaded through every Section the
// same way Evaluation Basics threads one refund-policy bug through its
// own three metric Sections.
const CANONICAL_CONFIG = { region: "us-central1", memory: "512Mi" };

const MEMORY_OPTIONS = ["256Mi", "512Mi", "1Gi", "2Gi"] as const;
const REGION_OPTIONS = ["us-central1", "us-east1", "europe-west1"] as const;

// Ranked by real-world usage/mindshare as of September 2026, not
// alphabetically — Terraform is not the only IaC tool, just the one the
// next chapter picks as its representative example. OpenTofu is the
// open-source fork created after HashiCorp's 2023 license change; the two
// still share HCL syntax but have functionally diverged since.
const IAC_TOOLS_RANKING = [
  { rank: 1, name: "Terraform", note: "The long-standing leader — next chapter's own tool." },
  { rank: 2, name: "OpenTofu", note: "An open-source fork of Terraform, created in 2023." },
  { rank: 3, name: "AWS CloudFormation", note: "AWS's own native tool, tightly built into AWS." },
  { rank: 4, name: "Pulumi", note: "Writes infrastructure in real languages: Python, TypeScript, Go." },
  { rank: 5, name: "Azure Resource Manager / Bicep", note: "Azure's own native equivalent." },
  { rank: 6, name: "Google Cloud Deployment Manager", note: "GCP's native tool — this app uses Terraform instead." },
  { rank: 7, name: "Crossplane", note: "Declares infrastructure as Kubernetes resources." },
] as const;

/** Module 6 (IaC), Unit "What Infrastructure as Code Is" — the module's
 * first Unit, and the conceptual foundation the later Terraform-specific
 * Unit builds on. No tool-specific syntax appears here on purpose (see
 * module-6-iac.md) — Terraform's own Unit is where HCL, `plan`/`apply`,
 * and state get introduced.
 *
 * Built to match Evaluation Basics' care level per explicit user
 * instruction: one concrete scenario (this app's own backend Cloud Run
 * service) threaded through every Section, each concept given its own
 * Step, and genuine interactivity rather than static StatCard readouts
 * alone. Self-contained — assumes no other Module was read, including
 * Module 5's Containers/CI&CD content, which this Unit never depends on
 * even though the two are adjacent in spirit. */
export function WhatIsIacWalkthrough({
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

  // -------------------- Try it yourself: three engineers, one console --------------------
  const [clickOpsRuns, setClickOpsRuns] = useState<{ region: string; memory: string }[]>([]);
  const provisionManually = () => {
    setClickOpsRuns((runs) => [
      ...runs,
      {
        region: REGION_OPTIONS[Math.floor(Math.random() * REGION_OPTIONS.length)],
        memory: MEMORY_OPTIONS[Math.floor(Math.random() * MEMORY_OPTIONS.length)],
      },
    ]);
  };
  const resetClickOps = () => setClickOpsRuns([]);

  // -------------------- Try it yourself: declarative vs. imperative --------------------
  const [declarativeCount, setDeclarativeCount] = useState(7);
  const [imperativeCount, setImperativeCount] = useState(1);
  const applyDeclarative = () => setDeclarativeCount(3);
  const runImperativeScript = () => setImperativeCount((c) => c + 2);
  const resetCounts = () => {
    setDeclarativeCount(7);
    setImperativeCount(1);
  };

  // -------------------- Try it yourself: does this match what's declared? --------------------
  const [actualMemory, setActualMemory] = useState(CANONICAL_CONFIG.memory);
  const [checked, setChecked] = useState(false);
  const causeDrift = () => {
    setActualMemory("2Gi");
    setChecked(false);
  };
  const resetDrift = () => {
    setActualMemory(CANONICAL_CONFIG.memory);
    setChecked(false);
  };

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            Every app in this lab needs somewhere to actually run — a server, a database, a place
            to store files. This chapter is about how that underlying infrastructure gets set up.
            It also explains why most teams do it with code instead of by hand.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Manual vs. Code</strong> — clicking through a cloud console vs. writing the setup down.</li>
            <li><strong>Declarative vs. Imperative</strong> — describing the end state you want vs. listing steps to run.</li>
            <li><strong>Drift and Safety</strong> — what happens when reality stops matching the code, and how to catch it before it causes damage.</li>
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
          This app&rsquo;s own backend needs to run somewhere in the cloud. One engineer sets it
          up by clicking through the cloud provider&rsquo;s console. Another writes the exact same
          setup down as a file instead. Both end up with a running service. But only one of them
          can tell you, a year later, exactly what is running and why.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Click through a console</div>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Write it down as code</div>
        </div>
      ),
    },
    // -------------------- 1. Manual Infrastructure vs. Infrastructure as Code --------------------
    {
      section: "1. Manual vs. Code",
      title: "What \"Infrastructure\" Means Here",
      body: (
        <div className="space-y-2">
          <p>
            This app&rsquo;s backend needs a small set of cloud resources to actually run:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A place to run the server itself (a managed container service).</li>
            <li>A database to store data in.</li>
            <li>A place to store files (models, uploads).</li>
            <li>A place to store built container images.</li>
            <li>Permissions controlling which of these can talk to which.</li>
          </ul>
          <p>
            Every one of these has to be created and configured before any code can actually run.
            <strong> Infrastructure</strong> is that underlying set of resources — not the app
            itself, but everywhere it lives.
          </p>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "1. Manual vs. Code",
      title: "Manual Infrastructure: Clicking Through a Console",
      body: (
        <p>
          It is 2 a.m. The backend service is crashing under load — it does not have enough
          memory. An engineer logs into the cloud provider&rsquo;s web console and finds the
          service. Then the engineer bumps its memory from 512Mi to 1Gi by hand. The crash stops.
          The incident is over.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <StatCard label="Before" value="512Mi" />
          <span className="text-neutral-400">→</span>
          <StatCard label="After (clicked in the console)" value="1Gi" tone="warn" />
        </div>
      ),
    },
    {
      section: "1. Manual vs. Code",
      title: "What Went Wrong, Precisely",
      body: (
        <div className="space-y-2">
          <p>Three weeks later, the same crash happens again. Nobody can immediately say why:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>There is no record that the memory was ever changed, or by whom.</li>
            <li>Nobody reviewed the change before it happened — there was no time to, at 2 a.m.</li>
            <li>
              A teammate redeployed &ldquo;the official setup&rdquo; from their own notes, which
              still said 512Mi — silently undoing the fix.
            </li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "1. Manual vs. Code",
      title: "Infrastructure as Code: The Same Setup, Written Down",
      body: (
        <p>
          <strong>Infrastructure as Code</strong> means describing infrastructure in a file,
          instead of clicking buttons. Here is the same 2 a.m. fix, but written down where
          everyone can see it:
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-base text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {"backend_service:\n  region: us-central1\n  memory: 1Gi   # bumped 2026-09-19, fixed the load crash"}
        </pre>
      ),
    },
    {
      section: "1. Manual vs. Code",
      title: "Why Writing It Down Changes Everything",
      body: (
        <div className="space-y-2">
          <p>The same fix, written as a file instead of clicked into a console, is:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Reviewable</strong> — a teammate can look at the change before it happens, not discover it by accident later.</li>
            <li><strong>Recorded</strong> — the file itself says what changed, when, and (with a commit message) why.</li>
            <li><strong>Reproducible</strong> — anyone who reads the file gets the exact same setup, not their best guess at it.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "1. Manual vs. Code",
      title: "Try it yourself: three engineers, one console",
      body: (
        <p>
          Have three different engineers set up the same service by clicking through a console,
          from memory. They should have no file to copy from. Then compare that to applying the
          one file everyone shares.
        </p>
      ),
      controls: (
        <button onClick={provisionManually} className={nextBtn}>
          Have an engineer set it up manually
        </button>
      ),
      resetAction: resetClickOps,
      visual: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {clickOpsRuns.map((run, i) => (
              <StatCard
                key={i}
                label={`Engineer ${i + 1}, by hand`}
                value={`${run.region}, ${run.memory}`}
                tone={run.region === CANONICAL_CONFIG.region && run.memory === CANONICAL_CONFIG.memory ? "good" : "warn"}
              />
            ))}
          </div>
          <StatCard label="From the shared file, every time" value={`${CANONICAL_CONFIG.region}, ${CANONICAL_CONFIG.memory}`} tone="good" />
        </div>
      ),
    },
    // -------------------- 2. Declarative vs. Imperative --------------------
    {
      section: "2. Declarative vs. Imperative",
      title: "Two Ways to Describe a Change",
      body: (
        <div className="space-y-2">
          <p>There are two different ways to tell a system what you want:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Imperative</strong> — a list of steps to run, in order: &ldquo;add 2 more instances.&rdquo;</li>
            <li><strong>Declarative</strong> — the end state you want, full stop: &ldquo;there should be 3 instances.&rdquo;</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "2. Declarative vs. Imperative",
      title: "Why IaC Tools Are Declarative",
      body: (
        <p>
          An imperative instruction only makes sense if you know the starting point.
          &ldquo;Add 2&rdquo; means something different starting from 1 instance than starting
          from 8. A declarative tool skips that problem entirely. It looks at what actually exists
          and compares it to what the file says should exist. Then it only changes what is
          different.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Declarative vs. Imperative",
      title: "Idempotency: Running It Twice Changes Nothing",
      body: (
        <p>
          <strong>Idempotent</strong> means applying the same instruction twice produces the same
          result as applying it once. A declarative file that says &ldquo;3 instances&rdquo; is
          idempotent: apply it once, get 3. Apply it again, and it&rsquo;s still 3 — nothing
          happens. An imperative script that says &ldquo;add 2 instances&rdquo; is not: run it
          twice and now there are 5, not 3.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Declarative vs. Imperative",
      title: "Why This Matters for a Team",
      body: (
        <p>
          Two engineers can run the same declarative file on the same day, from different
          starting points. Both end up at the exact same result. Two engineers running the same
          imperative script depend on both of them already agreeing on the starting point. That
          assumption quietly breaks the moment reality diverges from what they each expect.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Declarative vs. Imperative",
      title: "Try it yourself: declarative vs. imperative",
      body: (
        <p>
          Start from an arbitrary instance count. Apply the declarative file (&ldquo;instances:
          3&rdquo;) as many times as you like. Then try the imperative script (&ldquo;add
          2&rdquo;) the same number of times.
        </p>
      ),
      controls: (
        <div className="flex gap-2 flex-wrap">
          <button onClick={applyDeclarative} className={nextBtn}>
            Apply declarative file (instances: 3)
          </button>
          <button onClick={runImperativeScript} className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-base font-medium text-white">
            Run imperative script (add 2)
          </button>
        </div>
      ),
      resetAction: resetCounts,
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Declarative result" value={`${declarativeCount} instances`} tone="good" note="always converges to 3" />
          <StatCard label="Imperative result" value={`${imperativeCount} instances`} tone={imperativeCount > 3 ? "warn" : "default"} note="grows every time it runs" />
        </div>
      ),
    },
    // -------------------- 3. Drift and Safety --------------------
    {
      section: "3. Drift and Safety",
      title: "Drift: When Reality Stops Matching the Code",
      body: (
        <p>
          <strong>Drift</strong> is what happens when the actual, running infrastructure no
          longer matches what the code says it should be. This usually happens because someone
          made a manual change directly. That&rsquo;s the same 2 a.m.-console habit this Section
          started with, bypassing the file entirely.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "3. Drift and Safety",
      title: "How Drift Gets Caught",
      body: (
        <p>
          An IaC tool can compare what the file declares against what is actually running right
          now. It can show the difference before changing anything. That&rsquo;s the same idea as
          a code diff, applied to real infrastructure instead of source files.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "3. Drift and Safety",
      title: "Plan Before You Apply",
      body: (
        <p>
          Because a declarative tool always knows exactly what would change, it can show that
          preview. That preview is called a <strong>plan</strong>, shown before actually making
          the change. Reading the plan first turns &ldquo;I think this is safe&rdquo; into
          &ldquo;I can see exactly what this will do.&rdquo; That means you know what will happen
          before it happens, not after.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "3. Drift and Safety",
      title: "Try it yourself: does this match what's declared?",
      body: (
        <p>
          The file still declares 512Mi. Simulate someone changing the actual, running service by
          hand, then check for drift.
        </p>
      ),
      controls: (
        <div className="flex gap-2 flex-wrap">
          <button onClick={causeDrift} className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-base font-medium text-white">
            Someone changes it by hand
          </button>
          <button onClick={() => setChecked(true)} className={nextBtn}>
            Check for drift
          </button>
        </div>
      ),
      resetAction: resetDrift,
      visual: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Declared in the file" value={CANONICAL_CONFIG.memory} />
            <StatCard label="Actually running" value={actualMemory} tone={actualMemory !== CANONICAL_CONFIG.memory ? "warn" : "default"} />
          </div>
          {checked && (
            <StatCard
              label="Drift check"
              value={actualMemory === CANONICAL_CONFIG.memory ? "No drift" : "Drift detected"}
              tone={actualMemory === CANONICAL_CONFIG.memory ? "good" : "warn"}
              note={actualMemory === CANONICAL_CONFIG.memory ? undefined : `Declared ${CANONICAL_CONFIG.memory}, actually ${actualMemory}`}
            />
          )}
        </div>
      ),
    },
    // -------------------- Wrap-up --------------------
    {
      section: "4. Wrap-up",
      title: "Major IaC Tools",
      body: (
        <div className="space-y-2">
          <p>
            Every major cloud provider, and several independent projects, offers its own
            Infrastructure as Code tool. None of them work identically, but they all follow the
            same core idea this chapter just covered.
          </p>
          <p>Here are some of the best-known ones, as of 2026:</p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-md border border-neutral-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50">
                  <th className="py-1.5 px-3 font-medium w-10">#</th>
                  <th className="py-1.5 px-3 font-medium">Tool</th>
                  <th className="py-1.5 px-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody className="text-neutral-800">
                {IAC_TOOLS_RANKING.map((t) => (
                  <tr key={t.name} className="border-t border-neutral-200">
                    <td className="py-1.5 px-3 font-medium">{t.rank}</td>
                    <td className="py-1.5 px-3 font-medium">{t.name}</td>
                    <td className="py-1.5 px-3">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-neutral-500">
            Ranked by real-world usage as of 2026 — not a technical spec, and rankings shift over
            time.
          </p>
        </div>
      ),
    },
    {
      section: "4. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Infrastructure as Code means writing infrastructure down as a file instead of clicking it into existence.</li>
            <li>A written file is reviewable, recorded, and reproducible — a console click is none of those.</li>
            <li>Declarative tools describe the end state you want; applying the same file twice changes nothing (idempotency).</li>
            <li>Drift is reality no longer matching the file, usually from a manual change made outside it.</li>
            <li>A plan previews exactly what would change, before anything actually changes.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Wrap-up",
      title: "Closing: One Specific Tool, Next",
      body: (
        <p>
          This chapter covered declaring state, checking for drift, and previewing a plan. A real
          tool called <strong>Terraform</strong> does exactly that, using its own file format and
          its own commands. The next chapter is that same backend Cloud Run service, written as an
          actual Terraform file.
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
