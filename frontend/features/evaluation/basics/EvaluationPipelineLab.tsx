"use client";

import { useState } from "react";
import { EvaluationPipelineWalkthrough } from "./EvaluationPipelineWalkthrough";

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  return shared / Math.max(wordsA.size, wordsB.size);
}

export function EvaluationPipelineLab({
  initialStep,
  onAdvanceToNextChapter,
  onBackToPreviousChapter,
}: {
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
  onBackToPreviousChapter?: () => void;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);

  const [expected, setExpected] = useState("No — worn items only qualify for a partial refund or store credit.");
  const [actual, setActual] = useState("Yes, as long as it's within 30 days, you'll get a full refund.");
  const exact = actual.trim().toLowerCase() === expected.trim().toLowerCase();
  const overlap = wordOverlap(actual, expected);

  return (
    <div className="space-y-8">
      <EvaluationPipelineWalkthrough
        onComplete={() => setWalkthroughComplete(true)}
        initialStep={initialStep}
        onAdvanceToNextChapter={onAdvanceToNextChapter}
        onBackToPreviousChapter={onBackToPreviousChapter}
      />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: run the pipeline</h3>
          <p className="text-base text-neutral-500 mb-4">
            Edit the expected answer and the actual output — everything below recomputes live.
          </p>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="text-sm text-neutral-500 block mb-1">Expected answer</label>
              <input
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-500 block mb-1">Actual output</label>
              <input
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
              />
            </div>

            <div className="bg-white border border-neutral-200 rounded-md p-3 text-base space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Exact match</span>
                <span className={exact ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>{exact ? "✓ true" : "✗ false"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Word overlap</span>
                <span className="text-cyan-700 font-medium">{Math.round(overlap * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
