"use client";

import { useState } from "react";
import { MetricsWalkthrough } from "./MetricsWalkthrough";

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  return shared / Math.max(wordsA.size, wordsB.size);
}

export function MetricsLab({
  initialStep,
  onBackToPreviousChapter,
}: {
  initialStep?: number;
  onBackToPreviousChapter?: () => void;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [reference, setReference] = useState("Worn or tag-removed items only get a partial refund or store credit, not a full refund.");
  const [candidate, setCandidate] = useState("Worn items get a 70% refund, not a full refund.");

  const exact = candidate.trim().toLowerCase() === reference.trim().toLowerCase();
  const overlap = wordOverlap(candidate, reference);

  return (
    <div className="space-y-8">
      <MetricsWalkthrough
        onComplete={() => setWalkthroughComplete(true)}
        initialStep={initialStep}
        onBackToPreviousChapter={onBackToPreviousChapter}
      />

      {walkthroughComplete && (
        <div>
          <h3 className="text-sm font-medium text-neutral-800 mb-1">Explore it yourself</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Try your own reference and candidate answer.
          </p>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Reference answer</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 block mb-1">Candidate answer</label>
              <input
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-sm text-neutral-900"
              />
            </div>
            <div className="bg-white border border-neutral-200 rounded-md p-3 text-sm space-y-1.5">
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
