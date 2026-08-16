"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { generateStructuredOutput, type StructuredOutputResponse } from "../api";

const DEFAULT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" },
    role: { type: "string", enum: ["admin", "member", "guest"] },
    active: { type: "boolean" },
  },
  required: ["name", "age", "role", "active"],
};

const PIPELINE = ["Natural Language", "JSON Schema", "Validation", "Structured Output"];

export function StructuredOutputLab() {
  const [schemaText, setSchemaText] = useState(JSON.stringify(DEFAULT_SCHEMA, null, 2));
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [breakSchema, setBreakSchema] = useState(false);
  const [seed, setSeed] = useState(1);
  const [result, setResult] = useState<StructuredOutputResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    let schema: Record<string, unknown>;
    try {
      schema = JSON.parse(schemaText);
      setSchemaError(null);
    } catch {
      setSchemaError("Not valid JSON — fix the schema before generating.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await generateStructuredOutput(schema, breakSchema, seed);
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
            <span className="px-2 py-1 rounded-full border border-neutral-800 bg-neutral-900">{stage}</span>
            {i < PIPELINE.length - 1 && <span className="text-neutral-700">→</span>}
          </span>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="text-sm text-neutral-400">JSON Schema (editable)</div>
          <textarea
            value={schemaText}
            onChange={(e) => setSchemaText(e.target.value)}
            rows={14}
            spellCheck={false}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-100 font-mono"
          />
          {schemaError && <p className="text-xs text-red-400">{schemaError}</p>}

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-sm text-neutral-400">
              <input type="checkbox" checked={breakSchema} onChange={(e) => setBreakSchema(e.target.checked)} />
              deliberately break the output
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-200"
            >
              New sample
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium text-white"
            >
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">{error}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-sm text-neutral-400">Output</div>
          {result ? (
            <>
              <pre
                className={`text-xs rounded-md p-3 border overflow-x-auto ${
                  result.valid ? "border-neutral-800 bg-neutral-900 text-neutral-200" : "border-red-900 bg-red-950/30 text-red-200"
                }`}
              >
                {JSON.stringify(result.output, null, 2)}
              </pre>
              <div
                className={`text-sm rounded-md px-3 py-2 border ${
                  result.valid
                    ? "border-emerald-800 bg-emerald-950/30 text-emerald-400"
                    : "border-red-900 bg-red-950/30 text-red-400"
                }`}
              >
                {result.valid ? "✓ Valid against schema" : `✗ ${result.errors.length} validation error(s)`}
              </div>
              {result.errors.length > 0 && (
                <ul className="text-xs text-red-400 space-y-1 font-mono">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-500">Generate to see output here.</p>
          )}
        </div>
      </div>
      <p className="text-xs text-neutral-500 max-w-2xl">
        The generated values are fabricated from the schema&rsquo;s shape (mock provider — spec
        section 35), not extracted from real natural language. The point is the pipeline: a
        schema constrains the output shape, and a validator can catch when a response
        doesn&rsquo;t match it.
      </p>
    </div>
  );
}
