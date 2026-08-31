"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Term } from "@/components/Term";
import { Equation } from "@/components/Equation";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { RagPipelineDiagram } from "./RagPipelineDiagram";
import { ChunkingDiagram } from "./ChunkingDiagram";
import { SimilarityBars, type ScoredChunk } from "./SimilarityBars";

// Illustrative retrieval scores for the query "how does sourdough bread
// rise?" over the real 6-document demo corpus (backend/app/genai/
// rag_corpus.py) — schematic, not computed by the real TfidfIndex, but
// shaped the way real TF-IDF scores would be: the on-topic chunks score
// far higher than the rest, which mostly sit near zero.
const VECTOR_SCORES: ScoredChunk[] = [
  { label: "Sourdough Bread #0", score: 0.58 },
  { label: "Sourdough Bread #1", score: 0.41 },
  { label: "Coffee Brewing #2", score: 0.09 },
  { label: "Cat Behavior #0", score: 0.03 },
];

// Same chunks, illustrating the mock reranker's real behavior
// (backend/app/genai/rag.py's rerank(): 0.5 × vector score + 0.5 × exact
// query-word overlap) — chunk #1 happens to repeat "rise" and "bread"
// verbatim, so it overtakes #0 after reranking even though #0 had the
// higher vector score.
const RERANKED_SCORES: ScoredChunk[] = [
  { label: "Sourdough Bread #0", score: 0.58, rerankScore: 0.52 },
  { label: "Sourdough Bread #1", score: 0.41, rerankScore: 0.61 },
  { label: "Coffee Brewing #2", score: 0.09, rerankScore: 0.05 },
  { label: "Cat Behavior #0", score: 0.03, rerankScore: 0.02 },
];

const CONTEXT_EXAMPLE = `Context:
[Sourdough Bread #0] Sourdough bread gets its rise from a wild yeast
starter instead of commercial yeast...
[Sourdough Bread #1] The starter is a mix of flour and water left to
ferment over several days...

Question: how does sourdough bread rise?

Answer the question using only the context above.`;

const ARTIFACT_CONFIG_EXAMPLE = `{
  "name": "My RAG v1",
  "type": "rag",
  "model": "mock-small",
  "configuration": {
    "chunk_size": 2,
    "overlap": 1,
    "top_k": 3,
    "similarity_threshold": 0,
    "reranking": false
  }
}`;

/** GenAI Systems Unit's fourth Chapter, and per spec section 13 "one of the
 * most important interactive experiences" in the whole app. Entirely
 * schematic/illustrative — no backend calls — matching every other GenAI
 * Systems Chapter's split between a fast guided walkthrough and a
 * separately-unlocked "Explore it yourself" sandbox (here, the real
 * backend-connected RagLab, with a real TF-IDF index over a real 6-document
 * corpus, and the one place in this app today where [Save as AI Artifact]
 * actually exists). */
export function RagWalkthrough({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);

  const [chunkSize, setChunkSize] = useState(2);
  const [overlap, setOverlap] = useState(1);
  const resetChunking = () => {
    setChunkSize(2);
    setOverlap(1);
  };

  const [topK, setTopK] = useState(2);
  const [threshold, setThreshold] = useState(0.05);
  const resetTopK = () => {
    setTopK(2);
    setThreshold(0.05);
  };

  const [rerankOn, setRerankOn] = useState(false);
  const resetRerank = () => setRerankOn(false);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white";
  const chapterLinkBtn =
    "inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm font-semibold";
  const toggleBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm border ${
      active ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
    }`;

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers answering questions from your own documents, end to end:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Documents &amp; Chunking</strong> — splitting text into pieces small enough to search.</li>
            <li><strong>Turning Text into Vectors</strong> — chunks and questions both become vectors so similarity becomes a math question.</li>
            <li><strong>Vector Search</strong> — scoring chunks by similarity to the question.</li>
            <li><strong>Top-K &amp; Similarity Threshold</strong> — how many chunks to keep, and cutting off weak matches.</li>
            <li><strong>Reranking</strong> — a second pass that can reorder the results.</li>
            <li><strong>Context &amp; Generation</strong> — assembling retrieved chunks into the model&rsquo;s prompt.</li>
            <li><strong>Saving as an AI Artifact</strong> — carrying this setup into later modules.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "What Is RAG?",
      body: (
        <p>
          <strong>RAG</strong> stands for <strong>Retrieval-Augmented Generation</strong>:
          instead of relying only on what a model memorized during training, RAG searches your
          own documents for relevant pieces first, then hands those to the model before it
          answers. It matters because it lets a model answer accurately about things it was never
          trained on — your own files, last week&rsquo;s data, anything — without the cost of
          retraining the model itself.
        </p>
      ),
      visual: (
        <div className="flex flex-col sm:flex-row gap-2 text-center">
          <div className="flex-1 bg-white border border-cyan-300 rounded-md p-3">
            <div className="text-lg font-bold text-cyan-700">R</div>
            <div className="text-xs font-medium text-neutral-800 mb-1">Retrieval</div>
            <div className="text-xs text-neutral-500">Search your documents for relevant pieces</div>
          </div>
          <div className="flex-1 bg-white border border-purple-300 rounded-md p-3">
            <div className="text-lg font-bold text-purple-700">A</div>
            <div className="text-xs font-medium text-neutral-800 mb-1">Augmented</div>
            <div className="text-xs text-neutral-500">Add those pieces to what the model sees</div>
          </div>
          <div className="flex-1 bg-white border border-orange-300 rounded-md p-3">
            <div className="text-lg font-bold text-orange-700">G</div>
            <div className="text-xs font-medium text-neutral-800 mb-1">Generation</div>
            <div className="text-xs text-neutral-500">The model writes an answer using them</div>
          </div>
        </div>
      ),
    },
    {
      section: "Welcome",
      title: "Why Do We Need RAG?",
      body: (
        <p>
          A model&rsquo;s knowledge is frozen at training time — it doesn&rsquo;t know about your
          own files or anything that happened since, which is the gap Retrieval fills. But even
          once you have the right documents, you can&rsquo;t just paste your entire library into
          every prompt: every model has a fixed{" "}
          <Term id="context-window">context window</Term> — a hard limit on tokens per call — and
          a longer prompt also costs more and answers slower, as you saw in LLM API. RAG&rsquo;s
          whole point is searching for just the relevant pieces first, instead of sending
          everything.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="bg-white border-2 border-red-300 rounded-md p-3">
            <div className="text-xs font-medium text-red-700 mb-1">✗ Paste everything</div>
            <div className="text-xs text-neutral-500">
              Your entire document library — usually bigger than any context window, and
              expensive and slow even on the rare occasion it fits.
            </div>
          </div>
          <div className="bg-white border-2 border-emerald-300 rounded-md p-3">
            <div className="text-xs font-medium text-emerald-700 mb-1">
              ✓ Retrieve just the relevant pieces
            </div>
            <div className="text-xs text-neutral-500">
              A handful of chunks that actually answer the question — small, cheap, fast. This is
              what RAG does.
            </div>
          </div>
        </div>
      ),
    },
    {
      section: "Welcome",
      title: "A Concrete Example",
      body: (
        <p>
          Say you ask <em>&ldquo;How does sourdough bread rise?&rdquo;</em> RAG searches your
          documents, finds the pieces about sourdough starters, hands those to the model as
          context, and the model writes its answer from them — instead of guessing from training
          data alone.
        </p>
      ),
      visual: (
        <div className="flex flex-col sm:flex-row items-stretch gap-2 text-xs">
          <div className="flex-1 bg-white border border-neutral-300 rounded-md p-3">
            <div className="font-medium text-neutral-700 mb-1">Your question</div>
            <div className="text-neutral-500">&ldquo;How does sourdough bread rise?&rdquo;</div>
          </div>
          <div className="flex items-center justify-center text-neutral-400 shrink-0">→</div>
          <div className="flex-1 bg-white border border-cyan-300 rounded-md p-3">
            <div className="font-medium text-cyan-700 mb-1">Found in your documents</div>
            <div className="text-neutral-500">
              Sourdough Bread — &ldquo;gets its rise from a wild yeast starter…&rdquo;
            </div>
          </div>
          <div className="flex items-center justify-center text-neutral-400 shrink-0">→</div>
          <div className="flex-1 bg-white border border-emerald-300 rounded-md p-3">
            <div className="font-medium text-emerald-700 mb-1">Model&rsquo;s answer</div>
            <div className="text-neutral-500">
              &ldquo;It rises from CO₂ produced by wild yeast fermenting in the starter.&rdquo;
            </div>
          </div>
        </div>
      ),
    },
    {
      section: "Welcome",
      title: "The big picture, before the details",
      body: (
        <p>
          Structured Output shaped a single response. RAG is bigger, and happens in two phases:
          your documents get prepared once, ahead of time; then every question you ask gets
          answered by searching those prepared pieces and handing the relevant ones to the model.
        </p>
      ),
      visual: <RagPipelineDiagram />,
    },
    // -------------------------- 1. Documents & Chunking --------------------------
    {
      section: "1. Documents & Chunking",
      title: "Chunking: Splitting Documents into Pieces",
      body: (
        <p>
          Chunking is cutting each document into smaller pieces — chunks — so search can compare
          and retrieve individual pieces instead of whole documents. This app, like most
          real-world chunkers, splits along sentence boundaries, so each chunk stays a coherent,
          readable unit rather than a random slice of text.
        </p>
      ),
      visual: <ChunkingDiagram chunkSize={2} overlap={0} />,
    },
    {
      section: "1. Documents & Chunking",
      title: "Try it yourself: chunk size and overlap",
      body: (
        <p>
          Overlap repeats a sentence from the end of one chunk at the start of the next, so an
          idea sitting right on a chunk boundary doesn&rsquo;t get lost entirely. Adjust both and
          watch the two example chunks change.
        </p>
      ),
      controls: (
        <div className="w-full max-w-75 space-y-3">
          <label className="block text-sm">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Chunk size (sentences)</span>
              <span className="text-neutral-800 tabular-nums">{chunkSize}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
          <label className="block text-sm">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Overlap (sentences)</span>
              <span className="text-neutral-800 tabular-nums">{overlap}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, chunkSize - 1)}
              step={1}
              value={Math.min(overlap, Math.max(0, chunkSize - 1))}
              onChange={(e) => setOverlap(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetChunking,
      visual: <ChunkingDiagram chunkSize={chunkSize} overlap={overlap} />,
    },
    // -------------------------- 2. Turning Text into Vectors --------------------------
    {
      section: "2. Turning Text into Vectors",
      title: "From Text to Numbers: Why Vectors",
      body: (
        <p>
          To compare a question against thousands of chunks, both need to become{" "}
          <Term id="embedding">vectors</Term> — lists of numbers — so &ldquo;how similar are
          these two pieces of text&rdquo; becomes a math question a computer can answer directly,
          instead of a comparison a person has to make by reading. This happens twice: once for
          every chunk, ahead of time, and once for the question itself — the &ldquo;Query&rdquo;
          in the diagram below — every time you ask.
        </p>
      ),
      visual: <RagPipelineDiagram highlight={["embedding", "query", "query-embedding"]} />,
    },
    // -------------------------- 3. Vector Search --------------------------
    {
      section: "3. Vector Search",
      title: "Cosine Similarity: How Close Are Two Vectors?",
      body: (
        <div className="space-y-2">
          <p>
            Vector search scores every chunk by{" "}
            <Term id="cosine-similarity">cosine similarity</Term> to the question&rsquo;s own
            vector — a number from -1 to 1, higher meaning more shared, rarity-weighted words.
          </p>
          <Equation tex={"\\text{similarity} = \\frac{\\vec{q}\\cdot\\vec{c}}{\\lVert\\vec{q}\\rVert\\,\\lVert\\vec{c}\\rVert}"} />
          <p className="text-neutral-500">
            This app&rsquo;s vectors are already scaled to length 1, so that division does
            nothing — the similarity score is just the dot product{" "}
            <Equation tex={"\\vec{q}\\cdot\\vec{c}"} display={false} />.
          </p>
        </div>
      ),
      visual: <RagPipelineDiagram highlight={["vector-search"]} />,
    },
    {
      section: "3. Vector Search",
      title: "On-Topic Chunks Score Far Higher",
      body: (
        <p>
          For &ldquo;how does sourdough bread rise?&rdquo;, the two Sourdough Bread chunks score{" "}
          <strong>0.58</strong> and <strong>0.41</strong> — far above the coffee-brewing
          chunk&rsquo;s <strong>0.09</strong> and the cat-behavior chunk&rsquo;s{" "}
          <strong>0.03</strong>. This is the search step doing its job: separating signal from
          noise before anything reaches the model.
        </p>
      ),
      visual: <SimilarityBars chunks={VECTOR_SCORES} />,
    },
    // -------------------------- 4. Top-K & Similarity Threshold --------------------------
    {
      section: "4. Top-K & Similarity Threshold",
      title: "Top-K: How Many Chunks to Keep",
      body: (
        <p>
          Top-K keeps only the K highest-scoring chunks and discards the rest — the model only
          ever sees a handful of chunks, not the whole ranked list.
        </p>
      ),
      visual: <SimilarityBars chunks={VECTOR_SCORES} topK={2} />,
    },
    {
      section: "4. Top-K & Similarity Threshold",
      title: "Try it yourself: top-K and similarity threshold",
      body: (
        <p>
          A similarity threshold discards chunks below a minimum score outright, even if there
          are fewer than K of them left. Adjust both and watch which chunks stay active.
        </p>
      ),
      controls: (
        <div className="w-full max-w-75 space-y-3">
          <label className="block text-sm">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Top-K</span>
              <span className="text-neutral-800 tabular-nums">{topK}</span>
            </div>
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
          <label className="block text-sm">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Similarity threshold</span>
              <span className="text-neutral-800 tabular-nums">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetTopK,
      visual: <SimilarityBars chunks={VECTOR_SCORES} topK={topK} threshold={threshold} />,
    },
    // -------------------------- 5. Reranking --------------------------
    {
      section: "5. Reranking",
      title: "Reranking: A Second, Smarter Pass",
      body: (
        <div className="space-y-2">
          <p>
            Vector search is fast, but a blunt approximation — it can rank a chunk higher just
            because it happens to share rare words, even if a different chunk is more truly
            relevant. Reranking fixes this with a second, more careful scoring pass — but only
            over the handful of chunks vector search already retrieved, not the whole corpus, so
            the extra cost stays small.
          </p>
          <Equation tex={"\\text{rerank\\_score} = 0.5 \\times \\text{vector score} + 0.5 \\times \\text{word overlap}"} />
          <p className="text-neutral-500">
            This app&rsquo;s reranker blends the two signals equally, where &ldquo;word
            overlap&rdquo; is the fraction of the question&rsquo;s words that appear in the chunk
            verbatim. For example, a chunk with vector score 0.4, where 3 of the question&rsquo;s
            5 words appear in it (0.6 overlap), gets rerank_score = 0.5×0.4 + 0.5×0.6 ={" "}
            <strong>0.5</strong>.
          </p>
        </div>
      ),
      visual: <RagPipelineDiagram highlight={["reranking"]} />,
    },
    {
      section: "5. Reranking",
      title: "Try it yourself: reranking on vs. off",
      body: (
        <p>
          &ldquo;Sourdough Bread #1&rdquo; repeats more of the question&rsquo;s words verbatim
          than &ldquo;#0&rdquo; does, so its word-overlap score is higher — enough to push it
          above &ldquo;#0&rdquo; after reranking, even though #0 had the higher vector score
          alone.
        </p>
      ),
      controls: (
        <div className="flex gap-2">
          {([false, true] as const).map((v) => (
            <button key={String(v)} onClick={() => setRerankOn(v)} className={toggleBtn(rerankOn === v)}>
              reranking: {v ? "on" : "off"}
            </button>
          ))}
        </div>
      ),
      resetAction: resetRerank,
      visual: <SimilarityBars chunks={rerankOn ? RERANKED_SCORES : VECTOR_SCORES} topK={2} />,
    },
    {
      section: "5. Reranking",
      title: "Reranking, Summarized",
      body: (
        <ul className="list-disc list-inside space-y-1 text-neutral-700">
          <li><strong>Why:</strong> vector search is fast but approximate — it can rank a chunk higher just because it happens to share rare words.</li>
          <li><strong>What:</strong> re-score only the already-retrieved chunks with a second, more careful signal, and reorder them if needed.</li>
          <li><strong>Cost:</strong> cheap — it only touches a handful of chunks, never the whole corpus.</li>
        </ul>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-neutral-500 mb-1 font-medium">Before reranking</div>
            <ol className="list-decimal list-inside space-y-1 text-neutral-700">
              <li>Sourdough Bread #0 — 0.58</li>
              <li>Sourdough Bread #1 — 0.41</li>
            </ol>
          </div>
          <div>
            <div className="text-neutral-500 mb-1 font-medium">After reranking</div>
            <ol className="list-decimal list-inside space-y-1 text-neutral-700">
              <li>Sourdough Bread #1 — 0.61</li>
              <li>Sourdough Bread #0 — 0.52</li>
            </ol>
          </div>
        </div>
      ),
    },
    // -------------------------- 6. Context & Generation --------------------------
    {
      section: "6. Context & Generation",
      title: "Assembling the Context",
      body: (
        <p>
          The surviving chunks are joined into one block of text, labeled by source, and placed
          in the prompt ahead of the actual question — with an explicit instruction to answer
          only from what&rsquo;s there.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {CONTEXT_EXAMPLE}
        </pre>
      ),
    },
    {
      section: "6. Context & Generation",
      title: "The Model Only Sees What You Retrieved",
      body: (
        <p>
          Every earlier step — chunking, vector search, top-K, reranking — decides what makes it
          into this context. If the relevant chunk never gets retrieved, the model can&rsquo;t
          answer well, no matter how capable it is.
        </p>
      ),
      visual: <RagPipelineDiagram highlight={["context", "llm", "answer"]} />,
    },
    // -------------------------- 7. Saving as an AI Artifact --------------------------
    {
      section: "7. Saving as an AI Artifact",
      title: "AI Artifact: A Saved Configuration You Can Reuse",
      body: (
        <div className="space-y-2">
          <p>
            An <Term id="ai-artifact">AI Artifact</Term> is a saved configuration you can reuse
            and compare against later versions.
          </p>
          <p>
            Without saving, every adjustment you make here — chunk size, top-K, reranking — only
            exists on this page, in this session; close the tab and it&rsquo;s gone.
          </p>
          <p>
            Saving as an AI Artifact keeps that configuration under a name and version number, so
            you can reload it, or check whether a new version actually performs better in
            Evaluation, instead of re-tuning from memory.
          </p>
        </div>
      ),
      visual: (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {["Build", "Evaluate", "Optimize", "Deploy", "Monitor", "Improve"].map((stage, i, arr) => (
            <span key={stage} className="flex items-center gap-1.5">
              <span
                className={`px-2 py-1 rounded-full border text-xs font-medium ${
                  stage === "Build"
                    ? "border-cyan-600 bg-cyan-50 text-cyan-800"
                    : "border-neutral-200 bg-white text-neutral-400"
                }`}
              >
                {stage}
              </span>
              {i < arr.length - 1 && <span className="text-neutral-300">→</span>}
            </span>
          ))}
        </div>
      ),
    },
    {
      section: "7. Saving as an AI Artifact",
      title: "What Gets Saved: One Version's Configuration",
      body: (
        <p>
          Everything you just adjusted — chunk size, overlap, top-K, threshold, reranking — plus
          the model, becomes the <strong>configuration</strong> of one saved version. The AI
          Artifact itself is the named container that holds every version (v1, v2, v3…); this
          JSON is what a single version actually stores.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-sm text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {ARTIFACT_CONFIG_EXAMPLE}
        </pre>
      ),
    },
    // ---------------------------- 8. Wrap-up ------------------------------
    {
      section: "8. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>RAG</strong> (Retrieval-Augmented Generation) searches your documents, then hands the model what it found before it answers.</li>
            <li>Preparing your documents (chunking, embedding) happens once; answering a question happens every time you ask.</li>
            <li>Chunking splits documents into fixed-size pieces; overlap protects ideas sitting on a chunk boundary.</li>
            <li>This app&rsquo;s vectors are <Term id="tfidf">TF-IDF</Term> — real, but word-counting, not meaning-aware like a trained embedding.</li>
            <li><Term id="cosine-similarity">Cosine similarity</Term> ranks chunks against the question&rsquo;s own vector.</li>
            <li>Top-K and a similarity threshold both trim the ranked list, in different ways.</li>
            <li>Reranking re-scores the survivors with a second, more careful pass, and can reorder them.</li>
            <li>Retrieved chunks are assembled into the model&rsquo;s context, with an instruction to answer only from it.</li>
            <li>Saving as an <Term id="ai-artifact">AI Artifact</Term> is what carries this setup into Evaluation, scored and compared against earlier versions.</li>
          </ul>
        </div>
      ),
      visual: <RagPipelineDiagram />,
    },
    {
      section: "8. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything above is now unlocked below, talking to the real backend: ask questions
          about a real 6-document corpus, adjust every parameter, and save your own AI Artifact.
          <br />
          Or,{" "}
          <Link href="/genai/tool-calling" className={chapterLinkBtn}>
            proceed to Tool Calling &amp; Agents →
          </Link>
        </p>
      ),
      visual: undefined,
    },
  ];

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => {
    if (isLast) {
      onComplete?.();
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-xs uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-sm text-neutral-700"
          >
            Back
          </button>
          <button onClick={goNext} className={nextBtn}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
        <span className="text-xs text-neutral-500 sm:flex-1 sm:text-right">
          Step {step + 1} of {total}
        </span>
      </div>

      <SegmentedProgressBar
        sections={steps.map((s) => s.section)}
        currentStep={step}
        onSelectStep={setStep}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">{current.title}</h3>
        <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
          </div>
        )}
        {current.resetAction && (
          <button
            onClick={current.resetAction}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            ↺ Undo / reset this step
          </button>
        )}

        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
