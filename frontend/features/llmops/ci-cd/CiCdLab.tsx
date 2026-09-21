"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { ContainersWalkthrough } from "./ContainersWalkthrough";
import { PipelineWalkthrough } from "./PipelineWalkthrough";

const VERSIONS = [
  { label: "v1", quality: 88 },
  { label: "v2", quality: 84 },
  { label: "v3", quality: 80 },
] as const;
type VersionLabel = (typeof VERSIONS)[number]["label"];
const ENVIRONMENTS = ["Development", "Staging", "Production"] as const;

const CHAPTERS = [
  { id: "containers", label: "Containers" },
  { id: "pipeline", label: "Pipeline & Deployment" },
] as const;
export type CiCdChapterId = (typeof CHAPTERS)[number]["id"];

export function CiCdLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [activeChapter, setActiveChapter] = useState<CiCdChapterId>("containers");
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [threshold, setThreshold] = useState(82);
  const [selectedVersion, setSelectedVersion] = useState<VersionLabel>("v2");
  const [promotedTo, setPromotedTo] = useState(0); // index into ENVIRONMENTS, -1 = not deployed

  const chosen = VERSIONS.find((v) => v.label === selectedVersion)!;
  const passes = chosen.quality >= threshold;

  const promote = () => setPromotedTo((i) => Math.min(ENVIRONMENTS.length - 1, i + 1));
  const resetPromotion = () => setPromotedTo(0);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap gap-1 mb-4 border-b border-neutral-200">
          {CHAPTERS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChapter(c.id)}
              className={`px-4 py-2 text-base font-medium border-b-2 -mb-px transition-colors ${
                activeChapter === c.id
                  ? "border-cyan-600 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-400"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {activeChapter === "containers" && <ContainersWalkthrough onNavigateToChapter={setActiveChapter} />}
        {activeChapter === "pipeline" && (
          <PipelineWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />
        )}
      </div>

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: gate a version, then promote it</h3>
          <p className="text-base text-neutral-500 mb-4">
            Pick a version and a threshold. If it passes, promote it one environment at a time and
            watch where it currently lives.
          </p>

          <div className="space-y-3 max-w-lg">
            <div className="flex gap-2">
              {VERSIONS.map((v) => (
                <button
                  key={v.label}
                  onClick={() => {
                    setSelectedVersion(v.label);
                    resetPromotion();
                  }}
                  className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                    selectedVersion === v.label
                      ? "bg-cyan-600 border-cyan-600 text-white"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {v.label} ({v.quality}/100)
                </button>
              ))}
            </div>

            <label className="block text-base">
              <div className="flex justify-between text-neutral-600 mb-1">
                <span>Threshold</span>
                <span className="text-neutral-800 tabular-nums">{threshold}/100</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={threshold}
                onChange={(e) => {
                  setThreshold(Number(e.target.value));
                  resetPromotion();
                }}
                className="w-full accent-cyan-600"
              />
            </label>

            <StatCard
              label={`${selectedVersion}: ${chosen.quality}/100 vs. threshold ${threshold}`}
              value={passes ? "Pass — ready to promote" : "Fail — stops here"}
              tone={passes ? "good" : "warn"}
            />

            {passes && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-center text-sm flex-wrap">
                  {ENVIRONMENTS.map((env, i) => (
                    <span key={env} className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md border px-2.5 py-1.5 ${
                          i === promotedTo
                            ? "border-cyan-300 bg-cyan-50 text-cyan-800 font-medium"
                            : i < promotedTo
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-neutral-200 bg-white text-neutral-500"
                        }`}
                      >
                        {env}
                      </span>
                      {i < ENVIRONMENTS.length - 1 && <span className="text-neutral-400">→</span>}
                    </span>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={promote}
                    disabled={promotedTo === ENVIRONMENTS.length - 1}
                    className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed text-base font-medium text-white"
                  >
                    {promotedTo === ENVIRONMENTS.length - 1 ? "In Production" : `Promote to ${ENVIRONMENTS[promotedTo + 1]}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
