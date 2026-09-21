"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { Equation } from "@/components/Equation";
import { ProvisioningWalkthrough } from "./ProvisioningWalkthrough";

const CURRENT_ERROR_RATE_PCT = 8;

export function ProvisioningLab({ initialStep }: { initialStep?: number } = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [threshold, setThreshold] = useState(10);
  const fires = CURRENT_ERROR_RATE_PCT > threshold;

  return (
    <div className="space-y-8">
      <ProvisioningWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: tune the alert threshold</h3>
          <p className="text-base text-neutral-500 mb-4">
            The backend&rsquo;s error rate is still 8%. Pick any threshold and see whether the
            alert policy would fire.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base w-full">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Alert threshold (error rate)</span>
                <span className="text-neutral-800 tabular-nums">{threshold}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <Equation tex={"\\text{error rate} > \\text{threshold} \\;\\Rightarrow\\; \\text{alert fires}"} />

            <div className="grid grid-cols-2 gap-2">
              <StatCard label="Current error rate" value={`${CURRENT_ERROR_RATE_PCT}%`} />
              <StatCard label="Threshold (in the file)" value={`${threshold}%`} tone={fires ? "warn" : "default"} />
            </div>
            <StatCard
              label="google_monitoring_alert_policy"
              value={fires ? "Firing" : "Not firing"}
              tone={fires ? "warn" : "good"}
              note={fires ? `${CURRENT_ERROR_RATE_PCT}% exceeds the ${threshold}% threshold` : "Error rate is within the declared threshold"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
