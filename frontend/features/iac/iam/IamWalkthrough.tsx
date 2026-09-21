"use client";

import { useState, type ReactNode } from "react";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";

// The six GCP services this app actually touches or could touch, reused
// across both Try-It-Yourself Steps in this chapter: Section 1 shows the
// default service account can reach every one of them; Section 3 shows the
// scoped-down service account can reach only the first three.
const RESOURCES = ["Firestore", "Cloud Storage", "Artifact Registry", "Compute Engine", "BigQuery", "Pub/Sub"] as const;
const SCOPED_ACCESS: readonly string[] = ["Firestore", "Cloud Storage", "Artifact Registry"];

type RoleKey = "editor" | "datastoreUser" | "storageObjectViewer" | "artifactRegistryReader";
const ROLE_INFO: Record<RoleKey, { label: string; scope: string; resources: string[] }> = {
  editor: {
    label: "roles/editor",
    scope: "Thousands of permissions, across nearly every GCP service.",
    resources: ["Firestore", "Cloud Storage", "Artifact Registry", "Compute Engine", "BigQuery", "Pub/Sub"],
  },
  datastoreUser: {
    label: "roles/datastore.user",
    scope: "About a dozen permissions, Firestore only.",
    resources: ["Firestore"],
  },
  storageObjectViewer: {
    label: "roles/storage.objectViewer",
    scope: "A couple of permissions: read objects in Cloud Storage.",
    resources: ["Cloud Storage"],
  },
  artifactRegistryReader: {
    label: "roles/artifactregistry.reader",
    scope: "A couple of permissions: read images from Artifact Registry.",
    resources: ["Artifact Registry"],
  },
};

// GCP, AWS, and Azure model the same four ideas under different names.
// The one real trap: GCP and Azure both use "Role" for a permission
// bundle, while AWS uses "Role" for the identity itself — the same word
// pointing at two different concepts depending on the cloud.
const CLOUD_IAM_TERMS = [
  { concept: "One allowed action", gcp: "Permission", aws: "Action", azure: "Permission (Action)" },
  { concept: "A bundle of permissions", gcp: "Role", aws: "Policy", azure: "Role (Role Definition)" },
  { concept: "Identity for software", gcp: "Service Account", aws: "Role", azure: "Managed Identity" },
  { concept: "Binding the bundle to an identity", gcp: "IAM binding", aws: "Policy attachment", azure: "Role Assignment" },
] as const;

/** Module 6 (IaC), Unit "IAM & Least-Privilege Security" — this module's
 * fourth and last Unit (spec.txt sections 34/36/37/39/44). Picks up the
 * exact thread Unit 3's own closing Step left open ("Every resource in
 * this chapter can still do more than it strictly needs to"): this app's
 * backend Cloud Run service, scoped down from a broad default identity to
 * a dedicated service account holding exactly three roles.
 *
 * Deliberately scoped to the core principle, not enterprise IAM breadth —
 * spec.txt:1759 explicitly warns against "enterprise IAM complexity."
 * Custom roles, org policies, and IAM Conditions are named as existing but
 * not covered; predefined roles are enough for this app's own scenario.
 *
 * Built to match Evaluation Basics' care level per explicit user
 * instruction: 20 Steps across Welcome + 3 Sections + Wrap-up, one
 * concrete scenario threaded throughout, and three genuine interactive
 * Steps (one per Section) rather than static readouts. Self-contained: a
 * reader who skipped Units 1-3 still gets a working definition of every
 * term used here, though the running numbers (this app's own backend
 * service, its six-module infra layout) continue Units 2-3's exact
 * scenario rather than inventing a new one. */
export function IamWalkthrough({
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

  // -------------------- Try it yourself: what can the default service account touch? --------------------
  const [checkedResources, setCheckedResources] = useState<Set<string>>(new Set());
  const toggleChecked = (resource: string) =>
    setCheckedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) next.delete(resource);
      else next.add(resource);
      return next;
    });
  const resetChecked = () => setCheckedResources(new Set());

  // -------------------- Try it yourself: pick a role, see what it grants --------------------
  const [selectedRole, setSelectedRole] = useState<RoleKey>("editor");

  // -------------------- Try it yourself: compare the blast radius --------------------
  const [scoped, setScoped] = useState(false);

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            The previous chapter&rsquo;s backend service could still do more than it strictly
            needs to. This chapter locks that down.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Service Accounts</strong> — the identity software uses, distinct from a human user.</li>
            <li><strong>Roles</strong> — bundles of permissions, from broad to narrow.</li>
            <li><strong>Least Privilege</strong> — scoping a service down to exactly what it needs.</li>
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
          Right now, this app&rsquo;s backend runs as a broad, default identity. That identity
          can touch far more than the backend actually uses. This chapter narrows that down to
          exactly three permissions.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
            Default identity
            <br />
            <span className="text-xs">can touch almost everything</span>
          </div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700">
            Scoped identity
            <br />
            <span className="text-xs">can touch exactly 3 things</span>
          </div>
        </div>
      ),
    },
    // -------------------- 1. Service Accounts --------------------
    {
      section: "1. Service Accounts",
      title: "What a Service Account Is",
      body: (
        <p>
          A <strong>service account</strong> is an identity a program uses, not a person. Every
          request a piece of software makes to a GCP resource happens as some identity. GCP
          checks what that identity is allowed to do.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "1. Service Accounts",
      title: "Every Resource Runs as Someone",
      body: (
        <p>
          This app&rsquo;s backend has no human sitting at a keyboard when it runs. It still
          needs an identity to read Firestore, write to Cloud Storage, or pull its own image.
          That identity is a service account.
        </p>
      ),
      visual: (
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Read Firestore</div>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Write to Cloud Storage</div>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Pull its own image</div>
        </div>
      ),
    },
    {
      section: "1. Service Accounts",
      title: "The Default Service Account: Broad by Default",
      body: (
        <div className="space-y-2">
          <p>
            Every new GCP project creates a <strong>default compute service account</strong>{" "}
            automatically. Anything deployed without specifying one uses it.
          </p>
          <p>
            That default account commonly gets the <strong>Editor</strong> role. Editor can
            create, change, or delete resources across nearly every GCP service in the project.
          </p>
        </div>
      ),
      visual: <StatCard label="Default compute service account" value="roles/editor" tone="warn" note="reaches nearly every service in the project" />,
    },
    {
      section: "1. Service Accounts",
      title: "Try it yourself: what can the default service account touch?",
      body: <p>Click any resource below to check whether the default service account can modify it.</p>,
      controls: (
        <div className="flex gap-2 flex-wrap">
          {RESOURCES.map((r) => (
            <button
              key={r}
              onClick={() => toggleChecked(r)}
              className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                checkedResources.has(r)
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {checkedResources.has(r) ? `✓ ${r}` : r}
            </button>
          ))}
        </div>
      ),
      resetAction: resetChecked,
      visual: (
        <div className="space-y-2">
          {checkedResources.size > 0 && (
            <p className="text-sm text-red-700 text-center">
              Yes — every resource checked so far is included in the Editor role.
            </p>
          )}
          {checkedResources.size === RESOURCES.length && (
            <StatCard label="Default service account" value="Editor" tone="warn" note="reaches all 6 of 6 resources checked" />
          )}
        </div>
      ),
    },
    // -------------------- 2. Roles --------------------
    {
      section: "2. Roles",
      title: "A Permission Is One Allowed Action",
      body: (
        <p>
          A <strong>permission</strong> is one specific allowed action, on one specific resource
          type. For example: read a Firestore document, or create a Cloud Storage bucket.
          Permissions are the smallest building block.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Roles",
      title: "A Role Bundles Many Permissions",
      body: (
        <p>
          A <strong>role</strong> is a named bundle of permissions, granted as one unit. The{" "}
          <strong>Editor</strong> role bundles thousands of permissions across nearly every
          service. A narrower role bundles only a handful, for one service.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "2. Roles",
      title: "Predefined vs. Custom Roles",
      body: (
        <div className="space-y-2">
          <p>
            GCP ships hundreds of <strong>predefined roles</strong> — ready-made bundles for
            common jobs, like <code>roles/datastore.user</code> or{" "}
            <code>roles/storage.objectViewer</code>.
          </p>
          <p>
            A <strong>custom role</strong> lists an exact, hand-picked set of permissions
            instead. This app sticks to predefined roles — they already cover what it needs,
            without extra upkeep.
          </p>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "2. Roles",
      title: "Granting a Role: The IAM Binding",
      body: (
        <p>
          Granting a role means pairing three things: a role, a member (an identity), and where
          it applies. A <strong>google_project_iam_member</strong> resource declares exactly
          that pairing as code.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'resource "google_project_iam_member" "backend_firestore" {\n' +
            "  project = var.project_id\n" +
            '  role    = "roles/datastore.user"\n' +
            '  member  = "serviceAccount:${google_service_account.backend.email}"\n' +
            "}"}
        </pre>
      ),
    },
    {
      section: "2. Roles",
      title: "Try it yourself: pick a role, see what it grants",
      body: <p>Pick a role and see roughly how much access it actually grants.</p>,
      controls: (
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(ROLE_INFO) as RoleKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedRole(key)}
              className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                selectedRole === key
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {ROLE_INFO[key].label}
            </button>
          ))}
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <StatCard
            label={ROLE_INFO[selectedRole].label}
            value={`${ROLE_INFO[selectedRole].resources.length} of ${RESOURCES.length} resources`}
            tone={selectedRole === "editor" ? "warn" : "good"}
            note={ROLE_INFO[selectedRole].scope}
          />
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm">
            {RESOURCES.map((r) => (
              <span
                key={r}
                className={`px-2.5 py-1.5 rounded-full border ${
                  ROLE_INFO[selectedRole].resources.includes(r)
                    ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                    : "border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    // -------------------- 3. Least Privilege --------------------
    {
      section: "3. Least Privilege",
      title: "The Least-Privilege Principle",
      body: (
        <p>
          <strong>Least privilege</strong> means granting exactly the access something needs,
          and nothing more. Not the broadest role that happens to work — the narrowest one that
          still does the job.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "3. Least Privilege",
      title: "What This App's Backend Actually Needs",
      body: (
        <div className="space-y-2">
          <p>Audit what the backend actually does, and grant exactly that:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Read and write conversation and evaluation data — <code>roles/datastore.user</code>.</li>
            <li>Read and write uploaded files and model weights — <code>roles/storage.objectAdmin</code>.</li>
            <li>Pull its own container image on startup — <code>roles/artifactregistry.reader</code>.</li>
          </ul>
          <p>Three roles. Nothing about Compute Engine, BigQuery, or Pub/Sub — this backend never touches them.</p>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "3. Least Privilege",
      title: "A Dedicated Service Account, Scoped Down",
      body: (
        <p>
          Instead of the broad default, this app declares its own{" "}
          <strong>dedicated service account</strong>, then grants it only those three roles.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'resource "google_service_account" "backend" {\n' +
            '  account_id   = "backend-runtime"\n' +
            '  display_name = "Backend Cloud Run service account"\n' +
            "}\n\n" +
            'resource "google_project_iam_member" "backend_firestore" {\n' +
            "  project = var.project_id\n" +
            '  role    = "roles/datastore.user"\n' +
            '  member  = "serviceAccount:${google_service_account.backend.email}"\n' +
            "}\n\n" +
            'resource "google_project_iam_member" "backend_storage" {\n' +
            "  project = var.project_id\n" +
            '  role    = "roles/storage.objectAdmin"\n' +
            '  member  = "serviceAccount:${google_service_account.backend.email}"\n' +
            "}\n\n" +
            'resource "google_project_iam_member" "backend_registry" {\n' +
            "  project = var.project_id\n" +
            '  role    = "roles/artifactregistry.reader"\n' +
            '  member  = "serviceAccount:${google_service_account.backend.email}"\n' +
            "}"}
        </pre>
      ),
    },
    {
      section: "3. Least Privilege",
      title: "Wiring It to Cloud Run",
      body: (
        <div className="space-y-2">
          <p>
            A service account only matters once something actually runs as it. Cloud
            Run&rsquo;s own resource block has a <code>service_account</code> field for exactly
            this.
          </p>
          <p>
            This is the same <code>output</code> pattern Unit 2 introduced. The{" "}
            <code>iam</code> module exports the service account&rsquo;s email, and the{" "}
            <code>cloud-run</code> module reads it.
          </p>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {"# infra/modules/iam/outputs.tf\n" +
            'output "backend_service_account_email" {\n' +
            "  value = google_service_account.backend.email\n" +
            "}\n\n" +
            "# infra/modules/cloud-run/main.tf\n" +
            'resource "google_cloud_run_v2_service" "backend" {\n' +
            "  # ...\n" +
            "  template {\n" +
            "    service_account = module.iam.backend_service_account_email\n" +
            "    containers { ... }\n" +
            "  }\n" +
            "}"}
        </pre>
      ),
    },
    {
      section: "3. Least Privilege",
      title: "Why Scoping Down Matters: The Blast Radius",
      body: (
        <p>
          A service&rsquo;s <strong>blast radius</strong> is everything reachable through its
          identity, if that identity is ever misused. A bug, a leaked key, or a compromised
          dependency can hand an attacker that identity&rsquo;s access. No more, no less.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "3. Least Privilege",
      title: "Try it yourself: compare the blast radius",
      body: <p>Toggle between the default identity and the scoped one, and see what stays reachable.</p>,
      controls: (
        <div className="flex gap-2">
          <button
            onClick={() => setScoped(false)}
            className={`px-3 py-1.5 rounded-md text-base font-medium border ${
              !scoped ? "bg-red-600 border-red-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            Default service account (Editor)
          </button>
          <button
            onClick={() => setScoped(true)}
            className={`px-3 py-1.5 rounded-md text-base font-medium border ${
              scoped ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            Scoped service account (3 roles)
          </button>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RESOURCES.map((r) => {
              const reachable = !scoped || SCOPED_ACCESS.includes(r);
              return (
                <StatCard
                  key={r}
                  label={r}
                  value={reachable ? "Reachable" : "Not reachable"}
                  tone={reachable ? (scoped ? "good" : "warn") : "good"}
                />
              );
            })}
          </div>
        </div>
      ),
    },
    // -------------------- Wrap-up --------------------
    {
      section: "4. Wrap-up",
      title: "Same Ideas, Different Names Across Clouds",
      body: (
        <div className="space-y-2">
          <p>
            This chapter used GCP&rsquo;s own terms throughout. AWS and Azure model the exact
            same ideas, but name them differently.
          </p>
          <p>
            The one trap worth knowing: GCP and Azure both use <strong>Role</strong> for a
            bundle of permissions. AWS uses <strong>Role</strong> for the identity itself
            instead.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-md border border-neutral-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50">
                  <th className="py-1.5 px-3 font-medium">Concept</th>
                  <th className="py-1.5 px-3 font-medium">GCP</th>
                  <th className="py-1.5 px-3 font-medium">AWS</th>
                  <th className="py-1.5 px-3 font-medium">Azure</th>
                </tr>
              </thead>
              <tbody className="text-neutral-800">
                {CLOUD_IAM_TERMS.map((row) => (
                  <tr key={row.concept} className="border-t border-neutral-200">
                    <td className="py-1.5 px-3 font-medium">{row.concept}</td>
                    <td className="py-1.5 px-3">{row.gcp}</td>
                    <td className="py-1.5 px-3">{row.aws}</td>
                    <td className="py-1.5 px-3">{row.azure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-neutral-500">
            Names differ; the underlying model — identity, permission bundle, and a binding
            between them — is the same across all three.
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
            <li>A service account is the identity software uses, since no human is present when it runs.</li>
            <li>A permission is one allowed action; a role bundles many permissions into one grantable unit.</li>
            <li>The default service account commonly carries the Editor role, reaching nearly every service in the project.</li>
            <li>Least privilege means granting exactly what&rsquo;s needed, using the narrowest role that still works.</li>
            <li>A smaller blast radius means less an attacker can reach if that identity is ever misused.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "4. Wrap-up",
      title: "Closing: The Module, Complete",
      body: (
        <p>
          This is the last chapter of the IaC module, and of this app&rsquo;s own
          build-to-production story. Every piece — provisioned, deployed, monitored, and now
          secured — is written down as reviewable, versioned code.
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
