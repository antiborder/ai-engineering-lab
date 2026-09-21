"use client";

import { useState, type ReactNode } from "react";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { Equation } from "@/components/Equation";

// This app's real request path (spec.txt:1479-1518): Frontend, then Cloud
// Run for the backend, then Firestore and Cloud Storage, then external LLM
// APIs — plus Artifact Registry, Monitoring & Logging, and IAM as
// supporting services (spec.txt sections 34/36/37), not an invented one.
const REQUEST_PATH_SERVICES = [
  { id: "cloud_run", label: "Cloud Run", role: "Runs the backend API that answers every request." },
  { id: "firestore", label: "Firestore", role: "Stores structured records: conversations, evaluation results, experiment metadata." },
  { id: "storage", label: "Cloud Storage", role: "Stores files: uploads, model weights, and the built frontend." },
  { id: "artifact_registry", label: "Artifact Registry", role: "Stores the container images CI/CD & Deployment builds and promotes." },
  { id: "monitoring", label: "Monitoring & Logging", role: "Collects the metrics and logs Monitoring & Observability reads." },
] as const;

// This app's real infra file tree (spec.txt:1421-1441), the same layout
// Terraform's own Modules Section already introduced.
const INFRA_FILE_TREE_LINES = [
  "infra/",
  "├── environments/",
  "│   ├── dev/",
  "│   └── prod/",
  "├── modules/",
  "│   ├── cloud-run/",
  "│   ├── firestore/",
  "│   ├── storage/",
  "│   ├── artifact-registry/",
  "│   ├── monitoring/",
  "│   └── iam/",
  "├── providers.tf",
  "├── variables.tf",
  "├── outputs.tf",
  "└── README.md",
];

// A small, real dependency graph: enabling APIs has to happen first, since
// every other resource references (or, for the APIs themselves, requires)
// it. Cloud Run additionally depends on Artifact Registry, since its own
// resource block references an image path inside that repository.
const RESOURCE_NODES = [
  { id: "apis", label: "Enable GCP APIs", deps: [] as string[] },
  { id: "registry", label: "Artifact Registry", deps: ["apis"] },
  { id: "firestore", label: "Firestore", deps: ["apis"] },
  { id: "storage", label: "Cloud Storage", deps: ["apis"] },
  { id: "cloud_run", label: "Cloud Run", deps: ["apis", "registry"] },
] as const;
const RESOURCE_LABELS: Record<string, string> = Object.fromEntries(RESOURCE_NODES.map((n) => [n.id, n.label]));

// Extends Terraform's own dev/prod Cloud Run numbers (512Mi/1Gi,
// 0-2/1-10 instances) across the rest of the stack, so the "not everything
// is per-environment" point (Artifact Registry, deliberately absent here)
// lands against a concrete, already-familiar baseline.
const ENV_CONFIGS = {
  dev: {
    cloudRun: { memory: "512Mi", minInstances: 0, maxInstances: 2 },
    firestore: { pointInTimeRecovery: "Off" },
    storage: { deleteAfterDays: 7 },
    monitoring: { errorRateAlertPct: 20 },
  },
  prod: {
    cloudRun: { memory: "1Gi", minInstances: 1, maxInstances: 10 },
    firestore: { pointInTimeRecovery: "On" },
    storage: { deleteAfterDays: 90 },
    monitoring: { errorRateAlertPct: 5 },
  },
} as const;
type EnvName = keyof typeof ENV_CONFIGS;

const CURRENT_ERROR_RATE_PCT = 8;

/** Module 6 (IaC), Unit "Provisioning This App's Own Cloud Infrastructure"
 * — this module's third Unit (spec.txt sections 34/36/37), applying Unit
 * 2's Terraform concepts to this app's actual target architecture instead
 * of one illustrative resource. Continues the same running scenario: this
 * app's own backend Cloud Run service, region `us-central1`, now placed
 * inside the fuller real stack (Cloud Run, Firestore, Cloud Storage,
 * Artifact Registry, Monitoring & Logging), reusing the same
 * `infra/environments/{dev,prod}` + `infra/modules/*` file layout Unit 2's
 * own Modules Section already introduced — not an invented one.
 *
 * Closes the loop with Module 5 (LLMOps): the exact container image
 * CI/CD & Deployment builds and promotes is what Cloud Run, provisioned
 * here, actually runs. Terraform creates the Artifact Registry repository
 * itself, but never builds or pushes an image into it — that boundary
 * (Terraform vs. CI/CD) is stated explicitly, not left implicit.
 *
 * Built to match Evaluation Basics' care level per explicit user
 * instruction: one concrete scenario (this app's own real infrastructure)
 * threaded through every Section, four genuinely interactive Try-It-
 * Yourself Steps — one per Section, the same one-per-Section pattern
 * Units 1-2 already use — and self-contained: a reader who skipped Units
 * 1-2 still gets a working definition of every term reused here. IAM is
 * named only where a resource needs a service account to reference;
 * least-privilege IAM itself is Unit 4's job, not repeated here. */
export function ProvisioningWalkthrough({
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

  // -------------------- Try it yourself: click a service, see what it's for --------------------
  const [focusService, setFocusService] = useState<string | null>(null);

  // -------------------- Try it yourself: provision the stack in the right order --------------------
  const [appliedResources, setAppliedResources] = useState<Set<string>>(new Set());
  const [applyError, setApplyError] = useState<string | null>(null);
  const attemptApply = (id: string) => {
    const node = RESOURCE_NODES.find((n) => n.id === id)!;
    const missing = node.deps.filter((d) => !appliedResources.has(d));
    if (missing.length > 0) {
      setApplyError(
        `Error: "${node.label}" depends on "${missing.map((m) => RESOURCE_LABELS[m]).join('", "')}", which has not been applied yet.`
      );
      return;
    }
    setAppliedResources((prev) => new Set(prev).add(id));
    setApplyError(null);
  };
  const resetProvisioning = () => {
    setAppliedResources(new Set());
    setApplyError(null);
  };
  const graphBoxClass = (id: string) =>
    `rounded-md border px-3 py-2 ${
      appliedResources.has(id) ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-neutral-200 bg-white text-neutral-700"
    }`;

  // -------------------- Try it yourself: compare dev and prod, service by service --------------------
  const [env, setEnv] = useState<EnvName>("dev");
  const envConfig = ENV_CONFIGS[env];

  // -------------------- Try it yourself: pick an alert threshold --------------------
  const [alertThresholdPct, setAlertThresholdPct] = useState(10);
  const resetAlertThreshold = () => setAlertThresholdPct(10);
  const alertFires = CURRENT_ERROR_RATE_PCT > alertThresholdPct;

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            The previous chapter provisioned one illustrative Cloud Run service. This chapter
            provisions this app&rsquo;s actual cloud infrastructure — the real target
            architecture, all connected together.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Full Stack, End to End</strong> — Cloud Run, Firestore, Cloud Storage, and Artifact Registry, and what each one is for.</li>
            <li><strong>Wiring Resources Together</strong> — enabling APIs first, and how Terraform figures out the order to create things in.</li>
            <li><strong>One Config, Two Environments</strong> — which parts of the stack get duplicated per environment, and which stay shared.</li>
            <li><strong>Monitoring &amp; Logging as Code</strong> — provisioning the dashboards and alerts this app&rsquo;s Monitoring &amp; Observability chapter depends on.</li>
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
          This app&rsquo;s real request path chains several GCP services together, not just one
          Cloud Run service in isolation. Four more services support it: Artifact Registry, Cloud
          Storage, Firestore, and Monitoring &amp; Logging.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Frontend</div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
              Cloud Run
              <br />
              <span className="text-neutral-500 text-xs">backend API</span>
            </div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Firestore</div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Cloud Storage</div>
            <span className="text-neutral-400">→</span>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">External LLM APIs</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm">
            <span className="text-neutral-400 text-xs">supporting:</span>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">Artifact Registry</div>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">Monitoring &amp; Logging</div>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">IAM (Unit 4)</div>
          </div>
        </div>
      ),
    },
    // -------------------- 1. The Full Stack, End to End --------------------
    {
      section: "1. The Full Stack, End to End",
      title: "This App's Real Infra Layout",
      body: (
        <p>
          Unit 2&rsquo;s Modules Section already named this app&rsquo;s real infra layout. Every
          resource in this chapter lives inside one of these same files and folders:
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {INFRA_FILE_TREE_LINES.join("\n")}
        </pre>
      ),
    },
    {
      section: "1. The Full Stack, End to End",
      title: "Cloud Run: Already Familiar",
      body: (
        <p>
          <strong>Cloud Run</strong> is the one resource Unit 2 already wrote in full. It runs
          this app&rsquo;s backend API, and it&rsquo;s the piece every other service in this
          chapter connects around.
        </p>
      ),
      visual: <StatCard label="Cloud Run (from Unit 2)" value="region: us-central1" note="the module Unit 2's HCL already declared in full" />,
    },
    {
      section: "1. The Full Stack, End to End",
      title: "Firestore: Where Structured Data Lives",
      body: (
        <p>
          <strong>Firestore</strong> is this app&rsquo;s database — a NoSQL, document-based store,
          not a SQL database with fixed tables. It holds this app&rsquo;s structured records:
          conversations, evaluation results, and experiment metadata.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'resource "google_firestore_database" "default" {\n' +
            "  project     = var.project_id\n" +
            '  location_id = "us-central1"\n' +
            '  type        = "FIRESTORE_NATIVE"  # document mode, not the older Datastore mode\n' +
            "}"}
        </pre>
      ),
    },
    {
      section: "1. The Full Stack, End to End",
      title: "Cloud Storage: Files, Not Records",
      body: (
        <div className="space-y-2">
          <p>
            <strong>Cloud Storage</strong> holds files, not structured records — uploads, model
            weights, and the built frontend. Firestore and Cloud Storage split the same job.
            Small structured facts go in Firestore; large or unstructured blobs go in Cloud
            Storage.
          </p>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Firestore" value="structured records" note="conversations, eval results, metadata" />
          <StatCard label="Cloud Storage" value="files & blobs" note="uploads, model weights, built frontend" />
        </div>
      ),
    },
    {
      section: "1. The Full Stack, End to End",
      title: "Artifact Registry: Closing the Loop with CI/CD",
      body: (
        <div className="space-y-2">
          <p>
            <strong>Artifact Registry</strong> stores the container images CI/CD &amp; Deployment
            builds and promotes. Terraform creates the repository itself. It does not build or
            push any image into it.
          </p>
          <p>
            Cloud Run&rsquo;s own resource block references an image by its full registry path.
            That path only resolves once CI/CD&rsquo;s pipeline has actually pushed something
            there.
          </p>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'resource "google_artifact_registry_repository" "images" {\n' +
            '  location      = "us-central1"\n' +
            '  repository_id = "ai-playground"\n' +
            '  format        = "DOCKER"\n' +
            "}\n\n" +
            'resource "google_cloud_run_v2_service" "backend" {\n' +
            "  # ...\n" +
            "  template {\n" +
            "    containers {\n" +
            '      image = "us-central1-docker.pkg.dev/${var.project_id}/ai-playground/backend:v2"\n' +
            "    }\n" +
            "  }\n" +
            "}"}
        </pre>
      ),
    },
    {
      section: "1. The Full Stack, End to End",
      title: "Try it yourself: click a service, see what it's for",
      body: <p>Click any service below to see exactly what it does in this app&rsquo;s stack.</p>,
      controls: (
        <div className="flex gap-2 flex-wrap">
          {REQUEST_PATH_SERVICES.map((s) => (
            <button
              key={s.id}
              onClick={() => setFocusService(s.id)}
              className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                focusService === s.id
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      ),
      resetAction: () => setFocusService(null),
      visual: (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-center text-sm">
            {REQUEST_PATH_SERVICES.map((s) => (
              <div
                key={s.id}
                className={`rounded-md border px-3 py-2 ${
                  focusService === s.id
                    ? "border-cyan-300 bg-cyan-50 text-cyan-900"
                    : focusService
                      ? "border-neutral-200 bg-white opacity-40"
                      : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
          {focusService && (
            <p className="text-sm text-neutral-600 text-center">
              {REQUEST_PATH_SERVICES.find((s) => s.id === focusService)?.role}
            </p>
          )}
        </div>
      ),
    },
    // -------------------- 2. Wiring Resources Together --------------------
    {
      section: "2. Wiring Resources Together",
      title: "Enabling GCP APIs First",
      body: (
        <div className="space-y-2">
          <p>
            Every GCP service starts disabled on a brand-new project. Cloud Run, Firestore,
            Artifact Registry — each has its own API. That API has to be turned on before
            anything else can use it.
          </p>
          <p>
            A <strong>google_project_service</strong> resource turns one API on. This
            app&rsquo;s config declares one for every service it uses, applied before anything
            else.
          </p>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'resource "google_project_service" "cloud_run" {\n' +
            "  project = var.project_id\n" +
            '  service = "run.googleapis.com"\n' +
            "}\n\n" +
            'resource "google_project_service" "firestore" {\n' +
            "  project = var.project_id\n" +
            '  service = "firestore.googleapis.com"\n' +
            "}"}
        </pre>
      ),
    },
    {
      section: "2. Wiring Resources Together",
      title: "Terraform Figures Out the Order for You",
      body: (
        <div className="space-y-2">
          <p>
            Nobody writes down &ldquo;do this before that&rdquo; anywhere in this config.
            Terraform figures out the order on its own, from the references between resource
            blocks.
          </p>
          <p>
            Cloud Run&rsquo;s resource block references the enabled Cloud Run API by name. That
            reference is enough. Terraform applies the API first automatically, every time.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Enable GCP APIs</div>
          </div>
          <div className="text-neutral-400">↓ ↓ ↓</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Artifact Registry</div>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Firestore</div>
            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Cloud Storage</div>
          </div>
          <div className="text-neutral-400">↓</div>
          <div className="flex items-center justify-center gap-2">
            <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Cloud Run</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Wiring Resources Together",
      title: "When There's No Reference to Follow: depends_on",
      body: (
        <div className="space-y-2">
          <p>
            A reference only exists when one resource&rsquo;s block actually reads a value from
            another. Enabling an API produces no value anything else needs to read.
          </p>
          <p>
            Without a reference, Terraform cannot see that dependency on its own. A{" "}
            <strong>depends_on</strong> argument states it explicitly instead, forcing one
            resource to wait for another.
          </p>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'resource "google_firestore_database" "default" {\n' +
            "  project = var.project_id\n" +
            "  # ...\n" +
            "  depends_on = [google_project_service.firestore]\n" +
            "}"}
        </pre>
      ),
    },
    {
      section: "2. Wiring Resources Together",
      title: "Try it yourself: provision the stack in the right order",
      body: (
        <p>
          Apply each resource below. Applying one before its dependencies exist fails, the same
          way Terraform itself would refuse it.
        </p>
      ),
      controls: (
        <div className="w-full space-y-3">
          <div className="flex gap-2 flex-wrap">
            {RESOURCE_NODES.map((n) => (
              <button
                key={n.id}
                onClick={() => attemptApply(n.id)}
                className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                  appliedResources.has(n.id)
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {appliedResources.has(n.id) ? `✓ ${n.label}` : `Apply ${n.label}`}
              </button>
            ))}
          </div>
          {applyError && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 font-mono">
              {applyError}
            </div>
          )}
        </div>
      ),
      resetAction: resetProvisioning,
      visual: (
        <div className="space-y-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className={graphBoxClass("apis")}>Enable GCP APIs</div>
          </div>
          <div className="text-neutral-400">↓ ↓ ↓</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className={graphBoxClass("registry")}>Artifact Registry</div>
            <div className={graphBoxClass("firestore")}>Firestore</div>
            <div className={graphBoxClass("storage")}>Cloud Storage</div>
          </div>
          <div className="text-neutral-400">↓</div>
          <div className="flex items-center justify-center gap-2">
            <div className={graphBoxClass("cloud_run")}>Cloud Run</div>
          </div>
        </div>
      ),
    },
    // -------------------- 3. One Config, Two Environments --------------------
    {
      section: "3. One Config, Two Environments",
      title: "Recap: One Module, Many Environments",
      body: (
        <p>
          Unit 2 already showed one module resolving to different values for dev and prod.
          Production gets more memory, and at least one instance always warm. The same pattern
          now extends across every service in this stack.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Cloud Run — dev" value="512Mi, 0-2 instances" />
          <StatCard label="Cloud Run — prod" value="1Gi, 1-10 instances" />
        </div>
      ),
    },
    {
      section: "3. One Config, Two Environments",
      title: "Not Everything Is Duplicated Per Environment",
      body: (
        <div className="space-y-2">
          <p>
            Dev and prod each get their own Cloud Run service, their own Firestore database, and
            their own Storage bucket. Artifact Registry is different: there is only one, shared
            by both.
          </p>
          <p>
            CI/CD &amp; Deployment promotes one image forward from dev to prod, unchanged. That
            only makes sense if both environments pull from the exact same registry.
          </p>
        </div>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-center text-sm flex-wrap">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Cloud Run — dev</div>
          <span className="text-neutral-400">←</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
            Artifact Registry
            <br />
            <span className="text-neutral-500 text-xs">shared, one instance</span>
          </div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Cloud Run — prod</div>
        </div>
      ),
    },
    {
      section: "3. One Config, Two Environments",
      title: "Firestore and Storage Settings Differ by Environment Too",
      body: (
        <div className="space-y-2">
          <p>
            Duplicated resources can still have different settings per environment, the same way
            Cloud Run&rsquo;s memory does. Two examples from this app&rsquo;s own config:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Firestore point-in-time recovery</strong> — off in dev, on in prod, so production data can be restored to an earlier moment.</li>
            <li><strong>Storage lifecycle rules</strong> — dev deletes uploads after 7 days to control cost; prod keeps them for 90.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Firestore PITR — dev" value="Off" />
          <StatCard label="Firestore PITR — prod" value="On" tone="good" />
        </div>
      ),
    },
    {
      section: "3. One Config, Two Environments",
      title: "Try it yourself: compare dev and prod, service by service",
      body: <p>See every setting that changes between dev and prod, across the whole stack at once.</p>,
      controls: (
        <div className="flex gap-2">
          {(["dev", "prod"] as EnvName[]).map((e) => (
            <button
              key={e}
              onClick={() => setEnv(e)}
              className={`px-3 py-1.5 rounded-md text-base font-medium border capitalize ${
                env === e ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatCard label="Cloud Run memory" value={envConfig.cloudRun.memory} />
          <StatCard label="Cloud Run instances" value={`${envConfig.cloudRun.minInstances}-${envConfig.cloudRun.maxInstances}`} />
          <StatCard label="Firestore PITR" value={envConfig.firestore.pointInTimeRecovery} />
          <StatCard label="Storage retention" value={`${envConfig.storage.deleteAfterDays} days`} />
          <StatCard label="Error-rate alert" value={`${envConfig.monitoring.errorRateAlertPct}%`} />
        </div>
      ),
    },
    // -------------------- 4. Monitoring & Logging as Code --------------------
    {
      section: "4. Monitoring & Logging as Code",
      title: "Monitoring and Logging Are Code Too",
      body: (
        <div className="space-y-2">
          <p>
            Monitoring &amp; Observability showed dashboards, traces, and a live evaluation
            score. None of that data collection turns on by itself.
          </p>
          <p>
            The <strong>monitoring</strong> module provisions exactly what that chapter depends
            on: log export, metric collection, dashboards, and alert policies. All of that is
            written down, reviewed, and versioned, the same as everything else in this chapter.
          </p>
        </div>
      ),
      visual: (
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Log export</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-neutral-200 bg-white px-3 py-2">Metric collection</div>
          <span className="text-neutral-400">→</span>
          <div className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">Dashboards &amp; alerts</div>
        </div>
      ),
    },
    {
      section: "4. Monitoring & Logging as Code",
      title: "A Concrete Example: an Alert Policy as Code",
      body: (
        <p>
          An <strong>alert policy</strong> declares a threshold and who gets notified when
          it&rsquo;s crossed. Written as code, that threshold is reviewable and versioned, the
          same as any other resource in this chapter.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'resource "google_monitoring_alert_policy" "high_error_rate" {\n' +
            '  display_name = "Backend error rate too high"\n' +
            "  conditions {\n" +
            '    display_name = "Error rate above threshold"\n' +
            "    condition_threshold {\n" +
            "      threshold_value = 0.05   # 5% — prod's own threshold\n" +
            "    }\n" +
            "  }\n" +
            "  notification_channels = [google_monitoring_notification_channel.oncall.name]\n" +
            "}"}
        </pre>
      ),
    },
    {
      section: "4. Monitoring & Logging as Code",
      title: "Try it yourself: pick an alert threshold",
      body: (
        <p>
          This app&rsquo;s backend is currently seeing an 8% error rate. Pick a threshold and see
          whether that alert would fire.
        </p>
      ),
      controls: (
        <label className="block text-base w-full">
          <div className="flex justify-between text-neutral-600 mb-1">
            <span>Alert threshold (error rate)</span>
            <span className="text-neutral-800 tabular-nums">{alertThresholdPct}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={alertThresholdPct}
            onChange={(e) => setAlertThresholdPct(Number(e.target.value))}
            className="w-full accent-cyan-600"
          />
        </label>
      ),
      resetAction: resetAlertThreshold,
      visual: (
        <div className="space-y-2">
          <Equation tex={"\\text{error rate} > \\text{threshold} \\;\\Rightarrow\\; \\text{alert fires}"} />
          <div className="flex items-center justify-center gap-2 text-base flex-wrap">
            <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white text-neutral-700">
              Current error rate: {CURRENT_ERROR_RATE_PCT}%
            </span>
            <span className="text-neutral-300">vs.</span>
            <span className="px-3 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">
              Threshold: {alertThresholdPct}%
            </span>
            <span className="text-neutral-300">→</span>
            <span
              className={`px-3 py-1.5 rounded-full border ${
                alertFires ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"
              }`}
            >
              {alertFires ? "Alert fires" : "No alert"}
            </span>
          </div>
        </div>
      ),
    },
    // -------------------- Wrap-up --------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>This app&rsquo;s real stack chains Cloud Run, Firestore, Cloud Storage, and external LLM APIs. That&rsquo;s supported by Artifact Registry and Monitoring &amp; Logging.</li>
            <li>Firestore holds structured records; Cloud Storage holds files. Artifact Registry holds the images CI/CD &amp; Deployment builds and promotes.</li>
            <li>APIs must be enabled before the resources that use them. Terraform figures out that order from references between resource blocks; depends_on states it explicitly when no reference exists.</li>
            <li>Cloud Run, Firestore, and Storage each get their own copy per environment. Artifact Registry stays shared, so a promoted image means the same thing in both.</li>
            <li>Monitoring&rsquo;s dashboards and alerts are provisioned as code too, with thresholds that can differ by environment.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "5. Wrap-up",
      title: "Closing: Locking the Front Door, Next",
      body: (
        <p>
          Every resource in this chapter can still do more than it strictly needs to. The next
          chapter locks that down: least-privilege IAM, so each service can only do its own job.
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
