# Local development (Phase 1)

Phase 1 has no GCP dependency (spec section 35). Four things run locally:

1. **Firestore emulator** — local persistence, same client code as production Firestore.
2. **FastAPI backend** — port 8001 (8000 is often already taken by other local tools; the
   backend has no fixed requirement on 8001, just pick a free port consistently).
3. **Next.js frontend** — port 3100 chosen to avoid collisions with other local projects;
   `next dev` will auto-pick a free port if you omit `-p`, but check `lsof -i :<port>` first if
   you want a stable one, since this machine tends to have other dev servers running.
4. **AI providers** — mocked by default (`AI_PROVIDER_MODE=mock`), no API keys required.

## One-time setup

```bash
# Backend toolchain
brew install uv openjdk        # openjdk is required by the Firestore emulator (JVM)
echo 'export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"' >> ~/.zshrc

# Frontend toolchain
corepack enable pnpm
pnpm setup && source ~/.zshrc
pnpm add -g firebase-tools
```

## Every time

Three long-running processes, each in its own terminal:

```bash
# 1. Firestore emulator (repo root)
firebase emulators:start --only firestore --project ai-engineering-lab-dev
# UI at http://127.0.0.1:4000, Firestore at 127.0.0.1:8080

# 2. Backend (backend/)
cp .env.example .env   # first time only
uv run uvicorn app.main:app --port 8001 --reload

# 3. Frontend (frontend/)
cp .env.local.example .env.local   # first time only
pnpm exec next dev -p 3100
```

Then open http://localhost:3100.

## Tests

```bash
# Backend (requires the Firestore emulator running)
cd backend && uv run pytest

# Frontend
cd frontend && pnpm test        # vitest — pure-function unit tests, no server needed
cd frontend && pnpm exec tsc --noEmit && pnpm lint
```

## Notes

- `firestore.rules` allows open read/write — emulator only, never used against real Firestore.
- The backend's `AIArtifact` / `ArtifactVersion` Firestore-backed CRUD (`/api/artifacts`) is used
  by Module 2's RAG lab (`/genai/rag`, "Save as AI Artifact") — needs the Firestore emulator
  running. Module 1 (Fundamentals) doesn't touch it.
- Module 2's GenAI endpoints (`/api/genai/*`) — LLM completion, structured output, RAG,
  tool calling, agents — need the backend but not the emulator, except RAG's artifact-save.
- CORS: the backend only accepts requests from origins listed in `CORS_ALLOW_ORIGINS`
  (`backend/.env`), which defaults to `localhost:3000` and `localhost:3100`. If you run the
  frontend on a different port (e.g. because both of those are already taken by something
  else), add that origin to `backend/.env` and restart the backend, or the browser will fail
  with a CORS error that looks like a network failure.
- Tiny LLM (`/fundamentals/tiny-llm`) is the only Fundamentals page that needs the backend —
  it trains a real PyTorch model via `/api/fundamentals/tiny-llm/*`. Its training state is an
  in-memory singleton on the backend process, not persisted to Firestore.
- This machine tends to have other local dev servers already bound to common ports (3000,
  3001, 8000 have all been observed in use by unrelated projects) — always check `lsof -i
  :<port>` before assuming a port is free, and never kill a process on a shared port without
  confirming it's actually one of this project's own processes first.
