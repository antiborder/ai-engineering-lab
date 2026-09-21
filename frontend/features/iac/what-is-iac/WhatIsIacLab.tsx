"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { WhatIsIacWalkthrough } from "./WhatIsIacWalkthrough";

const DECLARED_MEMORY = "512Mi";
const MEMORY_OPTIONS = ["256Mi", "512Mi", "1Gi", "2Gi", "4Gi"] as const;

export function WhatIsIacLab({ initialStep }: { initialStep?: number } = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [actualMemory, setActualMemory] = useState<string>(DECLARED_MEMORY);

  const hasDrift = actualMemory !== DECLARED_MEMORY;

  return (
    <div className="space-y-8">
      <WhatIsIacWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: check for drift</h3>
          <p className="text-base text-neutral-500 mb-4">
            The file still declares 512Mi. Pick any actual, running value and see whether it
            counts as drift.
          </p>

          <div className="space-y-3 max-w-lg">
            <div className="flex gap-2 flex-wrap">
              {MEMORY_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setActualMemory(m)}
                  className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                    actualMemory === m
                      ? "bg-cyan-600 border-cyan-600 text-white"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Declared" value={DECLARED_MEMORY} />
              <StatCard label="Actual" value={actualMemory} tone={hasDrift ? "warn" : "default"} />
              <StatCard label="Verdict" value={hasDrift ? "Drift" : "No drift"} tone={hasDrift ? "warn" : "good"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
