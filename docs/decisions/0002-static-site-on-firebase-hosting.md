# 0002 — Publish as a static site on Firebase Hosting

## Status

Accepted (2026-10-18). Supersedes the Phase 2 target architecture in [`docs/spec.txt`](../spec.txt)
sections 36–38 and the Phase 2 part of [0001](0001-toolchain-and-persistence.md).

## Context

The app is ready to publish. Two requirements drive the decision:

- **No pay-per-use AI cost.** Visitors must never trigger a paid LLM API call.
- **Pages and learning content load smoothly**, with no cold starts and no server to keep warm.

The spec planned Cloud Storage + Cloud Run + Firestore (section 36). Every lab already used mock
providers or small local computations, so a server added cost and latency without adding learning
value. Cloud Storage alone cannot serve HTTPS on a custom domain without a paid load balancer.

## Decisions

- **Every lab runs in the browser.** The backend logic was ported to TypeScript:
  - Mock LLM provider (`frontend/lib/mock-provider.ts`), deterministic per prompt.
  - RAG, tool calling, agents and structured output (`frontend/features/genai/engine/`).
  - Tiny LLM trains with TensorFlow.js (WebGL backend, CPU fallback) instead of PyTorch
    (`frontend/features/fundamentals/tiny-llm/`).
- **Persistence is per visitor, in `localStorage`.** RAG documents and AI Artifacts are stored in the
  visitor's own browser. No Firestore in production.
- **The site is a Next.js static export** (`output: "export"`, `trailingSlash: true`) built into
  `frontend/out/`.
- **Hosting is Firebase Hosting on the free Spark plan**, project `ai-playland`
  (https://ai-playland.web.app). `firebase.json` runs the build as a predeploy step and gives
  `/_next/static/**` an immutable one-year cache.
- **No real LLM provider is wired in.** Adding one later would need a server-side proxy to hide
  the API key, and is a separate decision.

## Consequences

- Monthly cost is ¥0 within the Spark plan's free hosting quota. A custom domain is optional
  (about ¥1,500–2,000 per year at a registrar).
- Deploy: `firebase deploy --only hosting` from the repo root.
- `backend/` (FastAPI) and the Firestore emulator are no longer used by the frontend. They stay in
  the repo as reference for the ported logic.
- No Terraform is needed for the current deployment; `infra/` stays empty.
- Saved data does not follow a visitor across browsers or devices, and other visitors cannot see it.
- Tiny LLM speed depends on the visitor's device. WebGL (nearly universal) is fast; the CPU fallback
  is much slower.
