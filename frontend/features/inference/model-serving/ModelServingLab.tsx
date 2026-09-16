"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { ModelServingWalkthrough } from "./ModelServingWalkthrough";

function averageWaitMs(capacity: number, arrivalRate: number): number | null {
  if (arrivalRate >= capacity) return null;
  return 1000 / (capacity - arrivalRate);
}

export function ModelServingLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [capacity, setCapacity] = useState(10);
  const [arrivalRate, setArrivalRate] = useState(5);

  const wait = averageWaitMs(capacity, arrivalRate);

  return (
    <div className="space-y-8">
      <ModelServingWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: capacity vs. arrival rate</h3>
          <p className="text-base text-neutral-500 mb-4">
            The walkthrough fixed the server&rsquo;s capacity. Here you can raise it too — the
            same effect more GPUs, a faster server, or (later Units in this module) a smarter
            serving engine can have.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Server capacity (μ)</span>
                <span className="text-neutral-800 tabular-nums">{capacity} req/s</span>
              </div>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Arrival rate (λ)</span>
                <span className="text-neutral-800 tabular-nums">{arrivalRate} req/s</span>
              </div>
              <input
                type="range"
                min={1}
                max={29}
                step={1}
                value={arrivalRate}
                onChange={(e) => setArrivalRate(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
            </label>

            <StatCard
              label={`λ = ${arrivalRate} req/s, μ = ${capacity} req/s`}
              value={wait === null ? "queue never stabilizes" : `${wait.toFixed(0)} ms average wait`}
              tone={wait === null ? "warn" : arrivalRate / capacity >= 0.8 ? "warn" : "good"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
