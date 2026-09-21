"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { ExperimentTrackingWalkthrough } from "./ExperimentTrackingWalkthrough";

interface Run {
  label: string;
  quality: number;
  latencyMs: number;
  cost: number;
}
const RUNS: Run[] = [
  { label: "v1", quality: 88, latencyMs: 900, cost: 0.004 },
  { label: "v2", quality: 84, latencyMs: 650, cost: 0.002 },
  { label: "v3", quality: 80, latencyMs: 300, cost: 0.0009 },
];

function normalizedScore(run: Run, weights: { quality: number; latency: number; cost: number }): number {
  const maxLatency = Math.max(...RUNS.map((r) => r.latencyMs));
  const maxCost = Math.max(...RUNS.map((r) => r.cost));
  const qualityScore = run.quality / 100;
  const latencyScore = 1 - run.latencyMs / maxLatency;
  const costScore = 1 - run.cost / maxCost;
  const total = weights.quality + weights.latency + weights.cost;
  if (total === 0) return 0;
  return (qualityScore * weights.quality + latencyScore * weights.latency + costScore * weights.cost) / total;
}

export function ExperimentTrackingLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [qualityWeight, setQualityWeight] = useState(50);
  const [latencyWeight, setLatencyWeight] = useState(25);
  const [costWeight, setCostWeight] = useState(25);

  const weights = { quality: qualityWeight, latency: latencyWeight, cost: costWeight };
  const scored = RUNS.map((r) => ({ ...r, score: normalizedScore(r, weights) }));
  const winner = scored.reduce((best, r) => (r.score > best.score ? r : best), scored[0]);

  return (
    <div className="space-y-8">
      <ExperimentTrackingWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: which version wins depends on priority</h3>
          <p className="text-base text-neutral-500 mb-4">
            Same three versions of My RAG from the walkthrough. Set how much each priority matters
            to you, and see which version comes out ahead.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>How much quality matters</span>
                <span className="text-neutral-800 tabular-nums">{qualityWeight}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={qualityWeight}
                onChange={(e) => setQualityWeight(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>How much latency matters</span>
                <span className="text-neutral-800 tabular-nums">{latencyWeight}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={latencyWeight}
                onChange={(e) => setLatencyWeight(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>How much cost matters</span>
                <span className="text-neutral-800 tabular-nums">{costWeight}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={costWeight}
                onChange={(e) => setCostWeight(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <div className="grid grid-cols-3 gap-3">
              {scored.map((r) => (
                <StatCard
                  key={r.label}
                  label={`${r.label} — ${r.quality}/100, ${r.latencyMs}ms, $${r.cost.toFixed(4)}`}
                  value={r.label === winner.label ? "Winner" : `${Math.round(r.score * 100)}`}
                  tone={r.label === winner.label ? "good" : "default"}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
