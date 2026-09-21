# Module 5 — LLMOps: status

Per `docs/spec.txt` section 20, this module has two roles once built: user-facing educational
content *and* the operational infrastructure the other modules run on (experiment tracking,
versioning, CI/CD, deployment, monitoring, observability, cost monitoring, regression detection,
rollback — spec sections 21-29).

## Planned Units (4, consolidated from spec.txt sections 21-29 + the Containers addition below)

Following the same consolidation logic Inference used (Module 4): fold tightly-coupled spec
sections into one Unit's Sections rather than forcing a 1:1 Unit-per-spec-section mapping, and
order Units to match spec section 30's own "Complete User Journey" (save/compare versions → pass
an eval gate and deploy → generate traffic and monitor → detect a regression and roll back).

1. **Experiment Tracking** (`/llmops/experiment-tracking`) — spec 21 (Experiment Tracking) + 22
   (Versioning). Versioning is the data model underneath tracking (what gets versioned); tracking
   is comparing across those versions — the same relationship KV Cache had to vLLM in Inference.
2. **CI/CD & Deployment** (`/llmops/ci-cd`) — spec 23 (CI/CD) + 24 (Deployment) + Containers (new
   topic, see below). Built as 2 Chapters on one Unit page, not 1: Containers (a packaging/format
   topic) turned out to share only one connecting thread with the Pipeline-and-Promotion workflow
   that follows it — the Deploy step happens to use a container — so they're separate Chapters,
   switched by tab, rather than one Chapter forcing a throughline that wasn't really there.
3. **Monitoring & Observability** (`/llmops/monitoring`) — spec 25 (Monitoring) + 26
   (Observability) + 27 (Cost Monitoring). All three are facets of watching one running
   system; cost is folded in as one more monitored number rather than its own Unit, avoiding
   re-teaching cost mechanics GenAI Systems and Inference's Performance chapter already cover.
4. **Regression & Rollback** (`/llmops/regression-rollback`) — spec 28 (Regression
   Detection) + 29 (Rollback). Sequential and tightly coupled: detect the drop, then revert to it.

Each Unit stays a single-Chapter page (one walkthrough), exactly like every Inference Unit — no
tab-switcher needed.

**A 2026 gap check was raised and resolved**: "Guardrails / Safety Monitoring" (prompt-injection
detection, content filtering) is a real 2026 LLMOps topic not in the original spec. Considered as
a possible light addition to Monitoring & Observability, but on checking the rest of the app it
turned out to already be covered — thoroughly — by `AgentWalkthrough.tsx` in GenAI Systems (an
untrusted-tool-result injection example, plus an interactive approve/deny gate before risky tool
calls; see `module-2-genai-systems.md`'s gap-check item 10). Prompt injection and unsafe tool
execution are fundamentally an *agent* concern (the attack arrives through what an agent reads
and acts on), so that Chapter is the more natural home than a production-metrics dashboard.
Monitoring & Observability does not need its own Guardrails content.

## What's implemented

### Experiment Tracking (`/llmops/experiment-tracking`)

18 Steps across Welcome + 4 Sections + Wrap-up. Initially scoped to re-teach "what is an AI
Artifact" and "comparing two versions" from scratch, then reframed after discovering both are
already taught elsewhere in this app: Evaluation Basics ("An AI Artifact Is What You're Testing"),
GenAI Systems' RAG chapter (what one version's configuration stores), and Evaluation's Regression
Testing chapter (comparing v1 vs. v2 on quality/latency/cost — the *exact* numbers this Unit
reuses: Model A → Model B, quality 88→84, latency 900ms→650ms, cost $0.004→$0.002). Re-teaching
any of that would have been pure duplication — this Unit's real, non-redundant job: scaling from
one before/after check to tracking every version systematically, and treating *what changed*
(model/prompt/dataset/configuration) as trackable alongside the resulting scores. Extends the same
"My RAG" Artifact to a genuine 3-way comparison with a new v3 (quantizing Model B to INT8, reusing
Inference's Quantization Unit's own numbers — real speed/cost gains, modest quality risk).

**Important correction, made mid-build after explicit user feedback**: every explanation was
rewritten to be fully self-contained — a reader who never opened Evaluation, GenAI Systems, or
Inference must still follow this Chapter completely, not just "a reader who completed the prior
Units" (the app's general pedagogy-guidelines.md standard). Concepts borrowed from other modules
(what an AI Artifact is, why v1→v2's quality dropped despite fixing a bug, what quantizing to INT8
means) are each explained fresh in one paragraph; earlier modules get only a light, optional "see
also" mention, never a load-bearing dependency. This is a deliberately lighter-touch depth than
those original chapters' own teaching arcs, not a full replay of them.

Plain house style (no Southwear/Chloe/Maya dialogue) — explicit user choice, even though the
numbers and story continue directly from Evaluation's own Regression Testing chapter.

`ExperimentTrackingLab.tsx` unlocks after completion: weight quality/latency/cost by priority with
three sliders, and see which of v1/v2/v3 wins under that weighting — verified in-browser: quality
weighted to 100/0/0 makes v1 (highest quality) the winner; default weights (50/25/25) favor v3.

User feedback flagged this Unit as possibly too thin on content after it shipped — decision on
whether/how to expand deferred until after the next chapter (see the auto-memory note
`project_llmops_experiment_tracking_depth.md`, not duplicated here since memory already tracks it).

Verified: `tsc --noEmit` and `eslint` clean; live-verified in-browser end to end.

### CI/CD & Deployment (`/llmops/ci-cd`)

Originally built as one single-Chapter Walkthrough (21 Steps, 3 Sections combining Containers,
CI/CD, and Deployment). A user question caught that this was the wrong shape: Containers (a
packaging/format topic) and the Pipeline-and-Promotion workflow that follows share only one
connecting thread — the pipeline's Deploy step happens to use a container — not enough to justify
one continuous Chapter. Restructured into this Unit's first genuine **multi-Chapter page**,
matching the pattern Fundamentals' Transformers Unit already established (several Chapters on one
page, switched by tab via a `CHAPTERS` array and `activeChapter` state in the Unit's `*Lab.tsx`,
not by route) — every other Unit built so far (all of Inference, Experiment Tracking) had been
single-Chapter and didn't need this.

- **`ContainersWalkthrough.tsx`** (Chapter 1, 20 Steps across Welcome + 4 Sections + Wrap-up).
  Went through several rounds of small accuracy fixes (splitting the weights/multi-stage-build
  conflation, adding then removing a dedicated "runtime" Step) before a much larger rebuild: a
  user reported the whole Chapter as hard to follow generally and supplied
  `docs/product/containers-3d-print-metaphor.md` (copied into the repo from a `Downloads` file) —
  a metaphor reference document mapping every Docker concept onto **3D-printing a movie set**.
  Verified technically accurate before use (no errors found — it correctly keeps `EXPOSE`/`VOLUME`
  as declarations rather than actions, correctly separates the multi-stage-build concern from
  where weights live, and correctly ties isolation to Namespace), then the whole Chapter was
  rebuilt around it, translated to English for this app's house style — and, after a follow-up
  audit against the same reference doc, corrected everywhere the English rendering had silently
  drifted from the doc's exact terms (Image → "the finished 3D data package," not "a blueprint";
  model weights connect to "a giant vault through a hole in the wall," not "a warehouse"; secrets
  go on "a today's operating instructions board," not "handed over"; a registry is "a shared 3D
  data website," not "a library"). Step titles use the real technical term only, never the
  metaphor alone (e.g. "Secrets Don't Go in the Image," not "...in the 3D Data Package"); each
  Step's body opens with "**\<term\>** is like \<metaphor\>," then explains — applied consistently
  after a user question asked for this exact opening pattern chapter-wide. Sections: **1. What
  Containers Solve** (works-on-my-machine → **Namespace**, added later to name the isolation
  mechanism every "hole in the wall" Step already relied on → image vs. container → what's inside
  the image → what's inside a running container, split into two Steps after a user question
  caught that the merged version conflated image-static content with container-only content, and
  further extended to cover **Memory** and **Storage** as container-internal resources alongside
  the running process, closing a gap the user found by asking directly whether containers include
  them) → **2. Building an Image** (Dockerfile anatomy → the remaining instructions
  `WORKDIR`/`EXPOSE`/`VOLUME`/`USER`/`ENTRYPOINT` → where model weights live → multi-stage builds
  → GPU access) → **3. Connecting Containers** (new Section added in the same follow-up pass:
  port mapping → Docker networks → Docker Compose) → **4. Sharing Images Safely** (registry →
  secrets → a genuinely interactive "what invalidates the build cache" Try-It-Yourself). Closes
  with an inline "Continue to Pipeline & Deployment →" button calling
  `onNavigateToChapter("pipeline")` — the same in-body chapter-link pattern (not a page `Link`)
  Transformers' Chapters use.
- **`PipelineWalkthrough.tsx`** (Chapter 2, 13 Steps across Welcome + 2 Sections + Wrap-up): Code →
  Test → Evaluate → Threshold → Deploy, with a real interactive gate Step (pick one of Experiment
  Tracking's own v1/v2/v3 — quality 88/84/80 — and a threshold, pass/fail computed live via
  `chosen.quality >= threshold`), then Development → Staging → Production environment promotion,
  tying a deployment back to one exact version. Its `onComplete` is what unlocks the Unit-level
  "Explore it yourself" sandbox, matching Transformers' pattern where only the *last* Chapter's
  completion unlocks the shared sandbox below.
- **`CiCdLab.tsx`** is now the Unit-level orchestrator, not a Chapter itself: renders the
  `CHAPTERS` tab row, the active Chapter's Walkthrough, and (once Chapter 2 completes) the
  threshold + environment-promotion "Explore it yourself" sandbox, unchanged from before.

Both Chapters' Back buttons simply disable at Step 1 rather than jumping to the other Chapter's
last Step (no cross-Chapter Back-jump) — the same restraint Transformers' own later Chapters show,
relying on the always-visible tab row for chapter-to-chapter navigation instead.

Every explanation stays self-contained by the same standard Experiment Tracking was held to —
Containers doesn't depend on other modules to begin with, but the GPU-access Step and the Evaluate
stage's "a quality score" are each explained fresh rather than assumed.

Verified: `tsc --noEmit` and `eslint` clean; live-verified in-browser end to end — the tab switcher,
both Chapters' full Step sequences, the inline chapter-link button, and (previously, on the
pre-split version) both the pass and fail paths of the threshold gate and the full promotion
sequence, unaffected by the split since that logic only moved files, not behavior.

### Monitoring & Observability (`/llmops/monitoring`)

`MonitoringWalkthrough.tsx`, 23 Steps across Welcome + 4 Sections + Wrap-up, single-Chapter (no
tab switcher, per this Unit's own plan above). Built to match Evaluation Basics' care level per
explicit user instruction — not Experiment Tracking's deliberately lighter touch — after a
planning conversation surveyed spec sections 25 (Monitoring), 26 (Observability), 27 (Cost
Monitoring), and 9 (Shared Observability Model).

One scenario threads every Section, the same way Evaluation Basics threads one refund-policy bug
through Correctness/Faithfulness/Relevancy: v2 (the version CI/CD & Deployment's Environment
Promotion chapter walked through promoting to Production) shows a healthy-looking average latency
(310ms) that p95 (2320ms) exposes as hiding a real slow tail — an Evaluation-Basics-style "not
every metric would have caught this" reveal. Observability then inspects that exact request as a
trace (Request → Agent → RAG → Retriever → LLM → Response, spans summing to exactly 2320ms so the
arithmetic checks out), finds Retriever is 80% of the total, and a second trace shows an LLM
timeout the Agent chapter's own one-retry rule recovers from. Cost Monitoring stays deliberately
light (per the Planned Units section above) and reuses Experiment Tracking's exact v1/v2/v3
numbers (quality 88/84/80, cost $0.004/$0.002/$0.0009) for its own Try-It-Yourself. The Shared
Telemetry Model Section closes by naming spec 9's exact 14 fields and showing monitoring/
observability/cost as three different reads of that same record set.

Three Try-It-Yourself Steps are genuinely interactive: a "simulate next hour of traffic" button
that jitters every dashboard number together, a clickable trace where selecting a span reveals its
own latency and (for Retriever) the bottleneck callout, and a version/volume picker where changing
either live-recomputes the estimated monthly cost. `MonitoringLab.tsx` adds a post-completion
"Explore it yourself" sandbox — pick any of the three versions and a monthly volume, see cost,
projected errors, and projected p95 move together (illustrative scaling against the walkthrough's
own baseline numbers, not a real production model, documented as such in the file).

A "Guardrails / Safety Monitoring" 2026 gap-check surfaced while planning this Unit and was
deliberately kept out after a full-app survey found it already covered by GenAI Systems'
`AgentWalkthrough.tsx` (untrusted-tool-result prompt injection + an interactive approve/deny gate
before risky tool calls) — see that Unit's gap-check item 10 in `module-2-genai-systems.md`, which
that survey also found already closed along with items 7 (parallel tool calls) and 9 (MCP), all
three previously mis-marked "not yet implemented" in this doc's sibling.

Verified: `tsc --noEmit` and `eslint` clean; live-verified in-browser end to end — the p95 reveal,
the traffic simulator, the clickable trace (including the Retriever bottleneck callout), the cost
calculator across all three versions, and the post-completion sandbox.

### Regression & Rollback (`/llmops/regression-rollback`)

`RegressionRollbackWalkthrough.tsx`, 18 Steps across Welcome + 2 Sections + Wrap-up,
single-Chapter, the module's fourth and last Unit (spec 28 + 29). Built to match Evaluation
Basics' care level per explicit user instruction, continuing Monitoring & Observability's
one-scenario-per-chapter approach rather than starting a fresh, disconnected example.

The scenario picks up exactly where Monitoring & Observability left off: v2 is live with a
sampled live score of 82/100 (that exact number, not a new one). A new version, v4 — shipped to
cut cost further — scores 83/100 on the fixed deploy-time evaluation (barely clearing CI/CD &
Deployment's 82 threshold) but collapses to 58/100 once exposed to real traffic. This directly
pays off a line Monitoring & Observability's "A Live Evaluation Score" Step already planted
("real traffic is never quite the same mix of questions as the fixed evaluation set that
approved it") by showing a case where that gap is severe rather than mild. Section 1 (Regression
Detection) also reuses Evaluation's own Regression Testing chapter numbers (v1 → v2: quality
88 → 84, latency 900ms → 650ms, cost $0.004 → $0.002) as a contrasting *mild, accepted*
regression, so the reader sees both ends of "how big a drop is too big" side by side. Section 2
(Rollback) mirrors CI/CD & Deployment's "The Same Image, Promoted Forward" Step in reverse ("The
Same Image, Pointed Backward"), and ties rollback's mechanism directly back to the AI Artifact
concept Experiment Tracking established (nothing is rebuilt — Production's pointer just moves
back to a version that was never deleted).

Two Try-It-Yourself Steps are interactive: a regression-check Step (pick a candidate version and
a threshold, see a live pass/fail verdict against v2's 82 baseline) and a rollback Step (a single
button flips the flow diagram from "v4, regression" to "Rollback → v2 restored" and the served
version's live score back to 82). `RegressionRollbackLab.tsx` adds a post-completion "Explore it
yourself" sandbox — freely pick any live score and threshold and see the verdict, rather than
being limited to the Walkthrough's two fixed candidates. Closes on an explicit callback to spec
section 30's complete user journey ("Improve → Return to Evaluation"), since this is the last Unit
of the last Module.

Verified: `tsc --noEmit` and `eslint` clean across the whole frontend; live-verified in-browser end
to end — both Try-It-Yourself Steps' interactivity and the post-completion sandbox.

## Containers section — original plan (built as described above)

### Containers (new topic — not in the original spec)

Prompted by a direct question about whether CUDA, IAM, CI/CD, and containers are covered
anywhere in this app's planned content (see `module-2-genai-systems.md`'s own 2026 topic audit
for the same kind of review applied to GenAI Systems). Findings from checking `docs/spec.txt`
directly:

- **CI/CD** — already planned in full (spec section 23: an interactive `Code → Test → Evaluate →
  Threshold? → Deploy` pipeline). Just not built yet. No content gap, only an implementation gap.
- **IAM** — present, but only as *infrastructure* for deploying this app itself (Terraform-managed,
  spec sections 36/37/39), never as something a learner is taught about. Spec section 44
  explicitly lists "enterprise IAM complexity" as something to avoid overbuilding. Correctly
  scoped as-is — not worth promoting to curriculum.
- **CUDA** — not mentioned anywhere in spec.txt. Too low-level/specialized for this app's stated
  audience (AI engineering, not GPU systems programming) to justify a dedicated topic — but see
  "GPU inside a container" below, where a light mention earns its place for free.
- **Containers (Docker)** — not mentioned anywhere in spec.txt, despite Cloud Run (the planned
  deployment target) running containers under the hood and "Artifact Registry" (a container image
  registry) already being in the Phase 2 infrastructure list (spec section 36). Judged worth
  adding: real gap, directly touches infrastructure this app already depends on, and is
  foundational to how the already-planned CI/CD pipeline's `Deploy` step and the already-planned
  Deployment section (spec section 24: `Development → Staging → Production`) actually work in
  practice.

**Depth: concept and visualization only, no hands-on Docker required.** This app's Phase 1
philosophy is local-first with nothing but the mock backend as a dependency (the same reasoning
spec section 19.8 uses for GPU: "GPU infrastructure should be optional... Simulation Mode should
provide educational behavior... do not require permanently running GPUs"). Requiring a real
Docker daemon to learn this topic would break that pattern. No Dockerfile exists anywhere in this
repo yet (Phase 1 doesn't containerize anything) — any example shown is explicitly illustrative,
not this project's own real file, the same honesty convention used for every mock/simplified
example elsewhere in this app (e.g. Tiny LLM's illustrative training-progression text, LLM API's
illustrative conversation-cost numbers).

**Placement**: one Section inside Module 5 LLMOps, between the already-planned CI/CD (spec
section 23) and Deployment (spec section 24) sections — not a new Unit. Roughly matches Prompt
Engineering's walkthrough size (13 Steps) but slightly lighter (~9 Steps), all client-side/
schematic like every other Chapter's guided walkthrough, following `pedagogy-guidelines.md`.

Planned Steps, gap-checked against 2026 AI-engineering practice (not generic Docker 101):

1. **Why package at all** — the "works on my machine" problem: code plus its exact runtime
   environment, moved together.
2. **Image vs. container** — the class/instance analogy this app already leans on elsewhere: one
   image, any number of running containers from it.
3. **Anatomy of a Dockerfile** — base image → install dependencies → copy code → start command,
   shown as an illustrative simplified example (explicitly labeled as such, not a real file from
   this repo).
4. **ML images get big** — PyTorch/CUDA libraries and model weights can push images into the
   multi-gigabyte range; multi-stage builds as the standard fix, tying directly to Inference's
   already-planned GPU-memory/latency content.
5. **GPU inside a container** — a CUDA-enabled base image plus the NVIDIA container runtime is
   what lets a container reach the host GPU at all; this is where CUDA earns a one-line mention,
   without becoming its own topic.
6. **Registry: where images live** — push/pull, landing directly on spec section 36's already-
   planned Artifact Registry.
7. **Secrets don't go in the image** — config and credentials via environment variables at
   *run* time, not baked in at *build* time — a direct application of spec section 39's "no
   secrets in Git" / "environment variables / secret management" requirement.
8. **Connects to what's already planned** — this Chapter's Deploy step is "build → push → Cloud
   Run pulls and runs it," linking straight into the CI/CD pipeline (section 23) and the
   Development → Staging → Production flow (section 24) — and names Cloud Run explicitly as a
   *managed* way to run containers, sparing this app (per spec section 44) from ever needing
   Kubernetes.
9. **Try it yourself** — a lightweight interactive Step requiring no real Docker install (e.g.
   reordering build steps and predicting which ones get cache-invalidated by a code change) —
   consistent, "genuinely interactive, not just illustrative" per `pedagogy-guidelines.md`.
