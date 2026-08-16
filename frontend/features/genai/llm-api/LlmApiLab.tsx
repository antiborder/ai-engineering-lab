"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import { complete, listModels, type CompletionResponse } from "../api";

export function LlmApiLab() {
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("mock-small");
  const [system, setSystem] = useState("");
  const [prompt, setPrompt] = useState("Explain what a vector database is in two sentences.");
  const [result, setResult] = useState<CompletionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listModels()
      .then(setModels)
      .catch(() => setModels(["mock-small", "mock-large"]));
  }, []);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await complete(model, prompt, system || undefined);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? `${err.status}: ${err.message}` : "Could not reach the backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-4">
        <label className="block text-sm">
          <div className="text-neutral-400 mb-1">System prompt (optional)</div>
          <textarea
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            rows={2}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 font-mono"
            placeholder="You are a helpful assistant."
          />
        </label>
        <label className="block text-sm">
          <div className="text-neutral-400 mb-1">Prompt</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100 font-mono"
          />
        </label>
        <div className="flex items-center gap-3">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-sm text-neutral-100"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            onClick={handleRun}
            disabled={loading || !prompt}
            className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium text-white"
          >
            {loading ? "Running…" : "Run"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{error}</p>
        )}
        {result && (
          <pre className="whitespace-pre-wrap text-sm text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-md p-3">
            {result.text}
          </pre>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-sm text-neutral-400">Call details</div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Model" value={result?.model ?? "—"} />
          <StatCard label="Latency" value={result ? `${result.latency_ms.toFixed(0)}ms` : "—"} />
          <StatCard label="Input tokens" value={result ? String(result.input_tokens) : "—"} />
          <StatCard label="Output tokens" value={result ? String(result.output_tokens) : "—"} />
          <StatCard label="Est. cost" value={result ? `$${result.estimated_cost.toFixed(6)}` : "—"} />
          <StatCard label="Request ID" value={result ? result.request_id.slice(0, 8) : "—"} />
        </div>
        <p className="text-xs text-neutral-500">
          Provider is mocked (spec section 35) — deterministic per prompt+model, no API keys or
          network calls, but real token counts, latency, and cost accounting.
        </p>
      </div>
    </div>
  );
}
