"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { VllmWalkthrough } from "./VllmWalkthrough";

const DRAFT_TOKENS = 4; // how many tokens the draft model proposes per round

// Expected tokens produced per full-model call, for a draft model whose
// proposals are each independently accepted with probability p — the
// standard speculative-decoding result (Leviathan et al. 2023 / Chen et
// al. 2023): E[tokens] = (1 - p^(k+1)) / (1 - p), capped at k+1 as p→1.
function expectedTokensPerCall(p: number, k: number): number {
  if (p >= 0.999) return k + 1;
  return (1 - Math.pow(p, k + 1)) / (1 - p);
}

export function VllmLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [acceptProb, setAcceptProb] = useState(0.7);

  const expected = expectedTokensPerCall(acceptProb, DRAFT_TOKENS);

  return (
    <div className="space-y-8">
      <VllmWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: how much does speculative decoding actually buy you?</h3>
          <p className="text-base text-neutral-500 mb-4">
            The draft model proposes {DRAFT_TOKENS} tokens per round. Drag how often the large
            model actually agrees with each guess, and watch the expected speedup.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Draft model accept probability (per token)</span>
                <span className="text-neutral-800 tabular-nums">{(acceptProb * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.98}
                step={0.01}
                value={acceptProb}
                onChange={(e) => setAcceptProb(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <StatCard
              label={`~${expected.toFixed(2)} tokens per full-model call`}
              value={`${expected.toFixed(2)}× speedup vs. one token per call`}
              tone={expected >= 2 ? "good" : "default"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
