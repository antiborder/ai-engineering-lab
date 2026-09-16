"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { GpuWalkthrough } from "./GpuWalkthrough";

const VRAM_TOTAL_GB = 80;
const BYTES_PER_PARAM = 2; // FP16 — 2 bytes per parameter, same rule of thumb the chapter used
const FIXED_KV_NEED_GB = 48.8; // 100 conversations × 1,000 words × 0.5 MB/word, from the chapter's own example

export function GpuLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [paramsB, setParamsB] = useState(7);

  const weightsGb = BYTES_PER_PARAM * paramsB;
  const remainingGb = VRAM_TOTAL_GB - weightsGb;
  const fits = remainingGb >= FIXED_KV_NEED_GB;

  return (
    <div className="space-y-8">
      <GpuWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: does a bigger model still leave room?</h3>
          <p className="text-base text-neutral-500 mb-4">
            Same 80 GB GPU, same fixed 100 conversations from the walkthrough (about {FIXED_KV_NEED_GB} GB
            of KV cache). Drag the model&rsquo;s own size and see how much room that leaves.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Model size</span>
                <span className="text-neutral-800 tabular-nums">{paramsB}B parameters</span>
              </div>
              <input
                type="range"
                min={1}
                max={70}
                step={1}
                value={paramsB}
                onChange={(e) => setParamsB(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Model weights" value={`${weightsGb.toFixed(0)} GB`} />
              <StatCard
                label="Left for KV cache"
                value={`${remainingGb.toFixed(0)} GB`}
                tone={fits ? "good" : "warn"}
              />
            </div>
            <StatCard
              label={`Needs ~${FIXED_KV_NEED_GB} GB for those 100 conversations`}
              value={fits ? "fits" : "doesn't fit — model alone leaves too little room"}
              tone={fits ? "good" : "warn"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
