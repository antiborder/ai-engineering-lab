"use client";

import { useState } from "react";
import { ModelComparisonWalkthrough } from "./ModelComparisonWalkthrough";

interface Candidate {
  label: string;
  quality: number;
  latencyMs: number;
  cost: number;
}

const DEFAULT_CANDIDATES: Candidate[] = [
  { label: "Model A", quality: 34, latencyMs: 200, cost: 0.001 },
  { label: "Model B", quality: 89, latencyMs: 500, cost: 0.0025 },
];

export function ModelComparisonLab({
  initialStep,
  onAdvanceToNextChapter,
  onBackToPreviousChapter,
}: {
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
  onBackToPreviousChapter?: () => void;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(DEFAULT_CANDIDATES);

  const updateCandidate = (i: number, field: keyof Candidate, value: string) => {
    setCandidates((cs) =>
      cs.map((c, idx) =>
        idx === i ? { ...c, [field]: field === "label" ? value : Number(value) || 0 } : c
      )
    );
  };

  const addCandidate = () => {
    setCandidates((cs) => [...cs, { label: `Model ${String.fromCharCode(65 + cs.length)}`, quality: 80, latencyMs: 500, cost: 0.002 }]);
  };
  const removeCandidate = (i: number) => setCandidates((cs) => cs.filter((_, idx) => idx !== i));

  const bestQuality = candidates.length ? Math.max(...candidates.map((c) => c.quality)) : 0;
  const bestLatency = candidates.length ? Math.min(...candidates.map((c) => c.latencyMs)) : 0;
  const bestCost = candidates.length ? Math.min(...candidates.map((c) => c.cost)) : 0;

  return (
    <div className="space-y-8">
      <ModelComparisonWalkthrough
        onComplete={() => setWalkthroughComplete(true)}
        initialStep={initialStep}
        onAdvanceToNextChapter={onAdvanceToNextChapter}
        onBackToPreviousChapter={onBackToPreviousChapter}
      />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself</h3>
          <p className="text-base text-neutral-500 mb-4">
            Edit the numbers, or add your own system, and see which one wins on each axis.
          </p>

          <div className="space-y-3 max-w-lg">
            {candidates.map((c, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-md p-3 flex items-center gap-2 flex-wrap">
                <input
                  value={c.label}
                  onChange={(e) => updateCandidate(i, "label", e.target.value)}
                  className="flex-1 min-w-24 bg-white border border-neutral-200 rounded-md px-2 py-1 text-base text-neutral-900"
                />
                <label className="text-sm text-neutral-500 flex items-center gap-1">
                  Quality
                  <input
                    type="number"
                    value={c.quality}
                    onChange={(e) => updateCandidate(i, "quality", e.target.value)}
                    className="w-16 bg-white border border-neutral-200 rounded-md px-1.5 py-1 text-base text-neutral-900"
                  />
                </label>
                <label className="text-sm text-neutral-500 flex items-center gap-1">
                  Latency (ms)
                  <input
                    type="number"
                    value={c.latencyMs}
                    onChange={(e) => updateCandidate(i, "latencyMs", e.target.value)}
                    className="w-20 bg-white border border-neutral-200 rounded-md px-1.5 py-1 text-base text-neutral-900"
                  />
                </label>
                <label className="text-sm text-neutral-500 flex items-center gap-1">
                  Cost ($)
                  <input
                    type="number"
                    step="0.0001"
                    value={c.cost}
                    onChange={(e) => updateCandidate(i, "cost", e.target.value)}
                    className="w-20 bg-white border border-neutral-200 rounded-md px-1.5 py-1 text-base text-neutral-900"
                  />
                </label>
                <button onClick={() => removeCandidate(i)} className="text-neutral-400 hover:text-red-600 shrink-0" aria-label="Remove system">✕</button>
              </div>
            ))}
            <button
              onClick={addCandidate}
              className="px-3 py-1.5 rounded-md bg-white border border-neutral-200 hover:border-neutral-400 text-base text-neutral-700"
            >
              + Add a system
            </button>

            {candidates.length > 0 && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3 text-base space-y-1">
                <div>Best quality: <span className="font-medium text-cyan-800">{candidates.find((c) => c.quality === bestQuality)?.label}</span> ({bestQuality})</div>
                <div>Fastest: <span className="font-medium text-cyan-800">{candidates.find((c) => c.latencyMs === bestLatency)?.label}</span> ({bestLatency}ms)</div>
                <div>Cheapest: <span className="font-medium text-cyan-800">{candidates.find((c) => c.cost === bestCost)?.label}</span> (${bestCost.toFixed(4)})</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
