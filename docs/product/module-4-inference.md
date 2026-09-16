# Module 4 — Inference: status

## Decision: built in this app, not a separate one

`docs/product/infra-ml-systems-playground.md` had moved this module's content out to a planned,
not-yet-scaffolded separate app ("Module A — ML Serving & Systems"), on the reasoning that
vLLM/KV-cache/quantization internals were too practitioner-level for AI Playground's "curious
general learner" audience. That decision is now reversed: since duplicating this content into a
separate app later is easy, Inference is being built directly in AI Playground, continuing
right after Evaluation. `infra-ml-systems-playground.md` still records the reasoning for the
*other* modules planned there (MLOps/Production Lifecycle, Cloud Infrastructure & IaC, Data
Engineering for ML) — only its "Module A" section is superseded by this doc.

No Southwear/Chloe/Maya narrative here — Inference follows GenAI Systems' house style (plain
Welcome → Sections → Wrap-up, no dialogue), not Evaluation's. Per spec.txt 19.8, no Unit
requires a real GPU: every hands-on simulation is client-side math (e.g. Model Serving's
queueing formula), matching the app's existing "no permanently running GPU required" constraint.

## Planned Units (6, consolidated from spec.txt 19.1–19.8's original 8)

Originally planned as 8 Units, one-to-one with spec.txt 19.1–19.8. Consolidated to 6 after
actually writing vLLM surfaced two real overlaps (not guessed in advance — discovered by writing
the content and finding it already had to cover the "later" Unit's material):

- **KV Cache dropped as a standalone Unit, folded into vLLM.** PagedAttention couldn't be taught
  without first explaining what a KV cache even is, so vLLM already grew its own "KV Cache: A
  Quick Refresher" Section. What would have been left for a separate KV Cache Unit — memory cost
  as a function of context length × concurrency — is a natural extension of that Section, not
  enough on its own for a whole Unit that wouldn't just re-open with a recap of vLLM.
- **Performance merged into Hosted API vs. Self-hosted.** Performance's core vocabulary (latency,
  throughput, TTFT) was already introduced piecemeal in Model Serving (latency, the M/M/1 queueing
  demo, a TTFT forward-reference) and vLLM (throughput, with real published numbers). A standalone
  Performance Unit would have had little left to teach except "read several already-known metrics
  together to diagnose a bottleneck" — exactly the skill the hosted-vs-self-hosted decision needs,
  so the two are now one Unit: learn to read the metrics, then immediately use them to decide.

1. **Model Serving** (`/inference/model-serving`) — training vs. serving, the request path
   (client → inference server → model → tokens), why one request is easy and many at once is
   not.
2. **GPU** (`/inference/gpu`) — why GPUs over CPUs; GPU memory as the real constraint; Simulation
   Mode (no real GPU required), confined to this Unit's Try-It-Yourself Step per the pedagogy
   guidelines' rule on disclosing this app's simplifications.
3. **vLLM** (`/inference/vllm`) — the serving engine that ties scheduling, continuous batching,
   KV cache, throughput/latency, and GPU memory together; introduces PagedAttention as vLLM's
   real, distinctive mechanism, plus prefix caching and speculative decoding.
4. **Continuous Batching** (`/inference/continuous-batching`) — static batching's idle-GPU
   problem; slotting new requests in as others finish; the utilization/latency tradeoff.
5. **Quantization** (`/inference/quantization`) — FP16 vs. INT8 vs. INT4; the memory/speed/
   quality three-way tradeoff; a concrete case where quality loss becomes visible.
6. **Performance** (`/inference/performance`) — TTFT vs. total latency, throughput vs. latency,
   reading a real metrics dashboard to diagnose a bottleneck, then using those same metrics to
   decide hosted API vs. self-hosted (cost/latency/control/infra-complexity tradeoffs).

**Reordered after all 6 were planned** (see "How the Units relate" below): GPU moved from last
to position 2, right after Model Serving. Writing Model Serving, vLLM, and Continuous Batching
had each already leaned on GPU facts — "a GPU can run huge numbers of calculations at once,"
"GPU memory is a fixed, shared budget" — as forward-referenced assumptions, the same structural
problem KV Cache caused for PagedAttention before being folded into vLLM as a refresher. Moving
GPU forward fixes it at the source instead of re-patching every Unit that depends on it.

## How the Units relate

Not 6 independent topics — 1 shared problem (from Model Serving), fought on exactly 2 GPU
resources, plus one Unit that ties the fixes together and one that measures whether they worked.
Worked out in conversation after a user asked "what's each Unit's role, and are they really
independent?" — recorded here so it isn't re-derived, and reflected in Model Serving's own
opening (see below).

| Resource being fought over | Technique | Unit |
|---|---|---|
| **GPU compute** — how many requests run at once | Continuous batching (scheduling) | Continuous Batching |
| **GPU memory** — how the KV cache is stored | PagedAttention | vLLM |
| **GPU memory** — how big the model's weights are | Quantization | Quantization |

- **Model Serving** states the shared problem every other Unit exists to fix: one request is
  easy, many at once is hard, because GPU compute and GPU memory are both finite.
- **GPU** is the foundational Unit underneath all of this — why those two resources (compute
  parallelism, memory capacity) are what's actually scarce. Placed right after Model Serving
  (not last, where it was originally planned) because every later Unit forward-references its
  facts: "a GPU can do huge numbers of calculations at once" and "GPU memory is a fixed, shared
  budget" are both used before GPU's own Unit would have formally covered them. vLLM and
  Continuous Batching now callback to GPU's Unit instead of re-teaching those facts inline.
- **vLLM** is the real engine that combines multiple fixes for both resources — and explicitly
  scopes one of them (continuous batching) out to its own Unit rather than covering it itself.
- **Continuous Batching** and **Quantization** are independent, combinable levers (a quantized
  model still benefits from continuous batching, and vice versa) — one on the compute axis, one
  on the memory axis.
- **Performance** teaches no new technique. It reads the metrics the other Units already
  produced (latency from Model Serving, throughput from vLLM) together as one dashboard, then
  uses that reading skill for the hosted-vs-self-hosted decision.

## What's implemented

### Model Serving (`/inference/model-serving`)

First draft shipped at 15 Steps and was judged too shallow on review — thinner than the
`LlmApiWalkthrough.tsx` precedent it was meant to match (25 Steps), with several Sections that
were just labeled diagrams with little substance. Diagnosis: mostly not "topics that belong to
later Units" (only the 4-stage pipeline itself legitimately stays light, since its real depth —
scheduling, KV cache, quantization — is later Units' job) but genuinely missing content: nothing
in the module's other 7 planned Units covers what happens once one server's queue is full and
you need *more than one server* — cold start, autoscaling's lag, and load balancing across
replicas. Expanded to fill exactly that gap, not padded elsewhere for volume's sake (Sections
1–3 are unchanged).

`ModelServingWalkthrough.tsx` — 20 Steps across Welcome + 4 Sections + Wrap-up:

- **Training vs. Serving** — same model, different goals (accuracy offline vs. latency/cost
  online); serving reuses training's weights unchanged.
- **The Serving Pipeline** — `ModelServingDiagram.tsx` (Client → Inference Server → Model →
  Tokens, dim/highlight technique matching every other GenAI Systems/Evaluation diagram) walks
  each stage; ties the Model stage back to Tiny LLM's autoregressive generation (reuses the
  `autoregressive` glossary Term rather than re-explaining it).
- **What Can Go Wrong at Scale** — one request vs. many; latency/memory/cost all worsening
  together; a "Try it yourself" step using the real M/M/1 average-wait formula
  (`1/(μ−λ)`, μ = server capacity, λ = arrival rate) to show latency exploding as arrival rate
  approaches capacity — a genuine queueing-theory result, not a fabricated number.
- **Scaling Beyond One Server** (new) — cold start (loading a multi-GB model into GPU memory is
  a real tens-of-seconds cost); autoscaling's blind spot (a new replica takes just as long to
  warm up, so it isn't ready until well after the spike that triggered it); warm pools as the
  fix (paying for idle capacity to skip the wait); then a "Try it yourself" step that actually
  simulates round-robin vs. least-loaded request routing across 3 replicas given a fixed,
  uneven request-duration sequence (`[1,1,4,1,1,4]`, deterministic, not fabricated) — round-robin
  produces max load 8 (two heavy requests pile onto the same replica, 3 positions apart),
  least-loaded produces max load 6. Verified live in-browser.

`ModelServingLab.tsx` unlocks after completion: lets the reader vary server capacity (μ) too,
not just arrival rate, to see that more capacity (more GPUs, a faster server, or — later Units —
a smarter serving engine) is what actually buys back latency.

Closes with a "Continue to GPU →" link (`Link` added to the closing Step, matching the RAG
Evaluation → Agent Evaluation pattern). Originally pointed to vLLM; repointed to GPU once GPU
was reordered to position 2 — the closing Step's prose was also reworded so GPU is named as the
very next Unit rather than lumped into the "everything else" list.

Verified: `tsc --noEmit` and `eslint` clean.

### GPU (`/inference/gpu`)

Written after the reordering decision, to the same care standard as Evaluation Basics, reusing
every core number already established elsewhere in the module rather than inventing new figures:
80 GB VRAM and 0.5 MB/word from vLLM's KV-cache refresher, ~14 GB model weights for a 7B-class
model from Model Serving. This mirrors the KV Cache Unit's own absorption into vLLM — no new
numbers invented, existing ones given their proper foundational treatment.

`GpuWalkthrough.tsx` — 18 Steps across Welcome + 3 Sections + Wrap-up:

- **Why GPUs, Not CPUs?** — a CPU's few, highly flexible cores vs. a GPU's thousands of simple
  ones; ties back to Fundamentals' Transformers Unit (a forward pass is mostly matrix
  multiplication — many independent, simple multiply-adds); a concrete worked comparison (1,000
  multiply-adds: roughly 125 rounds on an 8-core CPU vs. roughly 1 round on a GPU) makes "GPUs
  are more parallel" a computed fact instead of an assertion.
- **GPU Memory: The Real Constraint** — VRAM as memory physically on the GPU chip, separate from
  the computer's regular RAM; three things sharing that one fixed budget (model weights, KV
  cache, working memory); a new Step ("A Parameter Is Just a Number in Memory") derives the
  model's own footprint instead of asserting it — a weight is a number (callback to Fundamentals'
  Neural Networks Unit, which defined a weight the same way), FP16 stores each one in 2 bytes, so
  7 billion parameters × 2 bytes ≈ 14 GB, the figure Model Serving already used. Added specifically
  because nothing in the app previously explained *why* a 7B model is ~14 GB — `GpuLab.tsx`'s own
  `BYTES_PER_PARAM = 2` depended on that fact silently, and Quantization's entire FP16/INT8/INT4
  premise needs it as a foundation. Then reuses that ~14 GB figure to show what's left (66 GB) for
  everything else; frames memory as a hard limit (a request that doesn't fit fails outright) vs.
  compute as a soft limit (a slow request is merely slower).
- **Building Your GPU's Budget** — a "Try it yourself" Step (slider: 10–200 concurrent
  conversations) computing live KV-cache memory needed via an illustrative 0.5 MB/word estimate
  for a 7B-class model, checked against the 66 GB left after model weights; Simulation Mode's
  disclosure is confined to this Step only, per the pedagogy guidelines.

`GpuLab.tsx` unlocks after completion with a different angle: a model-size slider (1–70B
parameters, FP16's 2 bytes/parameter — now derived, not just asserted, by the walkthrough itself)
against a fixed KV-cache need (the walkthrough's own 100-conversation example, 48.8 GB), showing
whether a bigger model still leaves room for it.

Closes with a "Continue to vLLM →" link. vLLM's first Step gained a matching "← Back to GPU"
link (previously a plain disabled Back button, since vLLM used to be first in the module).

Verified live in-browser: unit order on `/inference`; the pill-chain/table on Model Serving's
"Where This Fits" Step; the KV-cache slider (100 → 48.8 GB, 200 → 97.7 GB "more than the 66 GB
left"); the closing "Continue to GPU →" / "Continue to vLLM →" / "← Back to GPU" links all
navigate correctly; `GpuLab.tsx`'s model-size slider (7B → 14 GB weights, fits; 55B → 110 GB
weights, exceeds the 80 GB GPU outright). All match hand-computed values exactly.

**Post-publish revision pass** (a real user review, not self-caught): a first pass wrote GPU's
own content as if it still sat at position 6, its original planned slot. Several Steps said
"every earlier chapter in this module" while naming vLLM's PagedAttention and Continuous
Batching by name — both are now *later* Units, so this claimed those chapters had already taught
facts the reader hadn't seen yet. Root cause: the reorder itself (code position, index-page
order, cross-links) was done correctly, but the prose *inside* GPU's own Steps was never
re-checked against the new position — the same class of mistake GPU was created to fix in vLLM
and Continuous Batching, just turned inward. Fixed in 8 places: two Welcome Steps and one
Section-1 closing Step rewritten from "earlier chapter ... has already" to "later chapter ...
leans on / depends on"; the VRAM, KV-budget, and "Try it yourself" Steps stopped crediting vLLM's
(not-yet-taught) chapter as the source of the 80 GB and 0.5 MB/word figures and instead state
them as this Unit's own; a stray "has used" past-tense claim about the module's Try-It-Yourself
pattern softened to present tense; the closing forward-reference Step's wording tightened so
"later in this module" unambiguously covers both vLLM's PagedAttention and Quantization, not just
the one it happened to sit next to in the sentence. The `VRAM_TOTAL_GB`/`MB_PER_WORD` dev comment
and the file's top docstring were also corrected — they still note these two numbers were
originally written for vLLM's own Step (true, and worth keeping as provenance), but no longer
imply vLLM's chapter is where the reader already saw them. Verified live in-browser at each
corrected Step.

**Second revision pass — pedagogical, not just grammatical** (explicit user correction: fixing
tense alone was "部分的" (partial), not the holistic re-check that was actually asked for). The
first pass corrected *direction* (no more "vLLM already showed X") but missed a deeper problem:
the Welcome "Big Picture" Step still named **PagedAttention** and **continuous batching** by name
as the grammatical subject of a claim — "PagedAttention and continuous batching still ahead, are
all really about managing..." — even though "still ahead" is grammatically correct, a reader two
Steps into their first exposure to this module has never heard either term, so being told what
they're "really about" is unearned cognitive load regardless of tense. Fixed by dropping both
names from that Step entirely and keeping only the Model Serving callback the reader has actually
seen (the queueing formula) — the compute/memory framing doesn't need named examples to land.
Separately, auditing every remaining "PagedAttention" / "vLLM" / "Continuous Batching" /
"Quantization" mention in the file surfaced one genuine content gap: **KV cache** is used
repeatedly from Section 2 onward (as one of the three things competing for GPU memory) but was
never defined anywhere in GPU's own content — because before the reorder, vLLM's "KV Cache: A
Quick Refresher" Section had always already run by the time the reader reached this material.
Fixed with one short functional gloss on first use ("a running memory of everything said so far
in each request being served, kept so the model never has to reprocess it from scratch") — not a
full Key/Value re-derivation, which stays vLLM's job at proper depth; every later mention now
correctly reuses an already-locally-defined term instead of relying on the reader recognizing it.
The remaining PagedAttention/Continuous Batching/Quantization mentions (Section 3's forward-look,
the Wrap-up recap, the closing Step) were kept as-is on review: they sit after the reader has
full context, are explicitly framed as previews ("later in this module," "still ahead"), and
function like Model Serving's own map/table Step — naming a technique as a preview label is fine;
using it as an unexplained premise is not. This same audit caught a second, unrelated staleness
bug in **Model Serving**: its "Inference Server" Step and top docstring still listed "KV Cache"
as one of the module's own Units and omitted "GPU" — leftover from before the 8→6 consolidation
and the reorder, contradicting the correct 6-Unit list the "Where This Fits" Step (right before
it, in the same Welcome section) already showed. Fixed to read "GPU, vLLM, Continuous Batching."
Verified live in-browser.

**Third revision pass — a real content review, not a polish pass.** A user read every Step and
gave specific, itemized feedback, several items catching genuine gaps or a genuinely wrong claim,
not just phrasing:
- **Named the resource.** The Unit never explicitly stated "a GPU is compute + memory," and used
  "compute" inconsistently. Added one clear framing sentence to "The Big Picture" ("A GPU is built
  from two things: compute — the cores that actually perform calculations — and memory...") and
  standardized on "compute" as the one word for 計算資源 everywhere after.
- **"Core" was never defined.** Added a one-clause definition at its first real use ("A core is
  the part of a chip that actually does the work...") in the CPU Step.
- **No direct CPU vs. GPU comparison.** A new Step, "CPU vs. GPU, Side by Side," was inserted
  right after the GPU-cores Step: one paragraph plus an actual `<table>` (core count / each core /
  best suited for) — not just two StatCards side by side. 17 → 18 Steps.
- **"What Neural Networks Actually Need" stated a fact but never drew the conclusion.** Added the
  explicit sentence: "...which makes a GPU, not a CPU, the better fit for running a neural
  network."
- **No bridge between Section 1 (cores) and Section 2 (VRAM).** The VRAM Step opened cold. Added a
  one-clause bridge: "Those thousands of cores need their own place to keep the data they work
  on."
- **"Budget" was used as an unexplained metaphor**, and inconsistently — sometimes meaning VRAM
  specifically, sometimes compute-and-memory together (Section 3's forward-look, a Wrap-up
  bullet). First fixed by defining it explicitly on first use and auditing every other occurrence
  so it meant VRAM only, never compute (see below — this word was removed entirely one revision
  later, once defining it turned out not to be enough).
- **A genuinely wrong claim, not just an unclear one.** "Why This Is a Hard Limit, Not a Slow One"
  had claimed a memory shortage "cannot be fixed by waiting — the request simply cannot be
  served." The user proposed the actual mechanism instead: a new request waits for an existing
  request's KV cache to free up, and *while it waits, the GPU's compute can sit idle* even though
  there is spare compute to run it with — memory scarcity can strand compute, not just block
  itself. This is correct and is what the Try-it-yourself Step actually models (queueing for
  room, not permanent rejection); the old claim was rewritten to match. One part of the user's
  proposed content — recomputing an evicted KV cache after preemption — was deliberately left out
  as out of scope for this foundational Unit; that mechanism belongs to vLLM/Continuous Batching,
  which actually teach scheduling and preemption policy.
- **"What This Means for the Rest of This Module" was one dense paragraph naming techniques.**
  Converted to one bullet per remaining Unit (vLLM, Continuous Batching, Quantization,
  Performance), each tied explicitly to compute or to VRAM.
- Wrap-up bullets updated to match: the hard-limit bullet now states the corrected mechanism, and
  the "different ways of stretching this further" bullet now correctly splits vLLM/Quantization
  (VRAM) from Continuous Batching (compute) instead of lumping all three together.

`tsc --noEmit` and `eslint` clean; every corrected Step verified live in-browser, including the
new CPU vs. GPU table and the per-Unit bullet list.

**Fourth revision pass — "budget" removed entirely, not just defined.** The user's follow-up:
budget *is* VRAM capacity, so just say VRAM capacity — don't make the reader translate a metaphor
even one that's been defined. Every occurrence rewritten to the literal term: `KV_BUDGET_GB` →
`KV_CAPACITY_GB`, `overBudget` → `overCapacity`; "Three Things Compete for That Same Budget" →
"...That Same VRAM Capacity"; Section 3's title and every matching `section:` tag, "Building Your
GPU's Budget" → "Your GPU's VRAM, Added Up"; "stretches the VRAM budget" → "makes the VRAM
capacity go further" (in the per-Unit bullet list, the Wrap-up recap, and the closing Step). Zero
occurrences of "budget" remain in the file. Asked why "budget" was used at all: it was inherited
from an earlier draft rather than introduced fresh, judged as legitimate-enough industry jargon
("memory budget" is real GPU-programming terminology), and rewriting it looked like a bigger diff
than adding one defining sentence — none of which actually outweighs a plain term being just as
short. Added a new rule to `pedagogy-guidelines.md`'s Terminology section for this: prefer the
literal term over a metaphor whenever the literal term is equally short and clear; defining a
metaphor is not a substitute for not needing one. `tsc`/`eslint` clean, verified live in-browser.

### vLLM (`/inference/vllm`)

Built to Evaluation Basics' depth on request (not Model Serving's own first-draft depth): every
Section is a genuinely distinct, real, non-overlapping mechanism, built up step by step with a
naive assumption exposed before its real fix, the same shape Evaluation Basics' Metrics Chapter
used — not padded for step count. Scoping check done explicitly against all 7 other planned
Units before writing: "The Pieces vLLM Combines" (continuous batching, scheduling) is left
deliberately thin, a map not a lesson, since Continuous Batching/KV Cache/Quantization own that
depth in their own future Units — this Unit's real territory is the 3 mechanisms none of those
Units claim.

First pass at 18 Steps (below) was still judged unreadable by a genuine beginner: it used "KV
cache" ~10 times with zero definition (the dedicated KV Cache Unit comes *after* this one, so
nothing had introduced it yet), explained OS virtual memory assuming an OS course already taken,
and left speculative decoding fully abstract with no worked example. Fixed without changing the
Unit's scope: added a "KV Cache: A Quick Refresher" Section (3 Steps) that rebuilds the concept
from Fundamentals' own Key/Value vocabulary before PagedAttention needs it; rewrote the
PagedAttention fragmentation/paging explanation around a hotel-room analogy (a wing reserved per
guest, empty rooms, scattered unusable single rooms, then one-room-at-a-time with a front-desk
list) before naming the real terms; threaded one worked example ("The Eiffel Tower is ___" →
draft guesses "in", "Paris", "France") through all of Speculative Decoding instead of staying
abstract; and added plain-language anchors for "GPU" and "throughput" the first time each is
used. Now 22 Steps. Verified in-browser.

After the 8→6 Unit consolidation (see above) was agreed, the KV Cache Unit's one piece of content
that wasn't just a repeat of the "Quick Refresher" — memory cost as a function of context length
× concurrency — was actually written into the KV Cache Section (until this point the
consolidation had only been reflected in the plan doc and the index page, not in any Unit's real
content). Adds 2 Steps: how the cache grows in two directions at once (longer context, more
concurrent requests, explained in prose first), then a "Try it yourself" step computing total GB
live from a 0.5 MB/word illustrative estimate for a 7B-parameter-class model, compared against an
80 GB GPU — verified in-browser at defaults (1000 words × 50 conversations = 24.4 GB) and at the
slider maximums (4000 words × 200 conversations = 390.6 GB, correctly flagged as exceeding the
GPU), both matching hand-computed values exactly. Now 24 Steps.

`VllmWalkthrough.tsx` — 24 Steps across Welcome + 6 Sections + Wrap-up:

- **Why a Dedicated Serving Engine?** — naive one-request-at-a-time serving vs. published vLLM
  benchmark numbers (2–4× over earlier optimized systems, up to ~24× over no batching at all —
  real figures, not fabricated).
- **The Pieces vLLM Combines** — 1 Step, deliberately thin roadmap (`VllmDiagram.tsx`, same
  dim/highlight pill-chain technique as every other Inference/GenAI Systems/Evaluation diagram).
- **KV Cache: A Quick Refresher** (new) — 5 Steps rebuilding the concept from scratch using
  Fundamentals' own Key/Value vocabulary (reuses the `key`/`value` glossary Terms): why generating
  needs to look back at every earlier word, why recomputing that every time is wasted work, then
  the KV cache itself as "compute it once, reuse it." Exists because PagedAttention cannot be
  taught to someone who doesn't yet know what it's protecting — and the dedicated KV Cache Unit
  doesn't exist yet to have taught it first. Closes with the former KV Cache Unit's absorbed
  content: how cache size scales with context length × concurrency, and a live GB calculator
  (0.5 MB/word for a 7B-class model) checked against an 80 GB GPU.
- **PagedAttention** — a hotel-room analogy (a wing reserved per guest "just in case," most of it
  sitting empty, plus scattered single free rooms too small individually for the next guest) walks
  the reader to the real terms internal/external fragmentation (60–80% wasted per vLLM's own
  published measurements) before the fix (one room at a time, a front-desk list — i.e. virtual
  memory/paging) and PagedAttention itself (<4% waste). Closes with a "Try it yourself" step
  computing real utilization live
  (`utilization = avg length / memory reserved`) for naive (fixed 2048-token reservation) vs.
  paged (16-token blocks, vLLM's real default) — verified in-browser at 300-token average
  response: 14.6% (naive) vs. 98.7% (paged), matching hand-computed values exactly.
- **Prefix Caching** — reusing an identical shared prefix's KV cache blocks (e.g. a system
  prompt) across requests, only possible because PagedAttention already stores the cache as
  reusable blocks.
- **Speculative Decoding** — a small draft model proposing tokens the large model verifies in
  one pass; states plainly that the output is mathematically identical to the large model alone,
  not an approximation.

New glossary Terms: `paged-attention`, `prefix-caching`, `speculative-decoding` (reuses
`autoregressive` rather than re-explaining it).

`VllmLab.tsx` unlocks after completion with a different angle than the walkthrough's own
interactive (memory utilization): the real speculative-decoding expected-tokens-per-call formula,
`E[tokens] = (1 − p^(k+1)) / (1 − p)` for k=4 draft tokens and accept probability p (Leviathan et
al. 2023 / Chen et al. 2023's standard result) — verified in-browser at p=70%: 2.77× speedup,
matching hand-computed value exactly.

Closes with a "Continue to Continuous Batching →" link now that Unit exists.

Verified: `tsc --noEmit` and `eslint` clean.

**Post-publish revision pass** (a real user review, not self-caught): the first version still
assumed too much. Fixed, each verified live in-browser after: `MemoryGridDiagram.tsx` added (one
reusable colored-cell grid component reused across the PagedAttention Steps and the live "Try it
yourself" utilization comparison — the ranked-and-approved fix for "these Steps would be clearer
as a diagram"); the hotel analogy's own units were inconsistent (said "100 nights" for something
that was actually "100 rooms" — fixed by dropping "nights" everywhere and standardizing on
rooms only); the KV cache vs. PagedAttention vs. vLLM relationship was stated as blunt meta
commentary ("PagedAttention is the specific technique vLLM built...") — rewritten to convey the
same fact through plain narration instead; "Many Requests Start the Same Way" used a
generic "Acme" placeholder with no concrete example — replaced with Southwear and an actual
system-prompt string, then further tightened into a 2-item bullet list; Speculative Decoding's
"checking is cheap" claim was asserted without explaining why — rebuilt as its own dedicated Step
that calls back to Section 1's GPU-parallelism fact explicitly (now 4 Steps, was 3); six `<p>`
blocks exceeded the pedagogy guidelines' ~50-word unbroken-prose limit — split, none reworded
down in a way that lost meaning. Net effect: 18 → 27 Steps, all added content addressing a real
reviewed gap, none padding. (A later, unrelated small addition — the "← Back to GPU" link and
Section 1's GPU-unit callback, both part of the GPU-reorder work above — brought this to 28
Steps without changing this count in the doc; corrected below.)

**Welcome-Section restructure** (user review: Steps 2–4 looked duplicative). They were: "What Is
vLLM?" (identity — not a model, it's Model Serving's inference-server stage, filled in) and,
two Steps later, "The Big Picture" (identity, again — "not a different model... decides how
requests share the GPU... the same inference-server stage") — both making the same claim, and
both rendering `VllmDiagram` with no `highlight`, identical to the diagram Section 2's "The
Pieces vLLM Combines" Step also rendered unhighlighted — the same 4-piece map shown 3 times with
no visual distinction between them anywhere in the Unit. Also flagged: the pedagogy guidelines
require the *second* Step to be the "big picture" Step with its diagram — vLLM's actual "Big
Picture"-titled Step sat 4th, not 2nd.
Fixed by merging: "What Is vLLM?" and "The Big Picture" became one Step, titled "The Big
Picture," now correctly the Unit's 2nd Step, keeping the identity claim once and carrying
`VllmDiagram` (unhighlighted — the first, full-map look at all 4 pieces). "Where Does vLLM
Actually Run?" (genuinely distinct content — the application → vLLM → driver/CUDA stack — not
touched) moved up to 3rd. Welcome: 4 Steps → 3. Separately, Section 2's own `VllmDiagram` now
passes `highlight={["memory", "prefix-cache", "speculative-decoding"]}` — dimming Continuous
Batching — so its second appearance visually reinforces "the last three are this chapter's
subject" instead of repeating the exact same unhighlighted diagram a second time. 28 → 27 Steps.
`tsc`/`eslint` clean, verified live in-browser.

**`VllmDiagram.tsx` layout bug** (caught from a screenshot the user sent, not text feedback): a
user read the 4-piece row inside the vLLM box as a left-to-right processing pipeline — "does
Continuous Batching run, then PagedAttention, then Prefix Caching, then Speculative Decoding,
then the result goes to the GPU?" It doesn't; the 4 are independent techniques vLLM applies
together, not sequential stages. Root cause: the box sits between two *real* left-to-right
arrows (Requests → vLLM → GPU), and the 4 pieces inside it were laid out in that same single
left-to-right row with no arrows of their own — so a reader reasonably applied the same
left-to-right-means-order convention inside the box as outside it. Fixed in the shared component
(so both usages — Welcome's "Big Picture" and Section 2's "The Pieces vLLM Combines" — inherit
the fix): the 4 pieces now render as a 2×2 grid instead of a single row, which reads as "a set,"
not "a sequence." `tsc`/`eslint` clean, verified live in-browser at both usages.

**PagedAttention grid cell counts didn't match — "looked like a scam graphic," in the user's
words.** `RESERVATION_CELLS` (16), `FRAGMENTATION_CELLS` (32), and `PACKED_CELLS` (9) were three
different totals across adjacent Steps, and the "100 adjacent rooms" hotel-analogy prose didn't
match any of them. First pass unified all three to 32 — wrong, on reflection: `RESERVATION_CELLS`
depicts *one* guest's own worst-case reservation (correctly tied to `MAX_LEN`/`GRID_CELLS`'s real
32-cell scale, shared with the later "Try it yourself" Step); `FRAGMENTATION_CELLS`/`PACKED_CELLS`
depict a *shared pool* across three guests' reservations, before/after — a different scope that
only needs to match *itself* (which it does: 32 total, 9 used cells, in both). Forcing one total
across both scopes was itself a new, subtler version of the same mistake. Kept: `RESERVATION_CELLS`
at 32 (text updated: "100" → "32" throughout the hotel analogy, matching the visual exactly);
`PACKED_CELLS` padded with 23 `free` cells to match `FRAGMENTATION_CELLS`'s 32/9 (previously 9,
a real mismatch against the "before" picture of the identical scenario) — this also makes the
visual argument better: PagedAttention doesn't just use less memory, it leaves real contiguous
room in the *same* pool for more guests. Fixed a claim this uncovered: "Two Kinds of Waste"'s
opening line asserted "Reserving 32 rooms per guest," which doesn't hold once multiple,
deliberately *varied*-size reservations are shown together — reworded to make no specific
per-guest claim. Verified live in-browser at all four grids (Steps depicting `RESERVATION_CELLS`,
`FRAGMENTATION_CELLS`, `PACKED_CELLS`, and the live utilization grids).

**"Without vLLM" is not the same claim as "1 request at a time," and Step 5 needs to say so.**
User challenge: GPUs are parallel hardware — why would skipping vLLM specifically force
one-request-at-a-time serving? It doesn't. The accurate claim (already correct in Model Serving
and in this Unit's own Section 1 opening) is "without *any* serving engine" — other real systems
(TensorRT-LLM, TGI, hand-written batching code) can also batch without being vLLM specifically.
A "Same GPU, without vLLM" StatCard label from an earlier pass implied vLLM was the only
alternative to naive serving; reworded to "Same GPU, no serving engine." Separately, "The Naive
Approach" Step asserted GPU parallelism goes unused with no mechanism given — added the actual
reason (one request supplies only one word's worth of data per step, not enough to fill thousands
of cores) tied back to the GPU Unit's own "cores need enough data to stay busy" framing; the
StatCard was inaccurate too ("GPU idle *between* requests" — the real waste is *during* a single
request, not between them) and now reads "most cores idle, even while running." Step 5 was also
over-framed as a benchmark citation ("Published vLLM benchmarks measured this directly...") when
the actual point is a flat without/with comparison — reworded plainly for a first-year audience,
restoring a short causal clause ("leaves most cores idle" / "keeps those cores busy") after an
even-flatter first pass dropped it and reintroduced the same "why" question in chat.

**"Serving engine" was never defined, then wrongly merged into "inference server," then
corrected back — a real terminology lesson, not just a wording pass.** The term appeared
starting in the Welcome TOC Step (violating the pedagogy guidelines' "no new jargon in the TOC"
rule) and was used through Section 1 without ever being defined or tied to Model Serving's
already-taught "inference server" concept. First fixed by adding an explicit definition at
Section 1's opening. Then, asked whether the term was worth teaching at all, judged (wrongly)
that it wasn't — reasoning that, unlike PagedAttention or KV cache, it names no specific
mechanism, just "a well-built inference server," so it doesn't need its own noun — and removed
it in favor of "inference server" everywhere (Section 1 retitled "Why a Real Inference Server?",
`ModelServingLab.tsx`'s "a smarter serving engine" changed too). This was wrong: in vLLM's own
real architecture, `LLMEngine` (the scheduling/memory-management core) and the OpenAI-compatible
`api_server` (the HTTP-facing wrapper around it) are genuinely different components, not
synonyms — the engine is *what implements* the server stage, not another name for it. Caught by
the user directly ("語句は正しく使わないとダメでしょ" — terms have to be used correctly). Reverted
in full: Section 1 back to "Why a Dedicated Serving Engine?"; the opening definition rewritten to
state the real relationship — "A serving engine is the software that actually decides which
requests run right now and manages the model's memory while doing it — the real implementation
of the inference-server stage from Model Serving" — rather than treating the two as
interchangeable; every other occurrence (Step 5's body/StatCards, `ModelServingLab.tsx`, this
doc) reverted to match. Model Serving's own "inference server" definition (receives requests,
decides what runs, manages memory) already bundles what real systems split into server+engine —
a defensible simplification for that Unit's own generic purposes, but not a license to erase the
real distinction once vLLM's Unit is specifically naming the component that does the scheduling.
`tsc`/`eslint` clean; verified live in-browser after the revert.

### Continuous Batching (`/inference/continuous-batching`)

Built applying every lesson from vLLM's revision pass *up front* instead of fixing them
afterward: "batch" is genuine new vocabulary (never defined anywhere else in the app), so it
gets its own "What Is Batching?" refresher grounded in vLLM Section 1's GPU-parallelism fact
rather than asserted fresh — the same pattern vLLM's own KV Cache refresher used. No invented
analogy (learned from the hotel-room unit mix-up) — the real scenario (requests, slots, steps)
is concrete enough without a metaphor layer that could introduce its own mapping ambiguity.

`ContinuousBatchingWalkthrough.tsx` — 12 Steps across Welcome + 3 Sections + Wrap-up. One worked
example (4 requests of lengths 5/20/10/5, then 4 more of lengths 8/12/6/15 waiting) threads
through the whole chapter with genuinely computed numbers (real greedy-scheduling simulation
functions, `simulateStatic`/`simulateContinuous`, not fabricated):

- **What Is Batching?** — why running requests together uses far more of a GPU's parallel
  capacity than one at a time; defines "batch" and "slot" from scratch (new `batching` glossary
  Term).
- **Static Batching's Problem** — the naive "wait for the whole batch" rule, visualized with
  `BatchTimelineDiagram.tsx` (a new reusable per-slot Gantt-style timeline: colored = busy, gray
  = idle) showing 3 of 4 slots sitting idle for 15 of 20 steps while the batch's one slow request
  finishes — 40 of 80 possible slot-steps wasted.
- **Continuous Batching** — refilling a slot the instant it frees, shown as two of the same
  timeline diagrams stacked on the same 35-step axis: static's gaps sit in the *middle* (idle
  while work is still queued); continuous's only gap is at the very *end* (queue genuinely
  empty) — same GPU, 28 steps instead of 35. Closes with a "Try it yourself" step (drag the one
  slow request's length, both schedules recompute) — verified in-browser: default (length 20)
  reproduces 35 vs. 28 exactly; dragged down to length 10, both schedules converge to 25 (no
  disparity between requests means no benefit — a real, not glossed-over, edge case).

`ContinuousBatchingLab.tsx` unlocks after completion with a different angle than the
walkthrough's own interactive (request-length disparity): slot count itself, on the same fixed 8
requests — verified in-browser: 4 slots reproduces 35 vs. 28; 8 slots (enough for every request
at once) converges both to 20, bounded only by the single longest request.

Closes with a forward link to Quantization, added once that Unit existed.

Verified: `tsc --noEmit` and `eslint` clean.

### Quantization (`/inference/quantization`)

Reuses the GPU Unit's own example (7B-parameter model, 80 GB VRAM, 14 GB of FP16 weights) instead
of inventing a new one — this Unit is exactly the "makes the VRAM capacity go further again, by
storing each of the model's own numbers in fewer than 2 bytes" forward-reference GPU's Unit made,
now cashed in. Two terminology points enforced deliberately, per this module's revision history:
quantization keeps every parameter and shrinks each one's precision (not pruning/distillation,
which remove parameters — conflating these would repeat the "serving engine" mix-up's mistake);
and the arithmetic example in the Quality Cost Section is explicitly labeled illustrative, the
same convention Speculative Decoding's "The Eiffel Tower is ___" example used, not a real model's
measured output.

`QuantizationWalkthrough.tsx` — 15 Steps across Welcome + 5 Sections + Wrap-up:

- **What Quantization Actually Changes** — disambiguates quantization from removing parameters;
  introduces FP16/INT8/INT4 as bit-widths (16/8/4 bits) via a new `PrecisionBarsDiagram.tsx` (one
  square per bit, filled vs. empty, so "fewer bits" is seen, not just read); explains rounding to
  a coarser grid (65,536 vs. 256 vs. 16 representable values, from the bit counts alone — no
  overclaim about floating-point spacing).
- **The Memory Payoff** — the same 7B model needs 14 GB / 7 GB / 3.5 GB of VRAM for its weights at
  FP16 / INT8 / INT4; freed VRAM becomes KV-cache capacity on the same 80 GB GPU (66 GB → 76.5 GB
  free, FP16 vs. INT4), directly reusing the GPU Unit's own weights-vs-KV-cache framing.
- **The Speed Payoff** — introduces memory bandwidth (new vocabulary, not used elsewhere in the
  app) as the real per-step bottleneck: fewer bits per weight means less data read from VRAM each
  step, independent of core count — the same GPU-memory-bandwidth-vs.-compute-bound reasoning
  worked out earlier in conversation for this module, now written into the app where it's
  actually needed (quantization is the Unit whose payoff doesn't make sense without it).
- **The Quality Cost** — 7 billion small rounding errors introduced at once; a labeled-illustrative
  concrete example (`847 × 293`: FP16/INT8 answer `248,171` correctly, INT4 answers `248,000`);
  closes with which task types are most sensitive (precise arithmetic/code/reasoning) vs. tolerant
  (casual chat) of INT4's coarser rounding.
- **Choosing a Precision** — one summary table (weights / relative speed / quality risk × FP16 /
  INT8 / INT4), no new claims, just the prior Sections' numbers side by side.

`QuantizationLab.tsx` unlocks after completion: drag model size (1–70B), pick a precision and a
task type, see live-computed weights/KV-cache-capacity numbers plus a quality-risk read-out from a
small lookup table (explicitly a simplification, not a fitted model) — verified in-browser: 7B/
INT4/precise-math reads 3.5 GB weights, 76.5 GB free, "high" risk, matching the walkthrough's own
worked numbers exactly.

Also updated in the same pass: Continuous Batching's closing Step now links forward to
`/inference/quantization` (previously plain text, since the Unit didn't exist yet), and its stale
"and GPU hardware itself" forward-reference was removed — leftover text from before GPU moved from
last position to second, it no longer made sense once GPU already appears earlier in the module.

Verified: `tsc --noEmit` and `eslint` clean; live-verified in-browser end to end (Welcome through
Wrap-up, the Lab's interactive controls, and the `/inference` index card flipping from "Coming
soon" to live).

### Performance (`/inference/performance`)

The module's sixth and final Unit. Per "How the Units relate" above, this Unit teaches no new
technique — it only reads metrics the other Units already produced, together, then uses that
reading skill for the hosted-vs-self-hosted decision. Two forward-references cashed in here rather
than re-taught from scratch: Model Serving's "the Performance Unit measures this timing directly"
(time to first token) and the module's own repeated "...and the hosted-vs-self-hosted decision
they feed" line, echoed in every earlier Unit's Wrap-up.

`PerformanceWalkthrough.tsx` — 16 Steps across Welcome + 4 Sections + Wrap-up:

- **Latency, Throughput, and Time to First Token** — recaps latency (Model Serving's own 10
  req/sec server and M/M/1 wait formula, recomputed at 8 req/sec arrivals, not re-derived with new
  numbers) and throughput (vLLM's published "up to 24×"), then formally defines time to first
  token (TTFT) and contrasts it against total latency with one illustrative example (150 ms TTFT,
  4 sec total, for a 200-token response).
- **The Latency-Throughput Tradeoff** — batching more requests together (Continuous Batching)
  raises throughput but can add queueing latency per request — a real tradeoff, not a flaw in any
  one Unit.
- **Reading a Metrics Dashboard** — the Unit's central skill, taught through three labeled-
  illustrative dashboard scenarios (same convention as Quantization's arithmetic example, not
  measurements from a real system): high TTFT + low throughput → undersized capacity/queueing; low
  TTFT + high total latency → a long response, not a serving problem; high throughput + high
  latency together → the Section 2 tradeoff working as intended, not a regression. The point is
  reading metrics together, not any one in isolation.
- **Hosted API vs. Self-Hosted** — cost *structure* (usage-scaled vs. fixed), explicitly kept
  qualitative in the walkthrough itself (no fabricated dollar figures), plus control/complexity as
  a second, non-cost axis, and an explicit callback tying the whole module together: self-hosting
  only pays off if continuous batching/quantization/etc. actually deliver enough throughput per
  GPU to justify the fixed cost.

`PerformanceLab.tsx` unlocks after completion with the concrete numbers the walkthrough
deliberately withheld: drag daily request volume, hosted-API price per request, and self-hosted
GPU fixed cost per day, and see both total costs plus the analytically-computed breakeven volume —
verified in-browser: 5,000 req/day at $0.002/request vs. $30/day GPU reads $10 vs. $30/day (hosted
cheaper) with a 15,000 req/day breakeven; dragging to 33,000 req/day flips the highlighted cheaper
option to self-hosted ($30 vs. $66/day), matching the same breakeven exactly.

Also updated in the same pass: Quantization's closing Step now links forward to
`/inference/performance` (previously plain text, since the Unit didn't exist yet).

Verified: `tsc --noEmit` and `eslint` clean; live-verified in-browser end to end (Welcome through
Wrap-up, all three dashboard scenarios, the hosted-vs-self-hosted Section, and the Lab's breakeven
calculator crossing over correctly), and the `/inference` index page now shows all six Units live.

### Module status: all 6 planned Units built

Model Serving, GPU, vLLM, Continuous Batching, Quantization, and Performance are all live. Nothing
left planned for this module (see "Everything else" below, now empty by design rather than by
omission).

### Everything else

Nothing outstanding — every originally planned Unit (see "Planned Units" above) is built.
