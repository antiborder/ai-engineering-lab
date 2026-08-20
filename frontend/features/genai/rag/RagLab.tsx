"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { SaveArtifactPanel } from "@/components/SaveArtifactPanel";
import { Slider } from "../../fundamentals/classical-ml/Slider";
import { listDocuments, ragQuery, type RagDocument, type RagQueryResponse } from "../api";
import { DocumentPanel } from "./DocumentPanel";
import { RetrievedChunksList } from "./RetrievedChunksList";

const PIPELINE = [
  "Document", "Parsing", "Chunking", "Embedding", "Vector Search", "Top-K", "Reranking", "Context", "LLM", "Answer",
];

export function RagLab() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [query, setQuery] = useState("how does sourdough bread rise?");
  const [chunkSize, setChunkSize] = useState(60);
  const [overlap, setOverlap] = useState(15);
  const [topK, setTopK] = useState(3);
  const [similarityThreshold, setSimilarityThreshold] = useState(0);
  const [useReranking, setUseReranking] = useState(false);
  const [model, setModel] = useState("mock-small");

  const [result, setResult] = useState<RagQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => setError("Could not reach the backend API. Is it running?"));
  }, []);

  const handleAsk = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ragQuery({
        query,
        chunk_size: chunkSize,
        overlap,
        top_k: topK,
        similarity_threshold: similarityThreshold,
        use_reranking: useReranking,
        model,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? `${err.status}: ${err.message}` : "Could not reach the backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
        {PIPELINE.map((stage, i) => (
          <span key={stage} className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-full border border-neutral-200 bg-white">{stage}</span>
            {i < PIPELINE.length - 1 && <span className="text-neutral-400">→</span>}
          </span>
        ))}
      </div>

      <DocumentPanel documents={documents} onChange={setDocuments} />

      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900"
              placeholder="Ask a question about the documents…"
            />
            <button
              onClick={handleAsk}
              disabled={loading || !query}
              className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium text-white"
            >
              {loading ? "Asking…" : "Ask"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">{error}</p>
          )}

          {result && (
            <>
              <div>
                <div className="text-sm text-neutral-600 mb-2">
                  Retrieved chunks {result.retrieved.length > 0 && `(top ${result.retrieved.length})`}
                </div>
                <RetrievedChunksList chunks={result.retrieved} reranked={useReranking} />
              </div>

              <div>
                <div className="text-sm text-neutral-600 mb-2">Answer</div>
                <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm text-neutral-800">
                  {result.answer}
                </div>
              </div>

              <SaveArtifactPanel
                type="rag"
                defaultName="My RAG"
                model={model}
                configuration={{
                  chunk_size: chunkSize,
                  overlap,
                  top_k: topK,
                  similarity_threshold: similarityThreshold,
                  reranking: useReranking,
                }}
              />
            </>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm text-neutral-600">Retrieval parameters</div>
          <Slider label="Chunk size (words)" value={chunkSize} min={20} max={200} step={10} onChange={setChunkSize} />
          <Slider label="Overlap (words)" value={overlap} min={0} max={Math.max(0, chunkSize - 10)} step={5} onChange={setOverlap} />
          <Slider label="Top-K" value={topK} min={1} max={8} step={1} onChange={setTopK} />
          <Slider
            label="Similarity threshold"
            value={similarityThreshold}
            min={0}
            max={0.5}
            step={0.01}
            onChange={setSimilarityThreshold}
            format={(v) => v.toFixed(2)}
          />
          <label className="flex items-center gap-1.5 text-sm text-neutral-600">
            <input type="checkbox" checked={useReranking} onChange={(e) => setUseReranking(e.target.checked)} />
            reranking
          </label>
          <label className="block text-sm">
            <div className="text-neutral-600 mb-1">Model</div>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-900"
            >
              <option value="mock-small">mock-small</option>
              <option value="mock-large">mock-large</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
