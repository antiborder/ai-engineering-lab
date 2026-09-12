"use client";

import { useState } from "react";
import { DatasetWalkthrough } from "./DatasetWalkthrough";

interface TestCase {
  question: string;
  expected: string;
  reference: string;
}

export function DatasetLab({
  initialStep,
  onAdvanceToNextChapter,
}: {
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);

  const [cases, setCases] = useState<TestCase[]>([]);
  const [draft, setDraft] = useState<TestCase>({ question: "", expected: "", reference: "" });
  const [showExport, setShowExport] = useState(false);
  const addCase = () => {
    if (!draft.question.trim() || !draft.expected.trim()) return;
    setCases((c) => [...c, draft]);
    setDraft({ question: "", expected: "", reference: "" });
  };
  const removeCase = (i: number) => setCases((c) => c.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-8">
      <DatasetWalkthrough
        onComplete={() => setWalkthroughComplete(true)}
        initialStep={initialStep}
        onAdvanceToNextChapter={onAdvanceToNextChapter}
      />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: build a dataset</h3>
          <p className="text-base text-neutral-500 mb-4">
            Build a small dataset of your own — every field from the walkthrough, no case limit.
          </p>

          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 rounded-md p-3 space-y-2 max-w-lg">
              <input
                value={draft.question}
                onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
                placeholder="Question"
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
              />
              <input
                value={draft.expected}
                onChange={(e) => setDraft((d) => ({ ...d, expected: e.target.value }))}
                placeholder="Expected answer"
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
              />
              <input
                value={draft.reference}
                onChange={(e) => setDraft((d) => ({ ...d, reference: e.target.value }))}
                placeholder="Reference (optional)"
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
              />
              <button
                onClick={addCase}
                disabled={!draft.question.trim() || !draft.expected.trim()}
                className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-base font-medium text-white"
              >
                Add test case
              </button>
            </div>

            {cases.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-base text-neutral-600">{cases.length} test case{cases.length === 1 ? "" : "s"}</div>
                  <button
                    onClick={() => setShowExport((s) => !s)}
                    className="text-sm text-cyan-700 hover:underline"
                  >
                    {showExport ? "Hide export" : "Export as JSON"}
                  </button>
                </div>
                <ol className="space-y-1.5">
                  {cases.map((c, i) => (
                    <li key={i} className="bg-white border border-neutral-200 rounded-md p-3 text-base flex items-start justify-between gap-3">
                      <div>
                        <div className="text-neutral-800">{c.question}</div>
                        <div className="text-cyan-700 mt-0.5">→ {c.expected}</div>
                        {c.reference && <div className="text-purple-700 mt-0.5 text-sm">ref: {c.reference}</div>}
                      </div>
                      <button onClick={() => removeCase(i)} className="text-neutral-400 hover:text-red-600 shrink-0" aria-label="Remove test case">✕</button>
                    </li>
                  ))}
                </ol>
                {showExport && (
                  <pre className="bg-neutral-900 text-neutral-100 rounded-md p-3 text-sm overflow-x-auto">
                    {JSON.stringify(cases, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
