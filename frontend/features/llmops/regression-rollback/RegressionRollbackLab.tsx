"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { RegressionRollbackWalkthrough } from "./RegressionRollbackWalkthrough";

// v2's 82 live score is the walkthrough's own established baseline.
const BASELINE_SCORE = 82;

export function RegressionRollbackLab({ initialStep }: { initialStep?: number } = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [candidateScore, setCandidateScore] = useState(58);
  const [threshold, setThreshold] = useState(82);

  const drop = BASELINE_SCORE - candidateScore;
  const isRegression = candidateScore < threshold;

  return (
    <div className="space-y-8">
      <RegressionRollbackWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: pick a live score and a threshold</h3>
          <p className="text-base text-neutral-500 mb-4">
            v2&rsquo;s 82/100 stays the baseline. Try any live score for a new version, at any
            threshold, and see whether it counts as a regression.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base w-full">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>New version&rsquo;s live score</span>
                <span className="text-neutral-800 tabular-nums">{candidateScore}/100</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={candidateScore}
                onChange={(e) => setCandidateScore(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <label className="block text-base w-full">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Regression threshold</span>
                <span className="text-neutral-800 tabular-nums">{threshold}/100</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <StatCard label="v2 baseline" value={`${BASELINE_SCORE}/100`} />
              <StatCard label="Drop from baseline" value={`${drop >= 0 ? drop : 0} points`} tone={drop > 10 ? "warn" : "default"} />
              <StatCard
                label="Verdict"
                value={isRegression ? "Regression" : "OK"}
                tone={isRegression ? "warn" : "good"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
