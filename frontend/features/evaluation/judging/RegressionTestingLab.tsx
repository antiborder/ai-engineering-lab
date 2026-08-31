"use client";

import { useState } from "react";
import { RegressionTestingWalkthrough } from "./RegressionTestingWalkthrough";

interface VersionStat {
  quality: number;
  latencyMs: number;
  cost: number;
}

const DEFAULT_V1: VersionStat = { quality: 88, latencyMs: 900, cost: 0.004 };
const DEFAULT_V2: VersionStat = { quality: 84, latencyMs: 650, cost: 0.002 };

function Delta({ from, to, betterIsLower }: { from: number; to: number; betterIsLower: boolean }) {
  const diff = to - from;
  const better = betterIsLower ? diff < 0 : diff > 0;
  const worse = betterIsLower ? diff > 0 : diff < 0;
  if (diff === 0) return <span className="text-neutral-400">no change</span>;
  return (
    <span className={better ? "text-emerald-700" : worse ? "text-red-700" : "text-neutral-600"}>
      {diff > 0 ? "+" : ""}
      {diff}
      {better ? " ↑" : " ↓"}
    </span>
  );
}

export function RegressionTestingLab({
  initialStep,
  onBackToPreviousChapter,
}: {
  initialStep?: number;
  onBackToPreviousChapter?: () => void;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [v1, setV1] = useState<VersionStat>(DEFAULT_V1);
  const [v2, setV2] = useState<VersionStat>(DEFAULT_V2);

  const field = (
    version: VersionStat,
    setVersion: (v: VersionStat) => void,
    key: keyof VersionStat,
    label: string,
    step: string
  ) => (
    <label className="text-xs text-neutral-500 flex items-center gap-1">
      {label}
      <input
        type="number"
        step={step}
        value={version[key]}
        onChange={(e) => setVersion({ ...version, [key]: Number(e.target.value) || 0 })}
        className="w-20 bg-white border border-neutral-200 rounded-md px-1.5 py-1 text-sm text-neutral-900"
      />
    </label>
  );

  return (
    <div className="space-y-8">
      <RegressionTestingWalkthrough
        onComplete={() => setWalkthroughComplete(true)}
        initialStep={initialStep}
        onBackToPreviousChapter={onBackToPreviousChapter}
      />

      {walkthroughComplete && (
        <div>
          <h3 className="text-sm font-medium text-neutral-800 mb-1">Explore it yourself</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Edit either version&rsquo;s numbers and watch the comparison recompute.
          </p>

          <div className="space-y-3 max-w-lg">
            <div className="bg-white border border-neutral-200 rounded-md p-3 space-y-2">
              <div className="text-sm font-medium text-neutral-700">v1</div>
              <div className="flex gap-3 flex-wrap">
                {field(v1, setV1, "quality", "Quality", "1")}
                {field(v1, setV1, "latencyMs", "Latency (ms)", "1")}
                {field(v1, setV1, "cost", "Cost ($)", "0.0001")}
              </div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-md p-3 space-y-2">
              <div className="text-sm font-medium text-neutral-700">v2</div>
              <div className="flex gap-3 flex-wrap">
                {field(v2, setV2, "quality", "Quality", "1")}
                {field(v2, setV2, "latencyMs", "Latency (ms)", "1")}
                {field(v2, setV2, "cost", "Cost ($)", "0.0001")}
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-md p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Quality</span>
                <Delta from={v1.quality} to={v2.quality} betterIsLower={false} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Latency</span>
                <Delta from={v1.latencyMs} to={v2.latencyMs} betterIsLower />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Cost</span>
                <Delta from={v1.cost} to={v2.cost} betterIsLower />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
