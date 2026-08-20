"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { complete } from "../api";

const DEFAULT_TEST_CASES = [
  "What is the capital of France?",
  "Summarize the plot of Romeo and Juliet in one sentence.",
  "Write a haiku about the ocean.",
];

interface CellResult {
  text: string;
  latencyMs: number;
  outputTokens: number;
}

export function PromptComparisonLab() {
  const [promptA, setPromptA] = useState("You are a concise assistant. Answer in one short sentence.");
  const [promptB, setPromptB] = useState("You are a thorough assistant. Explain your reasoning in detail.");
  const [testCases, setTestCases] = useState(DEFAULT_TEST_CASES);
  const [newCase, setNewCase] = useState("");
  const [model, setModel] = useState("mock-small");
  const [resultsA, setResultsA] = useState<CellResult[] | null>(null);
  const [resultsB, setResultsB] = useState<CellResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([
        Promise.all(testCases.map((tc) => complete(model, tc, promptA))),
        Promise.all(testCases.map((tc) => complete(model, tc, promptB))),
      ]);
      setResultsA(a.map((r) => ({ text: r.text, latencyMs: r.latency_ms, outputTokens: r.output_tokens })));
      setResultsB(b.map((r) => ({ text: r.text, latencyMs: r.latency_ms, outputTokens: r.output_tokens })));
    } catch (err) {
      setError(err instanceof ApiError ? `${err.status}: ${err.message}` : "Could not reach the backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <div className="text-neutral-600 mb-1">Prompt A (system instructions)</div>
          <textarea
            value={promptA}
            onChange={(e) => setPromptA(e.target.value)}
            rows={3}
            className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 font-mono"
          />
        </label>
        <label className="block text-sm">
          <div className="text-neutral-600 mb-1">Prompt B (system instructions)</div>
          <textarea
            value={promptB}
            onChange={(e) => setPromptB(e.target.value)}
            rows={3}
            className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900 font-mono"
          />
        </label>
      </div>

      <div>
        <div className="text-sm text-neutral-600 mb-2">Test cases (same input sent to both prompts)</div>
        <ul className="space-y-1.5">
          {testCases.map((tc, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-mono text-neutral-400 bg-white border border-neutral-200 rounded-md px-3 py-1.5">
                {tc}
              </span>
              <button
                onClick={() => setTestCases((cases) => cases.filter((_, j) => j !== i))}
                className="text-xs text-neutral-500 hover:text-red-700 px-2"
                aria-label="Remove test case"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <input
            value={newCase}
            onChange={(e) => setNewCase(e.target.value)}
            placeholder="Add a test case…"
            className="flex-1 bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm text-neutral-900"
          />
          <button
            onClick={() => {
              if (!newCase.trim()) return;
              setTestCases((cases) => [...cases, newCase.trim()]);
              setNewCase("");
            }}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-800"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-sm text-neutral-900"
        >
          <option value="mock-small">mock-small</option>
          <option value="mock-large">mock-large</option>
        </select>
        <button
          onClick={handleRun}
          disabled={loading || testCases.length === 0}
          className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium text-white"
        >
          {loading ? "Running…" : "Run comparison"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">{error}</p>
      )}

      {resultsA && resultsB && (
        <div className="grid md:grid-cols-2 gap-4">
          <ResultColumn label="Prompt A" results={resultsA} testCases={testCases} />
          <ResultColumn label="Prompt B" results={resultsB} testCases={testCases} />
        </div>
      )}
    </div>
  );
}

function ResultColumn({
  label,
  results,
  testCases,
}: {
  label: string;
  results: CellResult[];
  testCases: string[];
}) {
  const avgLatency = results.reduce((s, r) => s + r.latencyMs, 0) / Math.max(1, results.length);
  const avgTokens = results.reduce((s, r) => s + r.outputTokens, 0) / Math.max(1, results.length);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-800">{label}</span>
        <span className="text-xs text-neutral-500">
          avg {avgLatency.toFixed(0)}ms · {avgTokens.toFixed(0)} tokens
        </span>
      </div>
      {results.map((r, i) => (
        <div key={i} className="bg-white border border-neutral-200 rounded-md p-3">
          <div className="text-xs text-neutral-500 mb-1">{testCases[i]}</div>
          <div className="text-sm text-neutral-800">{r.text}</div>
        </div>
      ))}
    </div>
  );
}
