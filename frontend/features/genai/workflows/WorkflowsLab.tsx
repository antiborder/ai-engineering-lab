"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { ragQuery, runAgent, type AgentRunResponse, type RagQueryResponse } from "../api";

const EXAMPLES = ["what is 18% of 640", "how does sourdough bread rise?", "what's the weather in Oslo"];

export function WorkflowsLab() {
  const [input, setInput] = useState(EXAMPLES[0]);
  const [deterministic, setDeterministic] = useState<RagQueryResponse | null>(null);
  const [agentic, setAgentic] = useState<AgentRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const [det, agent] = await Promise.all([
        ragQuery({
          query: input,
          chunk_size: 60,
          overlap: 15,
          top_k: 2,
          similarity_threshold: 0,
          use_reranking: false,
          model: "mock-small",
        }),
        runAgent(input, "mock-small"),
      ]);
      setDeterministic(det);
      setAgentic(agent);
    } catch (err) {
      setError(err instanceof ApiError ? `${err.status}: ${err.message}` : "Could not reach the backend API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setInput(ex)}
            className="text-xs px-2 py-1 rounded-md border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400"
          >
            {ex}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900"
        />
        <button
          onClick={handleRun}
          disabled={loading || !input}
          className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium text-white"
        >
          {loading ? "Running…" : "Run both"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">{error}</p>
      )}

      {deterministic && agentic && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 py-1 rounded-full border border-neutral-200 bg-white text-neutral-600">Retrieve</span>
              <span className="text-neutral-400">→</span>
              <span className="px-2 py-1 rounded-full border border-neutral-200 bg-white text-neutral-600">Answer</span>
            </div>
            <p className="text-xs text-neutral-500">
              Deterministic workflow — always the same two steps, regardless of what the input
              actually needs.
            </p>
            <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm text-neutral-800">
              {deterministic.answer}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              {agentic.plan.length === 0 ? (
                <span className="px-2 py-1 rounded-full border border-neutral-200 bg-white text-neutral-600">
                  Answer directly
                </span>
              ) : (
                agentic.plan.map((step, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="px-2 py-1 rounded-full border border-cyan-200 bg-cyan-50 text-cyan-700 font-mono">
                      {step}
                    </span>
                    {i < agentic.plan.length - 1 && <span className="text-neutral-400">→</span>}
                  </span>
                ))
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Agentic workflow — the plan is decided from the input itself, so it only does the
              steps this particular input actually needs.
            </p>
            <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm text-neutral-800">
              {agentic.final_answer}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-500 max-w-2xl">
        Try the math example: the deterministic workflow searches documents anyway (there&rsquo;s
        nothing about percentages in the corpus), while the agent recognizes it needs the
        calculator instead. That gap is the whole argument for agents — but notice the
        deterministic workflow is simpler, cheaper, and fully predictable, which matters when the
        task is always the same shape.
      </p>
    </div>
  );
}
