"use client";

import { useState, type ReactNode } from "react";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";

// Continues Unit 1's exact scenario: this app's own backend Cloud Run
// service, region us-central1, memory 512Mi — now written as real HCL
// instead of described in prose. This app's own planned module layout
// (spec.txt:1421-1441) is the running example for Section 4, not an
// invented one: exactly six modules.
type HclPart = "variable" | "provider" | "resource" | "output";

// Named so the "spot the pieces" resource line and the argument-level
// annotation (resourceArgsAnnotated, below) always show the exact same
// text — computed offsets for the arrow markers would silently drift out
// of alignment if the two ever diverged.
const RESOURCE_TYPE_ARG = '"google_cloud_run_v2_service"';
const RESOURCE_LOCAL_NAME_ARG = '"backend"';
const RESOURCE_DECLARATION_LINE = `resource ${RESOURCE_TYPE_ARG} ${RESOURCE_LOCAL_NAME_ARG} {`;

// The State Step's default project file tree. Only the last line is
// marked "focus" — the same true/false shape hclSnippet's own lines use
// — so the tree is highlighted with hclSnippet's exact classes below.
const STATE_FILE_NAME = "terraform.tfstate";
const FILE_TREE_LINES: { text: string; focus?: boolean }[] = [
  { text: "." },
  { text: "├── main.tf" },
  { text: "├── variables.tf" },
  { text: "├── outputs.tf" },
  { text: "├── .terraform/" },
  { text: `└── ${STATE_FILE_NAME}`, focus: true },
];

const HCL_LINES: { text: string; part?: HclPart }[] = [
  { text: 'variable "project_id" {', part: "variable" },
  { text: '  description = "GCP project ID"', part: "variable" },
  { text: "  type        = string", part: "variable" },
  { text: "}", part: "variable" },
  { text: "" },
  { text: 'provider "google" {', part: "provider" },
  { text: "  project = var.project_id", part: "provider" },
  { text: '  region  = "us-central1"', part: "provider" },
  { text: "}", part: "provider" },
  { text: "" },
  { text: RESOURCE_DECLARATION_LINE, part: "resource" },
  { text: '  name     = "ai-playground-backend"', part: "resource" },
  { text: '  location = "us-central1"', part: "resource" },
  { text: "", part: "resource" },
  { text: "  template {", part: "resource" },
  { text: "    containers {", part: "resource" },
  { text: '      image = ".../backend:v2"', part: "resource" },
  { text: "      resources {", part: "resource" },
  { text: '        limits = { memory = "512Mi" }', part: "resource" },
  { text: "      }", part: "resource" },
  { text: "    }", part: "resource" },
  { text: "  }", part: "resource" },
  { text: "}", part: "resource" },
  { text: "" },
  { text: 'output "service_url" {', part: "output" },
  { text: "  value = google_cloud_run_v2_service.backend.uri", part: "output" },
  { text: "}", part: "output" },
];

// Filters HCL_LINES down to just the given parts' lines — reused by the
// "One File, or Several?" Step so each file's preview is always in sync
// with the single source of truth HCL_LINES, never a separately
// hand-typed copy. A blank separator line is kept only when it falls
// between two blocks that both belong to this file, not at the edges.
function linesForParts(parts: HclPart[]): string {
  const out: string[] = [];
  HCL_LINES.forEach((line, i) => {
    if (line.part) {
      if (parts.includes(line.part)) out.push(line.text);
      return;
    }
    const prevPart = [...HCL_LINES.slice(0, i)].reverse().find((l) => l.part)?.part;
    const nextPart = HCL_LINES.slice(i + 1).find((l) => l.part)?.part;
    if (prevPart && nextPart && parts.includes(prevPart) && parts.includes(nextPart)) {
      out.push("");
    }
  });
  return out.join("\n");
}

const MODULES = [
  { name: "cloud-run", role: "The backend service itself — this Unit's running example." },
  { name: "firestore", role: "The database the backend reads and writes." },
  { name: "storage", role: "File storage — models, uploads." },
  { name: "artifact-registry", role: "Where built container images live, from CI/CD & Deployment." },
  { name: "monitoring", role: "Dashboards and alerts — the LLMOps Monitoring Unit's own concepts, provisioned here." },
  { name: "iam", role: "Who and what is allowed to touch any of the above." },
];

const ENV_CONFIGS = {
  dev: { memory: "512Mi", minInstances: 0, maxInstances: 2 },
  prod: { memory: "1Gi", minInstances: 1, maxInstances: 10 },
} as const;
type EnvName = keyof typeof ENV_CONFIGS;

// The conventional split of the single file shown throughout Section 1
// into separate files — introduced only after that whole file (variable
// through output) has already been shown as one piece, so the reader
// knows what's being split before being told it's optional.
const FILE_SPLIT_MAP: { file: string; contains: HclPart[] }[] = [
  { file: "main.tf", contains: ["provider", "resource"] },
  { file: "variables.tf", contains: ["variable"] },
  { file: "outputs.tf", contains: ["output"] },
];

// Same border-COLOR-300 / bg-COLOR-50 / text-COLOR-700-or-800 formula
// StatCard's TONE_CLASSES already uses for "good"/"warn", extended with
// "cyan" (this chapter's own primary highlight color) and "danger" (the
// red already used for the State section's "State file lost" button) —
// kept in one place so every box in the workflow diagram stays visually
// consistent with the rest of the chapter.
const DIAGRAM_TONE_CLASSES = {
  neutral: "border-neutral-200 bg-white text-neutral-700",
  cyan: "border-cyan-300 bg-cyan-50 text-cyan-900",
  good: "border-emerald-300 bg-emerald-50 text-emerald-700",
  danger: "border-red-300 bg-red-50 text-red-800",
} as const;
type DiagramTone = keyof typeof DIAGRAM_TONE_CLASSES;

const WORKFLOW_MAIN_STAGES: { label: string; tone: DiagramTone }[] = [
  { label: "Edit the .tf file", tone: "neutral" },
  { label: "terraform init", tone: "cyan" },
  { label: "terraform plan", tone: "cyan" },
  { label: "terraform apply", tone: "cyan" },
  { label: "Infrastructure matches the file", tone: "good" },
];

/** Module 6 (IaC), Unit "Terraform: Declaring Infrastructure" — this
 * module's second Unit and its deep-dive representative example (see
 * module-6-iac.md). Continues Unit 1's exact scenario (this app's own
 * backend Cloud Run service, us-central1, 512Mi) as real-ish HCL, the
 * same way Unit 1's own closing Step promised. Illustrative HCL, not a
 * literal file from this repo — the same "shape every recipe like it
 * follows" disclosure Containers' own Dockerfile example uses.
 *
 * Built to match Evaluation Basics' care level per explicit user
 * instruction: 32 Steps across Welcome + 4 Sections + Wrap-up, one
 * concrete scenario threaded throughout, and four separate genuine
 * interactive Steps (one per Section) rather than static readouts.
 *
 * Self-contained: a reader who skipped Unit 1 still gets a working
 * definition of declarative/idempotent/drift/plan where they're first
 * used here, not just a bare pointer back to it — but the full worked
 * examples (the 2 a.m. incident, the three-engineers exercise) are not
 * repeated, since this Unit's job is the tool, not re-teaching the
 * concept from scratch. */
export function TerraformWalkthrough({
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

  // -------------------- Try it yourself: spot the pieces --------------------
  const [focusPart, setFocusPart] = useState<HclPart | null>(null);

  // -------------------- Try it yourself: run the workflow --------------------
  // "planned" only ever means "the first, not-yet-applied plan" — a
  // re-plan after apply keeps stage "applied" and instead records which
  // memory value it planned against (planRequestedFor), so re-running
  // plan can never look like a fresh create ("+1 to create") once
  // something has already been applied once.
  type WorkflowStage = "idle" | "initialized" | "planned" | "applied";
  const [workflowStage, setWorkflowStage] = useState<WorkflowStage>("idle");
  const [workflowMemory, setWorkflowMemory] = useState("512Mi");
  const [appliedMemory, setAppliedMemory] = useState("512Mi");
  const [planRequestedFor, setPlanRequestedFor] = useState<string | null>(null);
  const resetWorkflow = () => {
    setWorkflowStage("idle");
    setWorkflowMemory("512Mi");
    setAppliedMemory("512Mi");
    setPlanRequestedFor(null);
  };
  const hasPendingChange = workflowMemory !== appliedMemory;
  const planMatchesPending = planRequestedFor === workflowMemory;

  // -------------------- Try it yourself: plan without state --------------------
  const [stateLost, setStateLost] = useState(false);

  // -------------------- Try it yourself: pick an environment --------------------
  const [env, setEnv] = useState<EnvName>("dev");
  const envConfig = ENV_CONFIGS[env];

  const hclSnippet = (focus: HclPart | null) => (
    <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
      {HCL_LINES.map((line, i) => (
        <div
          key={i}
          className={
            focus && line.part === focus
              ? "bg-cyan-100 text-cyan-900 -mx-3 px-3"
              : focus && line.part
                ? "opacity-40"
                : ""
          }
        >
          {line.text || " "}
        </div>
      ))}
    </pre>
  );

  // Zooms into just the resource declaration line and marks its two
  // quoted arguments individually — type vs. local name — rather than
  // highlighting the whole line the way hclSnippet("resource") does one
  // step later. The ▲ markers sit under each argument's exact starting
  // column, computed from the real string offsets (via `ch`, the
  // monospace-character CSS unit) instead of hand-counted spaces, so
  // they can't silently drift out of alignment if the line's text ever
  // changes.
  const resourceArgsAnnotated = () => {
    const typeStart = RESOURCE_DECLARATION_LINE.indexOf(RESOURCE_TYPE_ARG);
    const nameStart = RESOURCE_DECLARATION_LINE.indexOf(
      RESOURCE_LOCAL_NAME_ARG,
      typeStart + RESOURCE_TYPE_ARG.length
    );
    const beforeType = RESOURCE_DECLARATION_LINE.slice(0, typeStart);
    const betweenArgs = RESOURCE_DECLARATION_LINE.slice(typeStart + RESOURCE_TYPE_ARG.length, nameStart);
    const afterName = RESOURCE_DECLARATION_LINE.slice(nameStart + RESOURCE_LOCAL_NAME_ARG.length);
    return (
      <div className="bg-white border border-neutral-200 rounded-md p-3 font-mono text-sm overflow-x-auto">
        <div className="whitespace-pre">
          <span>{beforeType}</span>
          <span className="bg-cyan-100 text-cyan-900 rounded px-0.5">{RESOURCE_TYPE_ARG}</span>
          <span>{betweenArgs}</span>
          <span className="bg-amber-100 text-amber-900 rounded px-0.5">{RESOURCE_LOCAL_NAME_ARG}</span>
          <span>{afterName}</span>
        </div>
        <div className="whitespace-pre text-cyan-700" style={{ paddingLeft: `${typeStart}ch` }}>
          {"▲ "}
          <span className="font-sans">1st argument — type: which kind of resource</span>
        </div>
        <div className="whitespace-pre text-amber-700" style={{ paddingLeft: `${nameStart}ch` }}>
          {"▲ "}
          <span className="font-sans">2nd argument — local name: this file&rsquo;s label for it</span>
        </div>
      </div>
    );
  };

  // Same dim-the-rest / highlight-the-focus classes as hclSnippet, applied
  // to a plain file tree instead of HCL — one visual language for "here is
  // where to look" throughout the chapter, not a new style per Step.
  const stateFileTree = () => {
    const nameStart = FILE_TREE_LINES[FILE_TREE_LINES.length - 1].text.indexOf(STATE_FILE_NAME);
    return (
      <div className="bg-white border border-neutral-200 rounded-md p-3 font-mono text-sm">
        {FILE_TREE_LINES.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre ${line.focus ? "bg-cyan-100 text-cyan-900 -mx-3 px-3" : "opacity-40"}`}
          >
            {line.text}
          </div>
        ))}
        <div className="whitespace-pre text-cyan-700 mt-1" style={{ paddingLeft: `${nameStart}ch` }}>
          {"▲ "}
          <span className="font-sans">Terraform&rsquo;s own record — written by apply, never edited by hand</span>
        </div>
      </div>
    );
  };

  // One card per file, each listing which block types it conventionally
  // holds. Cyan matches the chapter's own primary highlight color, the
  // same one hclSnippet uses for "here is what this piece is."
  const fileSplitDiagram = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {FILE_SPLIT_MAP.map((f) => (
        <div key={f.file} className="rounded-md border border-cyan-300 bg-cyan-50 p-3">
          <div className="font-mono text-sm text-cyan-900 font-medium mb-1">{f.file}</div>
          <div className="text-sm text-cyan-800 capitalize mb-2">{f.contains.join(", ")}</div>
          <pre className="whitespace-pre text-xs text-neutral-700 bg-white border border-cyan-200 rounded p-2 font-mono overflow-auto max-h-36">
            {linesForParts(f.contains)}
          </pre>
        </div>
      ))}
    </div>
  );

  // A module block for the given environment, its variable values pulled
  // straight from ENV_CONFIGS (module scope) — the exact same numbers the
  // "pick an environment" interactive shows, so the two can never drift
  // apart from each other.
  const moduleCallSnippet = (env: EnvName) => {
    const c = ENV_CONFIGS[env];
    return (
      'module "cloud_run" {\n' +
      '  source = "../../modules/cloud-run"\n\n' +
      `  memory        = "${c.memory}"\n` +
      `  min_instances = ${c.minInstances}\n` +
      `  max_instances = ${c.maxInstances}\n` +
      "}"
    );
  };

  // The receiving half of "variable in": the module's own files. Unlike
  // HCL_LINES' Section 1 resource (a hardcoded "512Mi", kept simple for a
  // first read), this resource reads var.memory — the change that
  // actually makes the module reusable across dev and prod.
  const MODULE_INPUT_FILES = [
    {
      file: "modules/cloud-run/variables.tf",
      code: 'variable "memory" {\n  type = string\n}',
    },
    {
      file: "modules/cloud-run/main.tf",
      code:
        `${RESOURCE_DECLARATION_LINE}\n` +
        '  name     = "ai-playground-backend"\n' +
        '  location = "us-central1"\n\n' +
        "  template {\n" +
        "    containers {\n" +
        "      resources {\n" +
        "        limits = { memory = var.memory }\n" +
        "      }\n" +
        "    }\n" +
        "  }\n" +
        "}",
    },
  ];

  // The sending half of "output out": the module exposes service_url...
  const MODULE_OUTPUT_FILE = {
    file: "modules/cloud-run/outputs.tf",
    code: 'output "service_url" {\n  value = google_cloud_run_v2_service.backend.uri\n}',
  };

  // ...and the caller reads it back with module.<local_name>.<output_name>
  // — a plain constant, not per-environment, since dev and prod read it
  // the exact same way (only the resulting value differs at apply time).
  const CALLER_OUTPUT_SNIPPET =
    'output "backend_url" {\n  value = module.cloud_run.service_url\n}';

  // Reuses StatCard's own border-COLOR-300/bg-COLOR-50/text-COLOR-700-
  // or-800 tone formula (DIAGRAM_TONE_CLASSES, module scope) so every box
  // here reads as part of the same design language as the rest of the
  // chapter's StatCards, not a one-off diagram style.
  const workflowDiagram = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {WORKFLOW_MAIN_STAGES.flatMap((stage, i) => {
          const box = (
            <div
              key={`stage-${i}`}
              className={`px-3 py-2 rounded-md border font-medium text-center ${DIAGRAM_TONE_CLASSES[stage.tone]}`}
            >
              {stage.label}
            </div>
          );
          if (i === WORKFLOW_MAIN_STAGES.length - 1) return [box];
          return [box, <span key={`arrow-${i}`} className="text-neutral-400">→</span>];
        })}
      </div>
      <p className="text-sm text-neutral-500">
        ↺ The next change starts back at editing the file — the same three commands run again, every
        time.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-neutral-400">↳</span>
        <div className={`px-3 py-2 rounded-md border font-medium text-center ${DIAGRAM_TONE_CLASSES.danger}`}>
          terraform destroy
        </div>
        <span className="text-neutral-400">→</span>
        <div className={`px-3 py-2 rounded-md border font-medium text-center ${DIAGRAM_TONE_CLASSES.neutral}`}>
          Infrastructure removed
        </div>
        <span className="text-neutral-500">— only when it should stop existing entirely.</span>
      </div>
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
            The previous chapter described writing infrastructure down as a file, instead of
            clicking it into existence. This chapter shows one real tool that does exactly
            that: <strong>Terraform</strong>. It uses this app&rsquo;s own backend service as
            the running example throughout.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Writing HCL</strong> — Terraform&rsquo;s own file format, and the anatomy of a resource.</li>
            <li><strong>The Workflow</strong> — <code>init</code>, <code>plan</code>, <code>apply</code>, and <code>destroy</code>.</li>
            <li><strong>State</strong> — what Terraform remembers between runs, and why losing it is dangerous.</li>
            <li><strong>Modules</strong> — reusing the same declared setup across environments.</li>
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
          The last chapter&rsquo;s backend Cloud Run service — region <code>us-central1</code>,
          memory <code>512Mi</code> — was only ever described in prose. This chapter writes that
          exact same service as an actual Terraform file, and runs it through Terraform&rsquo;s
          real workflow.
        </p>
      ),
      visual: hclSnippet(null),
    },
    // -------------------- 1. Writing HCL --------------------
    {
      section: "1. Writing HCL",
      title: "What Terraform Is",
      body: (
        <div className="space-y-2">
          <p>
            <strong>Terraform</strong> is a tool made by HashiCorp. It reads a file that declares
            infrastructure. Then it creates, changes, or deletes real cloud resources to match
            that file.
          </p>
          <p>
            It works with many clouds — Google Cloud, AWS, Azure, and others — through providers,
            covered next.
          </p>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "1. Writing HCL",
      title: "Terraform's Language: HCL",
      body: (
        <p>
          Terraform&rsquo;s files are written in <strong>HCL</strong> (HashiCorp Configuration
          Language). HCL is built specifically for declaring infrastructure — not a
          general-purpose programming language. It is declarative, the same idea the previous
          chapter introduced: a file says what should exist. It is not a sequence of steps to
          run.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "1. Writing HCL",
      title: "Providers: Which Cloud You're Talking To",
      body: (
        <p>
          A <strong>provider</strong> is a plugin. It knows how to talk to one specific
          cloud&rsquo;s API. Google Cloud, AWS, and hundreds of others each have their own
          provider. Declaring <code>provider &quot;google&quot;</code> tells Terraform to use
          the Google Cloud plugin for every resource below it.
        </p>
      ),
      visual: hclSnippet("provider"),
    },
    {
      section: "1. Writing HCL",
      title: "Resources: One Block, One Real Thing",
      body: (
        <div className="space-y-2">
          <p>
            A <strong>resource</strong> block declares one real thing that should exist. Its shape
            is always the same:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><code>resource</code> — this block declares something real, not just a value.</li>
            <li>The first quoted string is the <strong>type</strong> — which kind of thing, e.g. <code>google_cloud_run_v2_service</code>.</li>
            <li>The second quoted string is a <strong>local name</strong>. It labels the resource inside this file only — it is not the resource&rsquo;s real name in the cloud.</li>
            <li>Everything inside the braces is its actual settings.</li>
          </ul>
        </div>
      ),
      visual: resourceArgsAnnotated(),
    },
    {
      section: "1. Writing HCL",
      title: "The Backend Service, Written in HCL",
      body: (
        <p>
          This is the previous chapter&rsquo;s exact backend service, written as a real resource
          block. Same region. Same memory.
        </p>
      ),
      visual: hclSnippet("resource"),
    },
    {
      section: "1. Writing HCL",
      title: "Input Variables: Not Hardcoding Everything",
      body: (
        <p>
          Some values need to differ by environment. For example, the dev environment and the
          production environment should not share one project ID. A <strong>variable</strong> —
          also called an <strong>input variable</strong> — is declared once. It is then
          referenced with <code>var.project_id</code> wherever it&rsquo;s needed. This way, the
          same file works for both environments, no editing required. Input in, output out — the
          next Step covers its counterpart.
        </p>
      ),
      visual: hclSnippet("variable"),
    },
    {
      section: "1. Writing HCL",
      title: "Output Values: Getting Something Back",
      body: (
        <div className="space-y-2">
          <p>
            An <strong>output</strong> value shares something back after apply. It might print to
            your terminal, or be read by another module. A common use is printing a URL, an IP
            address, or an ID.
          </p>
          <p>
            This output prints the backend service&rsquo;s URL once it&rsquo;s deployed. It
            references the resource by its local name —{" "}
            <code>google_cloud_run_v2_service.backend</code> — the exact reason that local name
            exists.
          </p>
        </div>
      ),
      visual: hclSnippet("output"),
    },
    {
      section: "1. Writing HCL",
      title: "One File, or Several?",
      body: (
        <div className="space-y-2">
          <p>Everything so far has lived in one file. Terraform does not require that.</p>
          <p>
            Terraform reads every <code>.tf</code> file in a directory together, as one whole.
            You can split your code across several files, purely for readability.
          </p>
          <p>A common convention splits by purpose:</p>
        </div>
      ),
      visual: fileSplitDiagram(),
    },
    {
      section: "1. Writing HCL",
      title: "Try it yourself: spot the pieces",
      body: (
        <p>Click each part of this file to see which lines belong to it.</p>
      ),
      controls: (
        <div className="flex gap-2 flex-wrap">
          {(["variable", "provider", "resource", "output"] as HclPart[]).map((p) => (
            <button
              key={p}
              onClick={() => setFocusPart(p)}
              className={`px-3 py-1.5 rounded-md text-base font-medium border capitalize ${
                focusPart === p
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      ),
      resetAction: () => setFocusPart(null),
      visual: hclSnippet(focusPart),
    },
    // -------------------- 2. The Workflow --------------------
    {
      section: "2. The Workflow",
      title: "The Whole Workflow, Start to Finish",
      body: (
        <div className="space-y-2">
          <p>
            Writing the file is only the first half. Turning it into real infrastructure takes a
            few more steps. Changing it safely later uses those same steps again, in the same
            order:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><code>init</code> — prepares Terraform to talk to the cloud. Run once per project.</li>
            <li><code>plan</code> — a safe, read-only preview. Run before every change.</li>
            <li><code>apply</code> — makes the plan real.</li>
            <li><code>destroy</code> — the one-way exception. It tears everything back down.</li>
          </ul>
          <p>
            The next four Steps walk through each command in turn, using this same backend service
            as the running example.
          </p>
        </div>
      ),
      visual: workflowDiagram(),
    },
    {
      section: "2. The Workflow",
      title: "terraform init",
      body: (
        <p>
          <code>terraform init</code> downloads the provider plugin your file declares — here,
          the <code>google</code> provider. It gives Terraform the code it needs to talk to
          Google Cloud&rsquo;s API. Run it once per project, and again whenever a new provider is
          added.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {"$ terraform init\n\n" +
            "Initializing the backend...\n" +
            "Initializing provider plugins...\n" +
            "- Installing hashicorp/google...\n\n" +
            "Terraform has been successfully initialized!"}
        </pre>
      ),
    },
    {
      section: "2. The Workflow",
      title: "terraform plan",
      body: (
        <div className="space-y-2">
          <p>
            <code>terraform plan</code> is the previous chapter&rsquo;s &ldquo;preview before you
            change anything,&rdquo; made real. It compares the file to what actually exists, then
            prints exactly what it would create, change, or destroy. Nothing happens yet.
          </p>
          <p>
            On its own, a plan changes nothing — and by default, it isn&rsquo;t saved anywhere
            either. Two flags make it more useful:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><code>terraform</code> — the CLI itself.</li>
            <li><code>plan</code> — the subcommand: preview only.</li>
            <li>
              <code>-var=&quot;project_id=ai-playground-prod&quot;</code> — overrides one
              declared variable, just for this run.
            </li>
            <li>
              <code>-out=tfplan</code> — saves this exact plan to a file, so apply can use it
              later.
            </li>
          </ul>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {'$ terraform plan -var="project_id=ai-playground-prod" -out=tfplan\n\n' +
            "Terraform will perform the following actions:\n\n" +
            "  + google_cloud_run_v2_service.backend will be created\n" +
            "      + name     = \"ai-playground-backend\"\n" +
            "      + location = \"us-central1\"\n" +
            "      + memory   = \"512Mi\"\n\n" +
            "Plan: 1 to add, 0 to change, 0 to destroy.\n\n" +
            "Saved the plan to: tfplan"}
        </pre>
      ),
    },
    {
      section: "2. The Workflow",
      title: "terraform apply",
      body: (
        <div className="space-y-2">
          <p>
            <code>terraform apply</code> shows that same plan again. It asks you to confirm. Once
            you confirm, it actually creates or changes the resources. Afterward, it records what
            now exists.
          </p>
          <p>
            Without a saved plan file, this confirmation step is a new plan, run internally. It
            is not the plan from the previous Step. Any <code>-var</code> override used there
            must be passed again here.
          </p>
          <p>
            Applying a saved plan file skips that problem. The reviewed values are already
            locked in — no <code>-var</code> needed. A CI/CD pipeline commonly applies it this
            way, non-interactively:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><code>terraform</code> — the CLI itself.</li>
            <li><code>apply</code> — the subcommand: makes a plan real.</li>
            <li><code>-auto-approve</code> — skips the interactive yes/no prompt.</li>
            <li><code>tfplan</code> — the exact plan saved by the previous Step.</li>
          </ul>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {"$ terraform apply -auto-approve tfplan\n\n" +
            "google_cloud_run_v2_service.backend: Creating...\n" +
            "google_cloud_run_v2_service.backend: Creation complete\n\n" +
            "Apply complete! Resources: 1 added, 0 changed, 0 destroyed."}
        </pre>
      ),
    },
    {
      section: "2. The Workflow",
      title: "terraform destroy",
      body: (
        <p>
          <code>terraform destroy</code> is <code>apply</code> in reverse. It plans, then deletes
          every resource this file manages. It is exactly as real as <code>apply</code>. There is
          no separate, safer &ldquo;undo&rdquo; once it runs.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {"$ terraform destroy\n\n" +
            "google_cloud_run_v2_service.backend: Destroying...\n" +
            "google_cloud_run_v2_service.backend: Destruction complete\n\n" +
            "Destroy complete! Resources: 0 added, 0 changed, 1 destroyed."}
        </pre>
      ),
    },
    {
      section: "2. The Workflow",
      title: "Try it yourself: run the workflow",
      body: (
        <p>
          Run <code>init</code>, <code>plan</code>, and <code>apply</code> in order. Once applied,
          change the memory value and plan again to see an update instead of a fresh create.
        </p>
      ),
      controls: (
        <div className="w-full space-y-3">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setWorkflowStage("initialized")}
              disabled={workflowStage !== "idle"}
              className={`${nextBtn} disabled:opacity-40`}
            >
              terraform init
            </button>
            <button
              onClick={() => {
                if (workflowStage === "initialized") setWorkflowStage("planned");
                else if (workflowStage === "applied") setPlanRequestedFor(workflowMemory);
              }}
              disabled={
                workflowStage === "idle" ||
                workflowStage === "planned" ||
                (workflowStage === "applied" && (!hasPendingChange || planMatchesPending))
              }
              className={`${nextBtn} disabled:opacity-40`}
            >
              terraform plan
            </button>
            <button
              onClick={() => {
                setAppliedMemory(workflowMemory);
                setWorkflowStage("applied");
                setPlanRequestedFor(null);
              }}
              disabled={workflowStage !== "planned" && !(workflowStage === "applied" && hasPendingChange && planMatchesPending)}
              className={`${nextBtn} disabled:opacity-40`}
            >
              terraform apply
            </button>
          </div>
          {workflowStage === "applied" && (
            <label className="block text-base w-full max-w-xs">
              <div className="text-neutral-600 mb-1">Edit memory, then plan + apply again</div>
              <select
                value={workflowMemory}
                onChange={(e) => {
                  setWorkflowMemory(e.target.value);
                  setPlanRequestedFor(null);
                }}
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
              >
                {["512Mi", "1Gi", "2Gi"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      ),
      resetAction: resetWorkflow,
      visual: (
        <div className="space-y-2">
          <StatCard
            label="Workflow stage"
            value={
              workflowStage === "idle"
                ? "Not started"
                : workflowStage === "initialized"
                  ? "Provider downloaded"
                  : workflowStage === "planned"
                    ? "Plan ready"
                    : "Applied"
            }
            tone={workflowStage === "applied" ? "good" : "default"}
          />
          {workflowStage === "planned" && (
            <StatCard label="Plan" value="+1 to create" note="google_cloud_run_v2_service.backend" />
          )}
          {workflowStage === "applied" && hasPendingChange && planMatchesPending && (
            <StatCard label="Plan" value={`~1 to update: memory ${appliedMemory} → ${workflowMemory}`} tone="warn" />
          )}
          {workflowStage === "applied" && !(hasPendingChange && planMatchesPending) && (
            <StatCard label="Live service" value={`memory: ${appliedMemory}`} tone="good" note="No changes — matches the file" />
          )}
        </div>
      ),
    },
    // -------------------- 3. State --------------------
    {
      section: "3. State",
      title: "The State File: Terraform's Memory",
      body: (
        <div className="space-y-2">
          <p>
            Every time Terraform applies changes, it writes down what it did. This record is
            called the <strong>state file</strong>. By default, it is a JSON file named{" "}
            <code>terraform.tfstate</code>, sitting right next to your <code>.tf</code> files. It
            lists exactly which real resources Terraform created, and their current settings.
          </p>
          <p>
            The <code>.terraform/</code> folder is different. It holds downloaded provider
            plugins — not your state. You can delete <code>.terraform/</code> any time;{" "}
            <code>terraform init</code> just rebuilds it. Never do that to your actual state
            file.
          </p>
        </div>
      ),
      visual: stateFileTree(),
    },
    {
      section: "3. State",
      title: "Why State Matters",
      body: (
        <div className="space-y-2">
          <p>State is what makes <code>plan</code> fast and precise, for two reasons:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Terraform reads its own record. It does not need to scan the whole cloud account every time.</li>
            <li>State also tells Terraform which resources it owns. Other things might exist in the same cloud account for unrelated reasons — Terraform ignores those.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "3. State",
      title: "Losing State Is Dangerous",
      body: (
        <p>
          If the state file is lost, Terraform loses its memory. It no longer has any record of
          the backend service, the database, or anything else it created. The next plan does not
          show &ldquo;no changes.&rdquo; It sees nothing at all, and proposes creating everything
          again.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "3. State",
      title: "Try it yourself: plan without state",
      body: (
        <p>Compare a plan with the state file present against one where the state file is lost.</p>
      ),
      controls: (
        <div className="flex gap-2">
          <button
            onClick={() => setStateLost(false)}
            className={`px-3 py-1.5 rounded-md text-base font-medium border ${
              !stateLost ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            State file present
          </button>
          <button
            onClick={() => setStateLost(true)}
            className={`px-3 py-1.5 rounded-md text-base font-medium border ${
              stateLost ? "bg-red-600 border-red-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            State file lost
          </button>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {stateLost
            ? "Terraform has no record of existing resources.\n\nPlan: 6 to add, 0 to change, 0 to destroy.\n  + cloud-run, firestore, storage,\n  + artifact-registry, monitoring, iam"
            : "No changes. Your infrastructure matches the configuration."}
        </pre>
      ),
    },
    // -------------------- 4. Modules --------------------
    {
      section: "4. Modules",
      title: "What a Module Is",
      body: (
        <p>
          A <strong>module</strong> is a bundle of resources, packaged together with its own
          variables. This makes it reusable with different inputs. Without modules, you would
          copy-paste the same resource blocks every time you need something similar.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "4. Modules",
      title: "Files vs. Folders: Where the Boundary Is",
      body: (
        <div className="space-y-2">
          <p>The previous Section split one file into several. Splitting into folders is different:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Files, same directory</strong> — no effect. Terraform still reads them as one whole.</li>
            <li><strong>A new directory</strong> — a real module boundary. A resource declared there cannot be referenced directly from outside it.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="space-y-3">
          <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-3">
            <div className="text-sm text-neutral-500 mb-2">Same directory — no boundary</div>
            <div className="flex flex-wrap gap-2">
              {["main.tf", "variables.tf", "outputs.tf"].map((f) => (
                <span key={f} className="font-mono text-sm px-2 py-1 rounded bg-white border border-neutral-200 text-neutral-700">
                  {f}
                </span>
              ))}
            </div>
            <p className="text-sm text-neutral-500 mt-2">
              All three merge into one file. Any block can reference any other directly.
            </p>
          </div>
          <div className="rounded-md border border-neutral-300 bg-white p-3">
            <div className="text-sm text-neutral-500 mb-2">Separate directories — a boundary</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-neutral-200 bg-neutral-50 p-2 font-mono text-sm text-neutral-700">
                environments/dev/
              </div>
              <span className="text-red-600 text-lg font-medium shrink-0">✕</span>
              <div className="flex-1 rounded-md border border-neutral-200 bg-neutral-50 p-2 font-mono text-sm text-neutral-700">
                modules/cloud-run/
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-2">No direct reference crosses this line.</p>
          </div>
        </div>
      ),
    },
    {
      section: "4. Modules",
      title: "Crossing the Boundary: Variable In, Output Out",
      body: (
        <div className="space-y-2">
          <p>The boundary still blocks direct references. But two things are allowed to cross it deliberately.</p>
          <p>
            A <code>variable</code> value can go in, and an <code>output</code> value can come
            back out. The next two Steps show each one, with real code.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 rounded-md border border-neutral-300 bg-white p-3">
              <div className="font-mono text-sm text-neutral-500 mb-1">environments/dev/</div>
              <div className="text-sm text-neutral-700">caller</div>
            </div>
            <div className="flex sm:flex-col items-center justify-center gap-1 text-xs text-cyan-700 font-medium shrink-0">
              <span>variable →</span>
              <span>← output</span>
            </div>
            <div className="flex-1 rounded-md border border-cyan-300 bg-cyan-50 p-3">
              <div className="font-mono text-sm text-cyan-900 mb-1">modules/cloud-run/</div>
              <div className="text-sm text-cyan-800">module boundary</div>
            </div>
          </div>
          <p className="text-sm text-neutral-500">
            The module block in <code>environments/dev/</code> calls{" "}
            <code>modules/cloud-run/</code>. Only <code>variable</code> values cross in; only{" "}
            <code>output</code> values cross back out.
          </p>
        </div>
      ),
    },
    {
      section: "4. Modules",
      title: "Variable In: Passing a Value to the Module",
      body: (
        <div className="space-y-2">
          <p>The caller passes a value as an argument inside its <code>module</code> block.</p>
          <p>
            The module receives it through a <code>variable</code> block with the same name —{" "}
            <code>memory</code>. Inside the module, <code>var.memory</code> reads that value.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="rounded-md border border-neutral-300 bg-white p-3">
            <div className="font-mono text-sm text-neutral-500 mb-1">environments/dev/main.tf</div>
            <pre className="whitespace-pre text-sm text-neutral-700 font-mono overflow-auto max-h-40">
              {moduleCallSnippet("dev")}
            </pre>
          </div>
          <div className="text-center text-xs text-cyan-700 font-medium">↓ memory = &quot;512Mi&quot;</div>
          <div className="rounded-md border border-cyan-300 bg-cyan-50 p-3">
            <div className="font-mono text-sm text-cyan-900 mb-1">{MODULE_INPUT_FILES[0].file}</div>
            <pre className="whitespace-pre text-sm text-cyan-800 font-mono overflow-auto max-h-40">
              {MODULE_INPUT_FILES[0].code}
            </pre>
          </div>
          <div className="text-center text-xs text-cyan-700 font-medium">↓ var.memory</div>
          <div className="rounded-md border border-cyan-300 bg-cyan-50 p-3">
            <div className="font-mono text-sm text-cyan-900 mb-1">{MODULE_INPUT_FILES[1].file}</div>
            <pre className="whitespace-pre text-sm text-cyan-800 font-mono overflow-auto max-h-40">
              {MODULE_INPUT_FILES[1].code}
            </pre>
          </div>
        </div>
      ),
    },
    {
      section: "4. Modules",
      title: "Output Out: Getting a Value Back",
      body: (
        <div className="space-y-2">
          <p>The module exposes a value with its own <code>output</code> block.</p>
          <p>
            The caller reads it back as <code>module.cloud_run.service_url</code> — the
            module&rsquo;s local name, then the output&rsquo;s name.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          <div className="rounded-md border border-cyan-300 bg-cyan-50 p-3">
            <div className="font-mono text-sm text-cyan-900 mb-1">{MODULE_OUTPUT_FILE.file}</div>
            <pre className="whitespace-pre text-sm text-cyan-800 font-mono">{MODULE_OUTPUT_FILE.code}</pre>
          </div>
          <div className="text-center text-xs text-cyan-700 font-medium">↓ module.cloud_run.service_url</div>
          <div className="rounded-md border border-neutral-300 bg-white p-3">
            <div className="font-mono text-sm text-neutral-500 mb-1">environments/dev/main.tf</div>
            <pre className="whitespace-pre text-sm text-neutral-700 font-mono">{CALLER_OUTPUT_SNIPPET}</pre>
          </div>
          <p className="text-sm text-neutral-500">
            One value, three names: the resource&rsquo;s attribute → the module&rsquo;s output →
            the caller&rsquo;s output.
          </p>
        </div>
      ),
    },
    {
      section: "4. Modules",
      title: "The Full Round Trip: Root and Module Together",
      body: (
        <div className="space-y-2">
          <p>
            The last two Steps showed each direction on its own. Here is the same example end
            to end, in one continuous chain.
          </p>
          <p>
            Memory flows down into the module. The service&rsquo;s URL flows back up — a
            different value, crossing the same boundary the other way.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-1.5">
          <div className="rounded-md border border-neutral-300 bg-white p-3">
            <div className="font-mono text-sm text-neutral-500 mb-1">environments/dev/main.tf</div>
            <pre className="whitespace-pre text-sm text-neutral-700 font-mono overflow-auto max-h-32">
              {moduleCallSnippet("dev")}
            </pre>
          </div>
          <div className="text-center text-xs text-cyan-700 font-medium">↓ memory = &quot;512Mi&quot;</div>
          <div className="rounded-md border border-cyan-300 bg-cyan-50 p-3">
            <div className="font-mono text-sm text-cyan-900 mb-1">{MODULE_INPUT_FILES[0].file}</div>
            <pre className="whitespace-pre text-sm text-cyan-800 font-mono">{MODULE_INPUT_FILES[0].code}</pre>
          </div>
          <div className="text-center text-xs text-cyan-700 font-medium">↓ var.memory</div>
          <div className="rounded-md border border-cyan-300 bg-cyan-50 p-3">
            <div className="font-mono text-sm text-cyan-900 mb-1">{MODULE_INPUT_FILES[1].file}</div>
            <pre className="whitespace-pre text-sm text-cyan-800 font-mono overflow-auto max-h-40">
              {MODULE_INPUT_FILES[1].code}
            </pre>
          </div>
          <div className="text-center text-xs text-violet-700 font-medium">
            ↓ google_cloud_run_v2_service.backend.uri
          </div>
          <div className="rounded-md border border-cyan-300 bg-cyan-50 p-3">
            <div className="font-mono text-sm text-cyan-900 mb-1">{MODULE_OUTPUT_FILE.file}</div>
            <pre className="whitespace-pre text-sm text-cyan-800 font-mono">{MODULE_OUTPUT_FILE.code}</pre>
          </div>
          <div className="text-center text-xs text-violet-700 font-medium">↓ module.cloud_run.service_url</div>
          <div className="rounded-md border border-neutral-300 bg-white p-3">
            <div className="font-mono text-sm text-neutral-500 mb-1">environments/dev/main.tf</div>
            <pre className="whitespace-pre text-sm text-neutral-700 font-mono">{CALLER_OUTPUT_SNIPPET}</pre>
          </div>
          <p className="text-sm text-neutral-500 pt-1">
            Two values, one round trip: <code>memory</code> goes down as a{" "}
            <code>variable</code>; <code>service_url</code> comes back up as an{" "}
            <code>output</code>.
          </p>
        </div>
      ),
    },
    {
      section: "4. Modules",
      title: "This App's Own Modules",
      body: (
        <p>This app&rsquo;s own infrastructure is organized into exactly six modules:</p>
      ),
      visual: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODULES.map((m) => (
            <StatCard key={m.name} label={m.name} value=" " note={m.role} />
          ))}
        </div>
      ),
    },
    {
      section: "4. Modules",
      title: "Reusing the Cloud-Run Module for Dev and Prod",
      body: (
        <div className="space-y-2">
          <p>
            The dev and prod environments use the exact same <code>cloud-run</code> module — the
            same resource blocks. Only the variable values passed in are different. Production
            needs more memory, and at least one instance always warm. Dev needs neither.
          </p>
          <p>
            A module is called with a <strong>module block</strong>. <code>source</code> points
            to its code; everything else overrides one of its variables.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-3">
          <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
            {"infra/\n" +
              "├── modules/\n" +
              "│   └── cloud-run/\n" +
              "│       ├── main.tf\n" +
              "│       └── variables.tf\n" +
              "└── environments/\n" +
              "    ├── dev/main.tf\n" +
              "    └── prod/main.tf"}
          </pre>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["dev", "prod"] as EnvName[]).map((env) => (
              <div key={env}>
                <div className="font-mono text-sm text-neutral-500 mb-1">environments/{env}/main.tf</div>
                <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
                  {moduleCallSnippet(env)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      section: "4. Modules",
      title: "Try it yourself: pick an environment",
      body: (
        <p>See the same module produce different settings, depending on which environment calls it.</p>
      ),
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
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Memory" value={envConfig.memory} />
          <StatCard label="Min instances" value={`${envConfig.minInstances}`} />
          <StatCard label="Max instances" value={`${envConfig.maxInstances}`} />
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
            <li>Terraform&rsquo;s files are written in HCL. Providers say which cloud. Resources each declare one real thing. Variables avoid hardcoding values.</li>
            <li><code>init</code> — downloads provider plugins.</li>
            <li><code>plan</code> — previews changes.</li>
            <li><code>apply</code> — makes them real.</li>
            <li><code>destroy</code> — reverses them.</li>
            <li>The state file is Terraform&rsquo;s record of what it created. Losing it makes Terraform think nothing exists yet.</li>
            <li>Modules bundle resources for reuse. The same module works across dev and prod, with different variables.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "5. Wrap-up",
      title: "Applying This for Real, Next",
      body: (
        <p>
          Every idea here has been about one service in isolation. The next chapter provisions
          this app&rsquo;s actual cloud infrastructure — Cloud Run, Firestore, Cloud Storage, and
          Artifact Registry, all together. It provisions the exact container image that CI/CD
          &amp; Deployment builds and promotes.
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
