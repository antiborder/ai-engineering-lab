# Local development

The whole app is the Next.js frontend. Every lab runs in the browser: the mock LLM provider,
RAG, tool calling, agents, structured output, and Tiny LLM training (TensorFlow.js). Saved data
(RAG documents, AI Artifacts) lives in the visitor's `localStorage`. There is no backend to run and
no API key to set. See [`../decisions/0002-static-site-on-firebase-hosting.md`](../decisions/0002-static-site-on-firebase-hosting.md).

## One-time setup

```bash
corepack enable pnpm
pnpm setup && source ~/.zshrc
pnpm add -g firebase-tools     # only needed to preview the static build or deploy
cd frontend && pnpm install
```

## Every time

```bash
# frontend/
pnpm exec next dev -p 3100
```

Then open http://localhost:3100. Port 3100 is chosen to avoid other local projects; check
`lsof -i :3100` first if something else may be using it.

## Tests

```bash
cd frontend && pnpm test        # vitest, including the ported GenAI engine and Tiny LLM
cd frontend && pnpm exec tsc --noEmit && pnpm lint
```

## Static build and deploy

The production site is a static export (`output: "export"` in `frontend/next.config.ts`) hosted
on Firebase Hosting, project `ai-playland` (the default in `.firebaserc`).

```bash
# Build into frontend/out/
pnpm --dir frontend build

# Preview the static build exactly as Firebase serves it (repo root)
firebase emulators:start --only hosting
# http://localhost:5050 — port 5000 is taken by macOS AirPlay

# Deploy (repo root). firebase.json runs the build as a predeploy step.
firebase deploy --only hosting
# https://ai-playland.web.app
```

## Notes

- Tiny LLM uses the WebGL backend and falls back to the CPU backend, which is much slower.
  Speed measured in a background browser tab is misleading: Chrome throttles timers in hidden
  tabs to about once per second.
- Pages that read query parameters (e.g. `?artifact=`) do so on the client with
  `useSearchParams` inside `Suspense`, because a static export has no server to read them.
- `backend/` (FastAPI) and the Firestore emulator setup (`firestore.rules`, the `firestore`
  emulator in `firebase.json`) are kept for reference only; the frontend no longer uses them.
  To run them anyway: `firebase emulators:start --only firestore --project ai-engineering-lab-dev`
  and `cd backend && uv run uvicorn app.main:app --port 8001 --reload`.
- This machine tends to have other local dev servers already bound to common ports (3000,
  3001, 8000 have all been observed in use by unrelated projects). Always check `lsof -i
  :<port>` before assuming a port is free, and never kill a process on a shared port without
  confirming it is one of this project's own processes first.
