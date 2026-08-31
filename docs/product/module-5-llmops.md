# Module 5 — LLMOps: status

## What's implemented

Nothing yet — `/llmops` is still a placeholder page (`ModulePlaceholder.tsx`), same as
Evaluation and Inference. Per `docs/spec.txt` section 20, this module has two roles once built:
user-facing educational content *and* the operational infrastructure the other modules run on
(experiment tracking, versioning, CI/CD, deployment, monitoring, observability, cost
monitoring, regression detection, rollback — spec sections 21-29).

## Planned content additions

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
