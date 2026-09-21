"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { MonitoringWalkthrough } from "./MonitoringWalkthrough";

const VERSIONS = [
  { label: "v1", quality: 88, latencyMs: 900, cost: 0.004 },
  { label: "v2", quality: 84, latencyMs: 650, cost: 0.002 },
  { label: "v3", quality: 80, latencyMs: 300, cost: 0.0009 },
] as const;
type VersionLabel = (typeof VERSIONS)[number]["label"];

// Illustrative scaling only, not a real model of production behavior:
// projects the walkthrough's own baseline (14,280 requests/day, 128
// errors, p95 2320ms at v2) onto whichever version and volume the user
// picks, so the three Try-It-Yourself Steps' separate lenses (traffic,
// trace, cost) can be explored together against one chosen setup.
const BASE_ERROR_RATE = 128 / 14280;

export function MonitoringLab({ initialStep }: { initialStep?: number } = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [version, setVersion] = useState<VersionLabel>("v2");
  const [monthlyRequests, setMonthlyRequests] = useState(428400);

  const chosen = VERSIONS.find((v) => v.label === version)!;
  const v2 = VERSIONS.find((v) => v.label === "v2")!;
  const estimatedMonthlyCost = chosen.cost * monthlyRequests;
  const projectedErrors = Math.round(monthlyRequests * BASE_ERROR_RATE);
  // p95 scales roughly with the version's own baseline latency relative
  // to v2's, applied to the walkthrough's observed v2 p95 (2320ms).
  const projectedP95 = Math.round(2320 * (chosen.latencyMs / v2.latencyMs));

  return (
    <div className="space-y-8">
      <MonitoringWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: pick a version and a volume</h3>
          <p className="text-base text-neutral-500 mb-4">
            The same three versions from Experiment Tracking, projected against the walkthrough&rsquo;s
            own traffic numbers — see how monitoring, observability, and cost all move together
            when you change what&rsquo;s actually running.
          </p>

          <div className="space-y-3 max-w-lg">
            <div className="flex gap-2">
              {VERSIONS.map((v) => (
                <button
                  key={v.label}
                  onClick={() => setVersion(v.label)}
                  className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                    version === v.label
                      ? "bg-cyan-600 border-cyan-600 text-white"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {v.label} ({v.quality}/100, ${v.cost.toFixed(4)}/req)
                </button>
              ))}
            </div>

            <label className="block text-base w-full">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Requests / month</span>
                <span className="text-neutral-800 tabular-nums">{monthlyRequests.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={50000}
                max={2000000}
                step={10000}
                value={monthlyRequests}
                onChange={(e) => setMonthlyRequests(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Estimated monthly cost" value={`$${estimatedMonthlyCost.toFixed(2)}`} tone={version === "v3" ? "good" : "default"} />
              <StatCard label="Projected errors / month" value={projectedErrors.toLocaleString()} tone="warn" />
              <StatCard label="Projected p95 latency" value={`${projectedP95}ms`} tone={projectedP95 < 2320 ? "good" : "warn"} />
              <StatCard label="Quality (from Experiment Tracking)" value={`${chosen.quality}/100`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
