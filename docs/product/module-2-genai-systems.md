# Module 2 — GenAI Systems: status

## What's implemented

Six Units under `/genai` (originally seven — Tool Calling and Agents were merged into one Unit,
two Chapters, see below):

- **LLM API** — model, prompt, system prompt; shows tokens, latency, cost, request ID per call.
  Has a guided walkthrough (`LlmApiWalkthrough.tsx`, 25 Steps across 8 Sections) covering the
  request/response shape, configuration (temperature/max_tokens/reasoning effort — concept only,
  not wired into the mock API's `CompletionRequest`), tokens, latency, cost, determinism, and
  multi-turn conversations (the model is stateless, so every turn resends the full history —
  illustrated with a client-side-only diagram, not a real `messages` array in the backend —
  including cached-token pricing as the real-world fix for that growing resend cost).
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
- **Tool Calling & Agents** (`/genai/tool-calling`) — one Unit, two Chapters via a tab switcher
  (`ToolCallingAgentsPlayground.tsx`), since Agents is Tool Calling's exact mechanism, looped
  with a plan on top — not two unrelated ideas. No walkthrough yet for either Chapter (Lab-only,
  same as every GenAI Systems Unit before LLM API got its walkthrough this session).
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
  is something you can see rather than just read about. Deliberately stayed a separate, final
  Unit rather than folding into Tool Calling & Agents — it compares RAG (deterministic) against
  Agents side by side, so it depends on both, not just one.

Tool Calling and Agents share a `search` tool that queries the RAG lab's own document corpus
via the same TF-IDF retrieval — the two Chapters aren't just visually similar, they share real
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

Same three processes as Module 1 (`docs/architecture/local-dev.md`) — all six GenAI Units
need the backend running; RAG's artifact-save additionally needs the Firestore emulator (same
as any `/api/artifacts` call).

## What to test

1. **RAG** (`/genai/rag`): ask "how does sourdough bread rise?" and confirm the Sourdough Bread
   document ranks first by a real (non-zero, non-random-looking) score. Toggle reranking and
   change chunk size/top-K and confirm the retrieved chunks change. Save as an artifact, then
   click each of Evaluate/Optimize/Deploy/View monitoring and confirm the target page shows
   "Selected artifact: My RAG v1" — this is the cross-module navigation spec section 3.3
   requires.
2. **Tool Calling** (`/genai/tool-calling`, Tool Calling Chapter): try "what is 15% of 240" (→
   calculator, 36), "what's the weather in Berlin" (→ weather), "tell me about mount everest"
   (→ search), "hello, how are you?" (→ no tool).
3. **Agents** (`/genai/tool-calling`, Agents Chapter): try "what is the weather in Tokyo and
   what is 12% of 850" and confirm a 2-step plan runs both tools correctly (this exact scenario
   caught two real bugs during testing — a greedy city-name regex swallowing the rest of the
   sentence, and percent phrasing not being recognized as arithmetic — both fixed, both now
   regression-tested).
4. **Workflows** (`/genai/workflows`): try the math example and confirm the deterministic
   column searches irrelevant documents while the agentic column correctly uses the calculator.
5. **Structured Output** (`/genai/structured-output`): generate normally (should validate),
   then check "deliberately break the output" and regenerate (should show a validation error).
6. **Prompt Engineering** (`/genai/prompt-engineering`): run the default comparison and confirm
   both columns populate with per-test-case results.
7. Confirm the `/genai` landing page links to all six Units and each has working breadcrumbs
   back through GenAI Systems to the lab home; confirm `/genai/tool-calling`'s Tool Calling ↔
   Agents tab switcher works (each Chapter unmounts/resets on switch, same as Fundamentals'
   multi-Chapter Units — not a bug).

## Known limitations

- Tool selection and agent planning are rule-based (regex triggers), not real LLM reasoning —
  documented in each lab's own copy, not hidden.
- RAG document corpus and artifact-save both assume single-user local dev (see Backend section).
- Workflows' "deterministic" side is a fixed 1-step retrieve-then-answer pipeline for
  illustration, not a configurable workflow builder.
- Evaluation/Inference/LLMOps are still placeholders — the artifact-context handoff into them
  is verified, but there's no real evaluation/deployment logic yet (that's Modules 3-5).

## Planned content additions (2026 topic audit)

A chapter-by-chapter review (prompted by auditing LLM API for gaps like configuration
parameters, multi-turn conversations, and cached tokens — see `LlmApiWalkthrough.tsx`) found
further gaps across the rest of the module. Ranked by usefulness × implementation cost × fit
with this app's interactive-visualization teaching style; not yet implemented. Two topics were
judged lower priority and are deliberately excluded from this pass: **agentic/iterative RAG**
(overlaps heavily with item 1's structured-workflow middle tier — better folded in there than
built separately) and **multi-agent orchestration** (agents calling other agents — a real 2026
topic, but a step beyond this Chapter's single-agent teaching scope).

1. **Workflows — the missing middle tier: structured/graph workflows.** Highest priority.
   `WorkflowsLab.tsx` only shows two extremes: a fixed pipeline vs. a free agent. The
   "workflows vs. agents" framing this Chapter is named after (and RAG's own literature) has a
   well-known third tier in between — a graph with conditional branching and tool use, more
   flexible than a fixed pipeline but more predictable than a free agent — and this Chapter
   currently doesn't model it. Cost: medium-high (a new backend execution path). Visualization
   fit: excellent — a branching flowchart plays directly to this app's strengths.
2. **RAG — fix the "Embedding" label.** Highest priority. `rag.py`'s `TfidfIndex` is real but
   sparse/lexical (bag-of-words + IDF), not the dense neural embeddings the pipeline diagram's
   own "Embedding" stage implies — a labeling/accuracy issue, not just a missing feature (misses
   semantically-similar-but-lexically-different matches, e.g. "car" vs. "automobile"). Cost: low
   for an honest walkthrough callout ("this is TF-IDF, not a real embedding — here's the
   difference"); medium if a real (or realistically mocked) dense embedding is added alongside
   it. Visualization fit: excellent — vector-space/cosine-similarity diagrams reuse patterns
   already built for Fundamentals (embedding grids, positional-encoding heatmaps).
3. **Structured Output — constrained decoding.** High priority. `structured_output.py` only
   teaches generate-then-validate; real 2026 APIs (OpenAI `json_schema` strict mode, Anthropic
   tool-use-based structured output, Gemini structured output) use constrained decoding, which
   makes schema-invalid output structurally impossible rather than merely checked afterward — a
   real paradigm difference, not a minor upgrade. Cost: medium. Visualization fit: excellent —
   graying out schema-invalid candidates in a next-token probability bar reuses the
   NextTokenBars/TemperatureDemo pattern (Tiny LLM, LLM API) almost as-is.
4. **Prompt Engineering — few-shot prompting.** High priority, low cost. One of the two most
   fundamental prompt-engineering techniques and currently entirely absent. Fits the existing
   Prompt A/B comparison structure directly (toggle examples on/off in the system prompt); no
   backend changes needed.
5. **Prompt Engineering — chain-of-thought prompting.** High priority, low cost. Same rationale
   and same low-cost fit as few-shot — toggle "think step by step" on/off within the existing
   A/B structure.
6. **Prompt Engineering — a lightweight harness (pass/fail + aggregate score).**
   `PromptComparisonLab.tsx` already runs fixed test cases through both prompts — it's most of
   the way to a harness already, just missing pass/fail criteria and an aggregate score. Medium
   priority/cost. Scope must stay narrow — real evaluation (statistical significance, regression
   suites, LLM-as-judge) is Module 3 (Evaluation)'s job, not this Chapter's; this addition should
   explicitly bridge to Module 3 rather than duplicate it.
7. **Tool Calling/Agents — parallel tool calls.** Medium priority/cost. `plan_tool_calls` in
   `tools.py` only ever plans tools sequentially; real APIs let a model request several tool
   calls in one turn, executed in parallel. A timeline-style diagram fits this well.
8. **RAG — hybrid search (dense + sparse).** Medium priority. Depends on item 2 (a real dense
   embedding) landing first — once both a sparse (TF-IDF, already built) and a dense signal
   exist, blending them is the natural next step, mirroring `rerank()`'s existing
   score-blending approach.
9. **Tool Calling/Agents — MCP (Model Context Protocol), concept only.** High importance, but
   poor visualization fit: MCP is how real 2026 applications wire tools to models (adopted well
   beyond Anthropic, who introduced it), so leaving it out entirely would be a real gap — but
   it's a wiring/protocol concept, not something a slider or diagram makes experiential the way
   this app's other topics are. Scope deliberately small: one concept diagram (Model ⇄ MCP
   Server ⇄ Tool) plus a short explanation, not a real protocol implementation. Cost: low for
   that scoped version; a real MCP server integration would be high cost for little pedagogical
   gain here and is explicitly out of scope.
10. **Tool Calling/Agents — guardrails / approval gates before tool execution.** Medium
    importance/cost. Good visualization fit (a pending-approval UI state is easy to show
    experientially). Matters for responsible agentic-tool-execution practice — notably, the same
    "confirm before risky actions" principle this session's own tool-use rules follow — though
    secondary to this Chapter's core goal of teaching the tool-calling mechanism itself.

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
