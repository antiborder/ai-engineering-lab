# 0001 — Toolchain and Phase 1 persistence

## Status

Accepted

## Context

The spec ([`docs/spec.txt`](../spec.txt)) leaves package managers unspecified and only fixes the *conceptual* data model (section 6) plus the Phase 2 cloud target, Firestore (section 36). Phase 1 must run with no GCP dependency (section 35).

## Decisions

- **Frontend package manager:** pnpm
- **Backend package manager:** uv (with `pyproject.toml`)
- **Persistence:** Firestore, accessed the same way in both phases.
  - Phase 1: local Firestore emulator (via `firebase-tools`), so the document model and client code are identical to Phase 2 production Firestore — no rewrite when moving to GCP.
  - Phase 2: real Firestore (section 36).
  - No relational database. All data (`AIArtifact`, `ArtifactVersion`, `Experiment`, `EvaluationRun`, observability records) is modeled as Firestore documents/collections, not SQL tables.
- **LLM providers:** mock providers only until real API keys are supplied. The `AIProvider` abstraction (section 10) is built first so real providers (OpenAI/Anthropic/Gemini) are a drop-in addition later.

## Consequences

- Local dev requires a JVM (Firestore emulator dependency) and `firebase-tools`, installed via Homebrew.
- All backend data-access code goes through a Firestore repository layer — no ORM, no SQL migrations.
