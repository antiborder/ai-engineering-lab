"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { TerraformWalkthrough } from "./TerraformWalkthrough";

const MEMORY_OPTIONS = ["256Mi", "512Mi", "1Gi", "2Gi", "4Gi"] as const;
const APPLIED_MEMORY = "512Mi";

export function TerraformLab({ initialStep }: { initialStep?: number } = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [desiredMemory, setDesiredMemory] = useState<string>(APPLIED_MEMORY);

  const needsChange = desiredMemory !== APPLIED_MEMORY;

  return (
    <div className="space-y-8">
      <TerraformWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: plan a memory change</h3>
          <p className="text-base text-neutral-500 mb-4">
            The live service is currently applied at 512Mi. Pick any desired value and see what a
            plan against it would show.
          </p>

          <div className="space-y-3 max-w-lg">
            <div className="flex gap-2 flex-wrap">
              {MEMORY_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setDesiredMemory(m)}
                  className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                    desiredMemory === m
                      ? "bg-cyan-600 border-cyan-600 text-white"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Currently applied" value={APPLIED_MEMORY} />
              <StatCard label="Desired (in the file)" value={desiredMemory} tone={needsChange ? "warn" : "default"} />
            </div>
            <StatCard
              label="terraform plan"
              value={needsChange ? "1 to change" : "No changes"}
              tone={needsChange ? "warn" : "good"}
              note={needsChange ? `~1 to update: memory ${APPLIED_MEMORY} → ${desiredMemory}` : "Infrastructure matches the file"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
