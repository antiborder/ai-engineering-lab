# Infra & ML Systems Playground — content plan

A separate, not-yet-scaffolded app. This document exists only to record the content-placement
decisions made while auditing what belongs in **AI Playground** (this repo) versus this future
app, so the reasoning isn't lost before the new app's own repo/scaffold exists.

## Audience split (the deciding rule)

- **AI Playground** (this app): a curious member of the general public who wants to deeply
  understand and build with AI. Every module here should be approachable without prior ML/infra
  background.
- **Infra & ML Systems Playground** (this app): not needed by that general learner, but essential
  for someone who wants to properly *practice* ML — plus general IT-infrastructure topics that
  AI systems happen to run on.

Anything that fails the "does a curious AI learner need this" test but passes "does an ML
practitioner or infra engineer need this" test belongs here instead.

## Content moved from AI Playground's original spec

### Module A — ML Serving & Systems — SUPERSEDED

(was: AI Playground Module 4 "Inference", spec.txt sections 19.1-19.8 — moved in full)

**Reversed**: this content is being built directly in AI Playground as its own Module 4
"Inference" instead of moved here — see `docs/product/module-4-inference.md`. Duplicating it
into a separate app later, if this app is ever split, was judged easier than maintaining two
copies now. The rest of this document (Modules B/C/D) is unaffected.

- Unit: Model Serving
- Unit: vLLM
- Unit: KV Cache
- Unit: Continuous Batching
- Unit: Quantization
- Unit: Performance
- Unit: Hosted API vs Self-hosted
- Unit: GPU

### Module B — MLOps / Production Lifecycle
(was: AI Playground Module 5 "LLMOps", spec.txt sections 21-29 — moved in full)

- Unit: Experiment Tracking
- Unit: Versioning
- Unit: CI/CD
- Unit: Deployment
- Unit: Monitoring
- Unit: Observability
- Unit: Cost Monitoring
- Unit: Regression Detection
- Unit: Rollback

Note: the underlying `AIArtifact`/`ArtifactVersion` Firestore data model (spec.txt "Core Data
Model") stays in AI Playground as invisible plumbing supporting its own cross-module artifact
flow (e.g. RAG's "Save as AI Artifact"). That's infrastructure the app runs on, not curriculum —
it does not correspond to this module's "Versioning" unit, which teaches versioning as a
practice.

### Module C — Cloud Infrastructure & IaC
(new module — not previously curriculum anywhere; assembled from spec.txt sections 36/37/39,
which existed only as *this app's own deployment infra*, never as taught content, plus the
Containers unit originally drafted for AI Playground's LLMOps module)

- **Unit: Terraform (Infrastructure as Code)** — GCP APIs / Cloud Run / Artifact Registry / IAM
  managed via Terraform (spec.txt:1522-1533, "All cloud infrastructure must be managed by
  Terraform")
- Unit: Cloud Deployment (Cloud Run, Artifact Registry, managed container hosting)
- Unit: IAM & Least-Privilege Security (spec.txt:1759 explicitly excluded this from AI
  Playground as "enterprise IAM complexity" — legitimate curriculum here)
- Unit: Containers (Docker) — relocated wholesale from `module-5-llmops.md`'s "Containers"
  section (image vs container, Dockerfile anatomy, ML images get big, GPU-in-container/CUDA
  mention, registry, secrets via env vars, ties to Cloud Run/CI/CD, try-it-yourself). See that
  file's now-superseded write-up for the full original 9-step plan; port the reasoning here when
  this app is scaffolded, then remove it from `module-5-llmops.md`.

## Additions from the 2026 topic audit (confirmed)

Audited independently of the original spec, the same way `module-2-genai-systems.md`'s "Planned
content additions" section audits GenAI Systems for 2026-era gaps. Three additions confirmed:

1. **LLM Gateway / multi-provider routing** — new unit, Module A. Rate limiting, cost-based
   routing, fallback across providers (LiteLLM/Portkey-style). Real gap: all current
   serving-related content assumes a single provider; by 2026 a gateway in front of multiple
   providers is close to standard practice. Good visualization fit (request → gateway →
   fallback → provider flow diagram).
2. **Fine-tuning / training infrastructure** — new unit, Module A. LoRA/QLoRA and PEFT concepts,
   kept concept-only the same way the Containers unit stays concept-only (no real GPU cluster
   required). Real gap: every existing unit in Module A is about *serving* a trained model;
   nothing covers how a model gets trained or fine-tuned. This is core "ML systems" territory a
   serving-only curriculum can't skip.
3. **Model/data drift detection** — new unit, Module B. Distinct from the existing Regression
   Detection unit (which compares artifact *versions* against each other): drift detection
   monitors production traffic distribution shifting away from training-time assumptions over
   time. Extends Module B's existing Monitoring/Observability units rather than duplicating them.

## Additions from the follow-up coverage audit (confirmed)

A second pass checking whether Modules A/B/C actually cover the full "Infra & ML Systems" domain
(excluding networking, and excluding anything AI Playground already teaches). Found one whole
missing category and one sharp, timely gap, plus several items that extend existing units rather
than needing new ones.

### New module

**Module D — Data Engineering for ML** (new module; nothing in A/B/C covered "preparing the data
that feeds ML/AI systems" at all). Judged as Infra & ML Systems territory, not AI Playground:
Feature stores, data pipelines, and data-quality gates are practitioner-level "properly doing ML"
concerns, not AI-understanding concerns a curious general learner needs. AI Playground's Module 3
"Dataset Builder" is scoped narrowly to building evaluation datasets and doesn't overlap.

- Unit: Feature Stores (feature reuse/consistency between training and serving, Feast/Tecton-style)
- Unit: Data Pipelines / ETL for ML (batch and streaming ingestion feeding training/inference)
- Unit: Data Quality & Validation (schema/drift checks before bad data reaches training or
  production — Great Expectations-style gates)

### New unit in Module C

**ML Supply Chain Security** — added to Module C, alongside (not replacing) IAM & Least-Privilege
Security. Distinct axis from IAM: not "who can access what" but "can this model's weights be
trusted at all" — provenance, signing, and scanning for malicious payloads in downloaded model
files (a real, timely 2025-2026 concern given how much of the ecosystem pulls weights from
public hubs).

### Extensions to already-confirmed units (no new units needed)

- Distributed training + hyperparameter tuning (multi-GPU/multi-node, Optuna/Ray Tune-style
  sweeps) → extends Module A's **Fine-tuning / Training Infrastructure** unit
- SLOs/SLIs/error budgets → extends Module B's **Monitoring** unit
- Cost optimization (spot/reserved capacity, autoscaling cost tradeoffs) → extends Module B's
  **Cost Monitoring** unit
- Model/dataset storage infrastructure (object storage) → extends Module C's **Terraform** /
  **Cloud Deployment** units
- Deployment governance / approval workflows → extends Module B's **CI/CD** / **Deployment**
  units

### Considered, not added (kept as backlog, lower priority)

Recorded so the reasoning isn't re-derived later:

- **Vector DB / embedding infra at scale** (ANN, HNSW, sharding) — judged as an extension of the
  existing Model Serving unit rather than a standalone one.
- **OpenTelemetry GenAI semantic conventions** — judged as an upgrade to the existing
  Observability unit's content (name real 2026 tooling/standards) rather than a new unit.
- **Secrets management (dedicated secret manager)** — folds into the Containers/Terraform units'
  existing "secrets via env vars" material.
- **Batch inference APIs** — folds into the existing Hosted API vs Self-hosted unit.
- **Speculative decoding** — folds into the existing Performance/vLLM units.
- **GPU cluster orchestration (Kubernetes/Ray)** — spec.txt section 44 excluded this from AI
  Playground by name ("do not overbuild... Kubernetes"), and that reasoning was written for AI
  Playground's general audience, not this app's practitioner audience. Legitimate candidate here,
  but scope risk is high (could balloon into its own app). Left as an open candidate, not
  confirmed.
- **Durable execution / agent reliability infra** (retries, idempotency, Temporal-style task
  queues) — the infra-reliability half of the "multi-agent orchestration" topic that
  `module-2-genai-systems.md` excluded from AI Playground on complexity grounds (the
  application-design half stays excluded from both apps for now). Plausible but niche; left open.
- **AI compliance / audit logging** (EU AI Act era) — topical for 2026 but regulatory content
  ages fast, varies by jurisdiction, and doesn't visualize well interactively. Judged low value
  relative to effort.
- **Dedicated model registry unit** (MLflow Model Registry-style) — judged redundant with the
  existing Versioning unit.

## Status

Planning only. This app has no scaffold, repo, or code yet — this document exists purely to
preserve the content-placement decisions made during AI Playground's own module-4/5 scoping
review, for whenever the new app is started.
