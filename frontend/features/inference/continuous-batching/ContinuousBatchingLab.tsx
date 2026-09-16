"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { ContinuousBatchingWalkthrough } from "./ContinuousBatchingWalkthrough";

const FIXED_LENGTHS = [5, 20, 10, 5, 8, 12, 6, 15];

function simulateStatic(lengths: number[], slots: number): number {
  let total = 0;
  for (let i = 0; i < lengths.length; i += slots) {
    total += Math.max(...lengths.slice(i, i + slots));
  }
  return total;
}

function simulateContinuous(lengths: number[], slots: number): number {
  const slotFree = Array.from({ length: slots }, () => 0);
  const queue = [...lengths];
  for (let i = 0; i < slots && queue.length; i++) {
    slotFree[i] = queue.shift()!;
  }
  while (queue.length) {
    const minIdx = slotFree.indexOf(Math.min(...slotFree));
    slotFree[minIdx] += queue.shift()!;
  }
  return Math.max(...slotFree);
}

export function ContinuousBatchingLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [slots, setSlots] = useState(4);

  const staticSteps = simulateStatic(FIXED_LENGTHS, slots);
  const continuousSteps = simulateContinuous(FIXED_LENGTHS, slots);

  return (
    <div className="space-y-8">
      <ContinuousBatchingWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: does slot count change the win?</h3>
          <p className="text-base text-neutral-500 mb-4">
            Same 8 requests as the walkthrough (lengths 5, 20, 10, 5, 8, 12, 6, 15). Drag how many
            slots the GPU has room for, and compare static vs. continuous batching.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Slots available</span>
                <span className="text-neutral-800 tabular-nums">{slots}</span>
              </div>
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={slots}
                onChange={(e) => setSlots(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Static batching" value={`${staticSteps} steps`} tone="warn" />
              <StatCard label="Continuous batching" value={`${continuousSteps} steps`} tone="good" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
