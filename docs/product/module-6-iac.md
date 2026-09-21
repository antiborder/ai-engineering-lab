# Module 6 — Infrastructure as Code: status

## Why this module, and why now

Originally scoped narrowly as a "Terraform" Unit inside a separate, unscaffolded app (see
`docs/product/infra-ml-systems-playground.md`'s Module C), under the rule that a curious general
AI learner doesn't need infrastructure-as-code tooling. Reversed by explicit user request:
broadened from "teach Terraform" to "teach Infrastructure as Code as a concept, with Terraform as
the deep-dive representative example" — general enough to belong in AI Playground itself, the
same way Module 5's Containers Unit (also infra-adjacent) already does.

Sequenced right after Module 5 (LLMOps): Module 5's CI/CD & Deployment builds and promotes a
container image; this module covers what actually provisions the cloud infrastructure that image
runs on. Containers itself is not duplicated here — it stays in `module-5-llmops.md` — but this
module's Unit 3 uses that same image as its running example of what gets deployed.

Grounded in this app's own real target architecture (spec.txt sections 34/36/37): GCP, Cloud Run,
Firestore, Cloud Storage, Artifact Registry, IAM — not a generic, disconnected cloud example.

## Planned Units (4)

1. **What Infrastructure as Code Is** — the conceptual foundation every later Unit assumes:
   declarative vs. imperative, code vs. manual changes ("ClickOps"), idempotency, drift, and
   plan-before-apply as a safety pattern. No tool-specific syntax yet.
2. **Terraform: Declaring Infrastructure** — the deep-dive representative example. HCL basics
   (providers, resource blocks, variables), a concrete resource definition (e.g. a Cloud Run
   service), the `init` → `plan` → `apply` → `destroy` workflow, what the state file is and why
   it matters, and modules as reusable building blocks — using this app's own planned
   `infra/modules/{cloud-run,firestore,storage,artifact-registry,monitoring,iam}` layout
   (spec.txt:1421-1441) as the running example throughout, not an invented one.
3. **Provisioning This App's Own Cloud Infrastructure** — applies Unit 2's concepts to this app's
   actual target architecture (spec.txt:1479-1518): Cloud Run, Firestore, Cloud Storage, Artifact
   Registry, monitoring/logging. Closes the loop with Module 5: the exact container image CI/CD &
   Deployment built and promoted is what Cloud Run, provisioned here, actually runs.
4. **IAM & Least-Privilege Security** — service accounts, roles, and the least-privilege
   principle, using this app's own `infra/modules/iam/` as the concrete example (a Cloud Run
   service account scoped to only what it needs, not project-owner).

Each Unit built to Evaluation Basics' care level per explicit user instruction: one concrete
scenario threaded through a Unit's Steps rather than disconnected examples, genuine interactivity
(not just StatCard readouts), and self-contained explanations that don't assume any other Module
was read.

## What's implemented

Plumbing: `iac` added to `lib/modules.ts` (`MODULES`), giving it a spot in `GlobalNav` and the
homepage's module grid automatically; homepage copy corrected from "five" to "six connected
modules". Unit index at `/iac` (`app/iac/page.tsx`) lists all 4 planned Units, one still
"Coming soon".

### What Infrastructure as Code Is (`/iac/what-is-iac`)

`WhatIsIacWalkthrough.tsx`, 20 Steps across Welcome + 3 Sections + Wrap-up, built to Evaluation
Basics' care level per explicit user instruction. One scenario threads every Section: this app's
own backend Cloud Run service (region `us-central1`, memory `512Mi`), starting from a 2 a.m.
manual console fix that gets silently undone weeks later — the concrete failure mode Section 1
names precisely (no record of the change, no review, a teammate's redeploy overwrites it) before
Infrastructure as Code is introduced as the fix. Section 2 (declarative vs. imperative) and
Section 3 (drift and safety) reuse that same service's numbers throughout rather than switching
examples. Deliberately tool-agnostic — no Terraform syntax appears; the closing Step names
Terraform for the first time as what the next Unit turns these same ideas into. A follow-up
"Major IaC Tools" Step was added after that closing Step, at explicit user request, moved there
after an earlier draft placed it inside the Terraform Unit instead — a ranked table of real 2026
IaC tools (Terraform, OpenTofu, AWS CloudFormation, Pulumi, Azure Resource Manager/Bicep, Google
Cloud Deployment Manager, Crossplane), reframed neutrally as "examples of the field" rather than
"where Terraform ranks," per a follow-up user correction.

Three Try-It-Yourself Steps are genuinely interactive: provisioning the same service "by hand"
repeatedly produces a different, randomized config each time, visibly contrasted with one
always-identical config applied from a shared file; a declarative-vs-imperative counter Step
where the declarative button always converges an arbitrary starting count to 3 (idempotent) while
the imperative button keeps adding 2 forever; and a drift-check Step where a "someone changes it
by hand" button desyncs the actual value from the declared one, caught by a "check for drift"
button. `WhatIsIacLab.tsx` adds a post-completion "Explore it yourself" sandbox — pick any actual
memory value and see the drift verdict live, rather than the Walkthrough's one fixed scenario.

Verified: `tsc --noEmit` and `eslint` clean across the whole frontend; live-verified in-browser
end to end — the nav bar and homepage grid pick up the new module automatically, the Unit index
page, and all three Try-It-Yourself Steps' interactivity plus the post-completion sandbox.

### Terraform: Declaring Infrastructure (`/iac/terraform`)

`TerraformWalkthrough.tsx`, 32 Steps across Welcome + 4 Sections + Wrap-up, built to Evaluation
Basics' care level per explicit user instruction. Continues Unit 1's exact scenario — the same
backend Cloud Run service, same `us-central1` region, same `512Mi` memory — now written as real
HCL, so the module reads as one continuous narrative rather than two disconnected examples.
Section 1 (Writing HCL) opens with a dedicated "What Terraform Is" Step (what the tool actually
does, and that it works across clouds through providers) before any syntax, added after an
explicit user review flagged that the chapter never stated this outright. It then shows the
actual `variable`, `provider`, and `resource` blocks that declare that service, all as one single
file throughout — matching what the code panel itself actually shows. The Providers and Resources
Steps each show the full file with just their own block highlighted (reusing the same
cyan-highlight/dim-the-rest `hclSnippet` design the "spot the pieces" Step already used), and the
Resources Step additionally zooms into the `resource` line itself, marking its two quoted
arguments individually — type in cyan, local name in amber (the chapter's own existing "pending
change" accent color) — with a small arrow-and-label callout under each, aligned to the argument's
exact column via the CSS `ch` unit rather than hand-counted spaces. The Variables Step was
retitled "Input Variables" and its body now names that pairing explicitly ("also called an input
variable... the next Step covers its counterpart") — a follow-up review round caught that only
Output Values used Terraform's own paired terminology. A new "Output Values" Step closes out
Section 1's block-by-block walkthrough (after Input Variables, before the file-split and the
interactive) — the earlier review flagged that `variable` (input) had no `output` counterpart —
using an `output "service_url"` block that reads `google_cloud_run_v2_service.backend.uri`,
deliberately referencing the resource by the exact local name the Resources Step just explained.
Only once the full single-file example is complete does a new "One File, or Several?" Step explain
that Terraform reads every `.tf` file in a directory together, and that splitting by convention
into `main.tf` / `variables.tf` / `outputs.tf` is optional and purely for readability — a
three-card diagram maps each file to the block types it conventionally holds. This was deliberately
sequenced after the single-file example, not folded into the earlier HCL Step, per explicit user
direction: an earlier version stated the file-split convention before the code panel itself had
ever shown anything but one file, which read as contradictory. Section 2 (The Workflow) opens with
an overview Step — a
color-coded diagram of the full `init` → `plan` → `apply` cycle looping back to itself for every
future change, with `destroy` shown as the one-way branch off it — before walking `init` → `plan`
→ `apply` → `destroy` individually; the `plan` and `apply` Steps also show the concrete flag each
one commonly needs in practice (`-var` to override a declared variable without editing the file;
`-auto-approve` to skip the confirmation prompt for unattended CI/CD runs), each broken down piece
by piece the same way the Resources Step's anatomy list already does. All four commands — `init`,
`plan`, `apply`, `destroy` — show a realistic terminal transcript of the command and its output;
`init` and `destroy` keep theirs plain (no flag breakdown), since neither needs a flag for this
Unit's scenario. The `plan` and `apply` Steps also now explain `-out=tfplan` and applying that
saved file (`terraform apply -auto-approve tfplan`) — added after a review question surfaced a real
gap: the `plan` Step's `-var` example and the `apply` Step's example weren't actually the same
session, so `apply` never re-supplied `project_id`. Rather than just cosmetically matching the two
examples, the fix explains the actual mechanism: an unsaved `plan` is only a preview, and `apply`
re-plans internally unless it's applying a saved plan file, in which case the reviewed values are
already locked in and don't need `-var` again — the real reason CI/CD pipelines save and apply a
plan file rather than re-planning at apply time. Section 3 (State) opens by showing a default
Terraform project's file tree —
`main.tf`, `variables.tf`, `outputs.tf`, `.terraform/`, `terraform.tfstate` — with
`terraform.tfstate` highlighted and captioned, using the exact same highlight-and-caption design
as the Resources Step's argument callouts. The body text explicitly disambiguates `.terraform/`
(downloaded provider plugins) from the state file (the project root, next to the `.tf` files) —
added after a review round proposed nesting the state file inside `.terraform/`, which is not how
Terraform's default local backend actually behaves. A follow-up sentence gives the reason the two
are kept apart: `.terraform/` is disposable — `terraform init` rebuilds it any time — while the
state file is not, so collapsing them into one directory would make it easy to delete both
together. Section 4 (Modules) uses this app's own real, planned six-module layout — `cloud-run`,
`firestore`, `storage`, `artifact-registry`, `monitoring`, `iam` — not an invented one, and shows
the same module resolving to different `dev`/`prod` values. The Reusing-the-Cloud-Run-Module Step
also now shows a real `module` block calling site side by side for `dev` and `prod` — same
`source`, different variable values, pulled from the same `ENV_CONFIGS` the interactive Step
already used, so the two can never drift apart — plus the file tree that layout implies
(`infra/modules/cloud-run/` called from `infra/environments/{dev,prod}/`).

A sharp line a review round surfaced was missing — splitting code across files within one
directory has no effect on Terraform (it's still read as one whole), but splitting into a new
directory creates a real module boundary — is now taught across two dedicated Steps rather than
one, per explicit user direction after the first combined version's diagram drew a comment asking
what it was meant to show. "Files vs. Folders: Where the Boundary Is" makes the negative case only:
a bulleted contrast (files vs. directories) paired with two visuals — a dashed "no boundary" box of
merged files, and a solid box pair joined by a red ✕ captioned "No direct reference crosses this
line." "Crossing the Boundary: Variable In, Output Out" then makes the positive case, briefly: the
same `environments/dev/` → `modules/cloud-run/` box pair, now joined by `variable →` / `← output`
arrows, with a caption stating plainly that the two flags are the only sanctioned way across — not
an exception to the boundary, but the channel the boundary is designed to have. It closes by
naming that the next two Steps take each direction in turn, with real code.

Those two Steps followed a further user request to split "each direction, in detail, with real
code" out on its own — an earlier single-Step version tried to show both directions' code at once
and read as too dense. "Variable In: Passing a Value to the Module" shows the full chain forward —
`environments/dev/main.tf`'s `memory = "512Mi"` argument, down into `modules/cloud-run/variables.tf`'s
matching `variable "memory"` declaration, down into `modules/cloud-run/main.tf`'s resource actually
reading `var.memory` — each stage connected by a small arrow captioned with what's flowing at that
step. This `main.tf` is the one deliberate departure from Section 1's identical-looking resource:
Section 1 hardcodes `"512Mi"` for a simpler first read, while this version parameterizes it, which
is the actual change that makes the module reusable across `dev` and `prod`; the body text says so
explicitly rather than leaving the two versions to silently disagree. "Output Out: Getting a Value
Back" then shows the return trip — `modules/cloud-run/outputs.tf`'s `output "service_url"` (reading
`google_cloud_run_v2_service.backend.uri`, the resource's own post-deploy attribute) down into a new
`environments/dev/main.tf` output block, `output "backend_url" { value = module.cloud_run.service_url }`,
closing the loop a user question had specifically asked about: whether a module's output actually
reaches the calling environment's own code, and where. The Step's closing caption names all three
hops in one line: "the resource's attribute → the module's output → the caller's output."

A follow-up user request — modeled on a reference diagram of a real root-module/child-module AWS
example (`variables.tf` → `main.tf` → `outputs.tf` on both sides, connected by two colors of
arrow) — asked for one more Step right after "Output Out," showing the whole round trip as a
single picture rather than two separate ones. "The Full Round Trip: Root and Module Together"
renders it as one continuous five-box vertical chain instead of attempting the reference's full
2D box-and-arrow layout, to stay consistent with every other diagram already built in this
chapter: `environments/dev/main.tf`'s module call, down through `variables.tf` and `main.tf` (both
cyan, captioned with what's flowing — `memory = "512Mi"`, then `var.memory`), across to
`outputs.tf`, then back up into a second `environments/dev/main.tf` box reading
`module.cloud_run.service_url`. The two directions are color-coded — cyan captions for the value
going in, a new violet for the value coming out — matching the reference diagram's own blue/purple
distinction, introduced here since this is the first Step where both directions appear together
and need to be told apart at a glance.

Every Step's prose was also passed through a plain-language pass per explicit user instruction:
compound sentences over 20 words were split into short, plain subject-verb-object sentences, and
compressed/idiomatic phrasing (e.g. "apply commits that preview for real") was rewritten as direct
statements (e.g. "apply — makes the plan real").

Four Try-It-Yourself Steps are genuinely interactive, one per Section: a "spot the pieces" Step
that highlights the matching HCL lines (variable / provider / resource) on demand while dimming
the rest; a "run the workflow" Step that plays out `init` → `plan` → `apply` in order and then, on
a repeat `plan` after changing the memory value, correctly shows an update diff
(`~1 to update: memory 512Mi → 1Gi`) instead of a fresh-create message; a "plan without state" Step
contrasting a normal "no changes" plan against a lost-state plan that proposes recreating all 6
modules from scratch; and a "pick an environment" Step toggling the same module between `dev`
(512Mi, 0-2 instances) and `prod` (1Gi, 1-10 instances) resolved values. `TerraformLab.tsx` adds a
post-completion "Explore it yourself" sandbox — pick any desired memory value against the fixed
512Mi-applied service and see the resulting plan diff live.

A real interactive-logic bug was caught and fixed during this Unit's build: the `plan` button's
handler unconditionally reset the workflow stage back to `"planned"` on every click, which meant
re-planning after a successful `apply` incorrectly showed the generic first-time "create" message
instead of the intended update diff. Fixed by separating "what stage is the workflow in" from
"what was last planned for", so a re-plan after apply now correctly renders the update path.

Verified: `tsc --noEmit` and `eslint` clean across the whole frontend; live-verified in-browser
end to end — HCL highlighting, the full init/plan/apply cycle including the fixed re-plan-after-
apply path, the state-loss contrast, the dev/prod toggle, the Wrap-up recap, and the post-
completion sandbox.

### Provisioning This App's Own Cloud Infrastructure (`/iac/provisioning`)

`ProvisioningWalkthrough.tsx`, 21 Steps across Welcome + 4 Sections + Wrap-up, built to Evaluation
Basics' care level per explicit user instruction. Applies Unit 2's Terraform concepts to this
app's actual target architecture (spec.txt sections 34/36/37) instead of one illustrative
resource — Cloud Run (already fully declared in Unit 2), Firestore, Cloud Storage, Artifact
Registry, and a Monitoring & Logging module — reusing the same `infra/environments/{dev,prod}` +
`infra/modules/*` file layout Unit 2's own Modules Section already introduced, shown again here as
a Section 1 opening Step. Section 1 (The Full Stack, End to End) walks each service in turn,
explicitly contrasting Firestore (structured records) against Cloud Storage (files), and states
outright that Terraform creates the Artifact Registry repository but never builds or pushes an
image into it — that boundary belongs to Module 5's CI/CD pipeline, closing the loop with it by
reference rather than by re-teaching it. Section 2 (Wiring Resources Together) introduces two
concepts neither prior Unit covered: enabling GCP APIs first via `google_project_service`, and how
Terraform derives resource creation order from references between blocks, falling back to an
explicit `depends_on` only when no reference exists (enabling an API produces no value another
block would otherwise read). Section 3 (One Config, Two Environments) extends Unit 2's dev/prod
Cloud Run toggle across the whole stack, and makes a deliberate, non-obvious point: Artifact
Registry is the one module that is *not* duplicated per environment, since CI/CD & Deployment's
promoted image only means the same thing in both environments if they both pull from one shared
registry. Section 4 (Monitoring & Logging as Code) closes the loop with Module 5's Monitoring &
Observability chapter — its dashboards, traces, and live evaluation score all depend on resources
provisioned here (log export, metric collection, alert policies), shown as a real
`google_monitoring_alert_policy` block. IAM is named only where a resource needs a service account
to reference; least-privilege IAM itself is left to Unit 4, not repeated here.

Four Try-It-Yourself Steps are genuinely interactive, one per Section, matching Units 1-2's own
one-per-Section pattern: a "click a service, see what it's for" Step reusing the
highlight/dim-the-rest design Unit 2's `hclSnippet` already established; a "provision the stack in
the right order" Step with a real 5-node dependency graph (`apis → registry/firestore/storage`,
then `apis + registry → cloud_run`) where applying a resource out of order surfaces an actual
Terraform-style dependency error naming the missing prerequisite, rather than simply disabling the
button; a "compare dev and prod, service by service" Step extending Unit 2's env toggle across
Cloud Run, Firestore point-in-time recovery, Storage retention, and the monitoring alert
threshold at once; and a "pick an alert threshold" Step using the same slider-plus-`Equation`
comparison pattern the LLMOps Regression & Rollback chapter's regression-threshold Step already
uses (`error rate > threshold ⇒ alert fires`), reused here for a genuinely different scenario
rather than copied verbatim. `ProvisioningLab.tsx` adds a post-completion "Explore it yourself"
sandbox — the same alert-threshold slider, live, against the fixed 8% error rate the Walkthrough's
own Try-It-Yourself Step used.

Verified: `tsc --noEmit` and `eslint` clean across the whole frontend; live-verified in-browser end
to end — the Unit index page's "Coming soon" badge is gone and the card now links through, all
five body Steps' diagrams and code snippets render, the "click a service" highlight, the
dependency-graph exercise (both the out-of-order error and the full correct-order success path),
the dev/prod comparison toggle, the alert-threshold slider (including the alert firing/not-firing
transition), the Wrap-up recap, and the post-completion sandbox all confirmed working.

### IAM & Least-Privilege Security (`/iac/iam`)

`IamWalkthrough.tsx`, 20 Steps across Welcome + 3 Sections + Wrap-up, built to Evaluation Basics'
care level per explicit user instruction. Picks up the exact thread Unit 3's own closing Step left
open ("Every resource in this chapter can still do more than it strictly needs to") and resolves
it: this app's backend Cloud Run service, moved from a broad default identity to a dedicated
service account holding exactly three roles. Section 1 (Service Accounts) establishes the concept
— an identity software uses since no human is present when it runs — then names the real risk: a
new GCP project's default compute service account commonly carries the broad `Editor` role.
Section 2 (Roles) builds up permission → role → predefined-vs-custom → the actual
`google_project_iam_member` binding, deliberately stopping at predefined roles (spec.txt:1759
explicitly warns against "enterprise IAM complexity" — custom roles, org policies, and IAM
Conditions are named as existing but out of scope). Section 3 (Least Privilege) audits exactly
what this app's backend does (Firestore read/write, Storage read/write, pull its own image),
grants only the three matching roles to a dedicated service account, and wires it to Cloud Run via
the same `output`-then-cross-module-reference pattern Unit 2 introduced
(`module.iam.backend_service_account_email`) — giving the `infra/modules/iam/` module, named as a
placeholder three times across Units 2-3, its first actual content. The closing Step doubles as
the IaC module's own closing Step, tying back to this app's full build → provision → deploy →
monitor → secure lifecycle. A follow-up "Same Ideas, Different Names Across Clouds" Step was added
after Section 3, before the recap — at explicit user request, after a chat aside (not the app
itself) compared GCP's permission/role/service-account model against AWS and Azure. A 4-row table
maps permission, role, identity, and binding across all three clouds, flagging the one real trap:
GCP and Azure both use "Role" for a permission bundle, while AWS uses "Role" for the identity
itself instead (GCP's Service Account / Azure's Managed Identity).

Three Try-It-Yourself Steps are genuinely interactive, one per Section: a "what can the default
service account touch?" Step where clicking any of 6 real GCP services (Firestore, Cloud Storage,
Artifact Registry, Compute Engine, BigQuery, Pub/Sub) always confirms "yes, included in Editor,"
building toward a "reaches all 6 of 6" readout; a "pick a role, see what it grants" Step toggling
between `roles/editor` (all 6 resources, qualitative "thousands of permissions") and three
narrower predefined roles (1 resource each); and a "compare the blast radius" Step toggling the
backend's whole identity between default and scoped, showing only 3 of 6 resources stay reachable
once scoped. `IamLab.tsx` adds a post-completion "Explore it yourself" sandbox reusing that same
blast-radius toggle live, defaulted to the scoped state.

Verified: `tsc --noEmit` and `eslint` clean across the whole frontend; live-verified in-browser end
to end — the Unit index page's last "Coming soon" badge is gone (all 4 Units now live), the
service-account click exercise accumulating all 6 checks, the role-picker narrowing correctly per
role, the blast-radius toggle in both directions, the Wrap-up recap, and the post-completion
sandbox all confirmed working.

All 4 planned Units are now built — this module is complete.
