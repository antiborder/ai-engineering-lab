"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { SaveArtifactPanel } from "@/components/SaveArtifactPanel";
import { runAgent, type AgentRunResponse } from "../api";

const EXAMPLES = [
  "what is the weather in Tokyo and what is 12% of 850",
  "search for cat behavior",
  "just say hello",
];

export function AgentLab() {
  const [goal, setGoal] = useState(EXAMPLES[0]);
  const [model] = useState("mock-small");
  const [result, setResult] = useState<AgentRunResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await runAgent(goal, model));
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
            onClick={() => setGoal(ex)}
            className="text-xs px-2 py-1 rounded-md border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="flex-1 bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-900"
          placeholder="Describe a goal…"
        />
        <button
          onClick={handleRun}
          disabled={loading || !goal}
          className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium text-white"
        >
          {loading ? "Running…" : "Run agent"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">{error}</p>
      )}

      {result && (
        <div className="space-y-4">
          <div>
            <div className="text-sm text-neutral-600 mb-2">Plan</div>
            {result.plan.length > 0 ? (
              <ol className="space-y-1">
                {result.plan.map((step, i) => (
                  <li key={i} className="text-sm font-mono text-neutral-400">
                    {i + 1}. {step}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-neutral-500">No tools needed — answering directly.</p>
            )}
          </div>

          {result.steps.length > 0 && (
            <div>
              <div className="text-sm text-neutral-600 mb-2">Execution trace</div>
              <ol className="space-y-2">
                {result.steps.map((step) => (
                  <li key={step.step} className="bg-white border border-neutral-200 rounded-md p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-neutral-500">step {step.step}</span>
                      <span className="text-cyan-700 font-mono">{step.tool_name}</span>
                      {step.retried && (
                        <span className="text-[10px] uppercase tracking-wide text-amber-800 border border-amber-300 rounded px-1.5 py-0.5">
                          retried
                        </span>
                      )}
                      {step.failed && (
                        <span className="text-[10px] uppercase tracking-wide text-red-700 border border-red-300 rounded px-1.5 py-0.5">
                          failed
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-600">
                      observation: <span className="font-mono text-neutral-400">{step.observation}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <div className="text-sm text-neutral-600 mb-1">Final answer</div>
            <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm text-neutral-800">
              {result.final_answer}
            </div>
          </div>

          <SaveArtifactPanel type="agent" defaultName="My Agent" model={model} configuration={{ goal_template: goal }} />
        </div>
      )}
    </div>
  );
}
