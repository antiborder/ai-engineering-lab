"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { PerformanceWalkthrough } from "./PerformanceWalkthrough";

export function PerformanceLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [requestsPerDay, setRequestsPerDay] = useState(5000);
  const [pricePerRequest, setPricePerRequest] = useState(0.002);
  const [gpuCostPerDay, setGpuCostPerDay] = useState(30);

  const hostedCostPerDay = requestsPerDay * pricePerRequest;
  const selfHostedCostPerDay = gpuCostPerDay;
  const breakevenRequestsPerDay = gpuCostPerDay / pricePerRequest;
  const cheaper = hostedCostPerDay < selfHostedCostPerDay ? "hosted" : "self-hosted";

  return (
    <div className="space-y-8">
      <PerformanceWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: where&rsquo;s the breakeven?</h3>
          <p className="text-base text-neutral-500 mb-4">
            Pick a daily request volume, a hosted API&rsquo;s price per request, and a fixed daily
            GPU cost. See which option is cheaper at that volume, and where the crossover sits.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Requests per day</span>
                <span className="text-neutral-800 tabular-nums">{requestsPerDay.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={requestsPerDay}
                onChange={(e) => setRequestsPerDay(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Hosted API price per request</span>
                <span className="text-neutral-800 tabular-nums">${pricePerRequest.toFixed(4)}</span>
              </div>
              <input
                type="range"
                min={0.0005}
                max={0.01}
                step={0.0005}
                value={pricePerRequest}
                onChange={(e) => setPricePerRequest(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Self-hosted GPU, fixed cost per day</span>
                <span className="text-neutral-800 tabular-nums">${gpuCostPerDay}</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={gpuCostPerDay}
                onChange={(e) => setGpuCostPerDay(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Hosted API, at this volume"
                value={`$${hostedCostPerDay.toFixed(2)}/day`}
                tone={cheaper === "hosted" ? "good" : "default"}
              />
              <StatCard
                label="Self-hosted, at this volume"
                value={`$${selfHostedCostPerDay.toFixed(2)}/day`}
                tone={cheaper === "self-hosted" ? "good" : "default"}
              />
            </div>
            <StatCard
              label="Breakeven volume"
              value={`${Math.round(breakevenRequestsPerDay).toLocaleString()} requests/day`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
