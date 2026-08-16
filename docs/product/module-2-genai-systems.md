# Module 2 — GenAI Systems: status

## What's implemented

All seven sections under `/genai`:

- **LLM API** — model, prompt, system prompt; shows tokens, latency, cost, request ID per call.
- **Prompt Engineering** — two system prompts (A/B), same editable test cases, run side by side
  with per-column average latency/tokens.
- **Structured Output** — editable JSON Schema, generates a fabricated-but-schema-shaped object,
  validates it with `jsonschema`, and can deliberately corrupt one field to show validation
  actually catching a mismatch.
- **RAG** — the centerpiece. Real TF-IDF vector search (not a fabricated similarity score) over
  a 6-document demo corpus (users can add/remove documents). Adjustable chunk size, overlap,
  top-K, similarity threshold, and a mock reranker that blends vector score with exact
  query-word overlap — genuinely reorders results in some cases. This is where **[Save as AI
  Artifact]** lives (spec section 17): saving creates an `AIArtifact`/`ArtifactVersion` via the
  Firestore-backed API from Module 1's shared infrastructure, then shows [Evaluate] [Optimize]
  [Deploy] [View monitoring] buttons that carry the artifact id/name/version into the other
  (still-placeholder) modules via URL params — confirmed working end-to-end in the browser.
- **Tool Calling** — a message goes through selection → execution → result → final answer.
  Tool selection is rule-based (regex triggers for arithmetic, "weather in `<city>`", and
  question phrasing) since the mock LLM can't actually reason — documented as a deliberate
  simplification, not hidden as if it were real function-calling.
- **Agents** — a goal is decomposed into a plan (possibly multiple tool calls), each step
  executes with an observation, failures get one retry, and a final answer synthesizes all
  observations. No hidden chain-of-thought is exposed, only plan + tool calls + observations
  (spec section 15).
- **Workflows** — the same input run through a fixed 2-step pipeline (always retrieve, always
  answer) versus the adaptive agent, side by side, so the "when is an agent worth it" trade-off
  is something you can see rather than just read about.

Tool Calling and Agents share a `search` tool that queries the RAG lab's own document corpus
via the same TF-IDF retrieval — the modules aren't just visually similar, they share real
underlying infrastructure.

## Backend

New `backend/app/genai/` package: `rag.py` (chunking + TF-IDF index + retrieval + reranking),
`rag_session.py` (in-memory document corpus, same single-session pattern as Tiny LLM),
`tools.py` (calculator/weather/search + rule-based tool-call planner), `tool_calling.py`,
`agent.py`, `structured_output.py`. New router `app/api/genai.py` mounted at `/api/genai/*`.

No new persistence beyond what Module 1 already built — RAG documents are in-memory per
backend process (same known limitation as Tiny LLM: single-user, resets on restart). Saved
*artifacts* (not documents) do persist to Firestore via the existing `/api/artifacts` endpoints.

## How to run locally

Same three processes as Module 1 (`docs/architecture/local-dev.md`) — all seven GenAI sections
need the backend running; RAG's artifact-save additionally needs the Firestore emulator (same
as any `/api/artifacts` call).

## What to test

1. **RAG** (`/genai/rag`): ask "how does sourdough bread rise?" and confirm the Sourdough Bread
   document ranks first by a real (non-zero, non-random-looking) score. Toggle reranking and
   change chunk size/top-K and confirm the retrieved chunks change. Save as an artifact, then
   click each of Evaluate/Optimize/Deploy/View monitoring and confirm the target page shows
   "Selected artifact: My RAG v1" — this is the cross-module navigation spec section 3.3
   requires.
2. **Tool Calling** (`/genai/tool-calling`): try "what is 15% of 240" (→ calculator, 36),
   "what's the weather in Berlin" (→ weather), "tell me about mount everest" (→ search), "hello,
   how are you?" (→ no tool).
3. **Agents** (`/genai/agents`): try "what is the weather in Tokyo and what is 12% of 850" and
   confirm a 2-step plan runs both tools correctly (this exact scenario caught two real bugs
   during testing — a greedy city-name regex swallowing the rest of the sentence, and percent
   phrasing not being recognized as arithmetic — both fixed, both now regression-tested).
4. **Workflows** (`/genai/workflows`): try the math example and confirm the deterministic
   column searches irrelevant documents while the agentic column correctly uses the calculator.
5. **Structured Output** (`/genai/structured-output`): generate normally (should validate),
   then check "deliberately break the output" and regenerate (should show a validation error).
6. **Prompt Engineering** (`/genai/prompt-engineering`): run the default comparison and confirm
   both columns populate with per-test-case results.
7. Confirm the `/genai` landing page links to all seven sections and each has working
   breadcrumbs back through GenAI Systems to the lab home.

## Known limitations

- Tool selection and agent planning are rule-based (regex triggers), not real LLM reasoning —
  documented in each lab's own copy, not hidden.
- RAG document corpus and artifact-save both assume single-user local dev (see Backend section).
- Workflows' "deterministic" side is a fixed 1-step retrieve-then-answer pipeline for
  illustration, not a configurable workflow builder.
- Evaluation/Inference/LLMOps are still placeholders — the artifact-context handoff into them
  is verified, but there's no real evaluation/deployment logic yet (that's Modules 3-5).

## Tests

- `backend/tests/test_rag.py` — chunking respects size/overlap (including a regression test for
  overlap >= chunk_size not infinite-looping), TF-IDF ranks the topically relevant document
  highest, reranking can reorder results, full session query + API roundtrip.
- `backend/tests/test_structured_output.py` — deterministic generation, validates against its
  own schema, enum constraint respected, `break_schema` produces a real validation error.
- `backend/tests/test_tools.py` — calculator (including percent-of phrasing and rejecting
  unsafe input), deterministic weather, search finds the relevant document, tool-call planning
  for math/weather/search/plain-chat, plus regression tests for both bugs found during manual
  browser testing (greedy city regex, percent-phrase detection).
- `backend/tests/test_agent_and_tool_calling.py` — tool calling picks the right tool and skips
  tools for plain chat, agent builds multi-step plans and handles the no-tools-needed case, full
  API roundtrip for both.
