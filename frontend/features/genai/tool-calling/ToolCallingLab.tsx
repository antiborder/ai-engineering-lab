"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { callWithTools, type ToolCallResponse } from "../api";

const PIPELINE = ["User", "LLM", "Tool Selection", "Tool Execution", "Tool Result", "LLM", "Answer"];
const EXAMPLES = ["what is 15% of 240", "what's the weather in Berlin", "tell me about mount everest", "hello, how are you?"];

export function ToolCallingLab() {
  const [message, setMessage] = useState(EXAMPLES[0]);
  const [model] = useState("mock-small");
  const [result, setResult] = useState<ToolCallResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await callWithTools(message, model));
    } catch (err) {
      setError(err instanceof ApiError ? `${err.status}: ${err.message}` : "Could not reach the backend API.");
    } finally {
      setLoading(false);
    }
  };

  const usedTool = result?.tool_name != null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {PIPELINE.map((stage, i) => {
          const isToolStage = i >= 2 && i <= 4;
          const dim = result !== null && isToolStage && !usedTool;
          return (
            <span key={`${stage}-${i}`} className="flex items-center gap-1.5">
              <span
                className={`px-2 py-1 rounded-full border ${
                  dim ? "border-neutral-900 bg-neutral-950 text-neutral-700" : "border-neutral-800 bg-neutral-900 text-neutral-500"
                }`}
              >
                {stage}
              </span>
              {i < PIPELINE.length - 1 && <span className="text-neutral-700">→</span>}
            </span>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setMessage(ex)}
            className="text-xs px-2 py-1 rounded-md border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600"
          >
            {ex}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-sm text-neutral-100"
        />
        <button
          onClick={handleSend}
          disabled={loading || !message}
          className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium text-white"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{error}</p>
      )}

      {result && (
        <div className="space-y-3">
          {usedTool ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-3 space-y-1.5 text-sm">
              <div className="text-neutral-400">
                Tool selected: <span className="text-cyan-400 font-mono">{result.tool_name}</span>
              </div>
              <div className="text-neutral-400">
                Arguments: <span className="font-mono text-neutral-300">{JSON.stringify(result.tool_args)}</span>
              </div>
              <div className="text-neutral-400">
                Result: <span className="font-mono text-neutral-300">{result.tool_result}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No tool was needed for this message.</p>
          )}
          <div>
            <div className="text-sm text-neutral-400 mb-1">Answer</div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-md p-3 text-sm text-neutral-200">
              {result.answer}
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-neutral-500 max-w-2xl">
        Tool selection here is rule-based (mock provider — spec section 35), standing in for
        what a real model&rsquo;s function-calling would decide: try a math expression, a
        &ldquo;weather in &lt;city&gt;&rdquo; phrase, or a question, and notice which tool gets
        picked.
      </p>
    </div>
  );
}
