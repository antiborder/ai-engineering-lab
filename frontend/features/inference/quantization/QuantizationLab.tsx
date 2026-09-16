"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { QuantizationWalkthrough } from "./QuantizationWalkthrough";

const VRAM_TOTAL_GB = 80;
const BYTES_PER_PARAM = { fp16: 2, int8: 1, int4: 0.5 } as const;
type Precision = keyof typeof BYTES_PER_PARAM;

const TASK_QUALITY_RISK: Record<Precision, Record<"casual" | "precise", string>> = {
  fp16: { casual: "negligible", precise: "negligible" },
  int8: { casual: "negligible", precise: "low" },
  int4: { casual: "low", precise: "high" },
};

export function QuantizationLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [paramsB, setParamsB] = useState(7);
  const [precision, setPrecision] = useState<Precision>("fp16");
  const [taskType, setTaskType] = useState<"casual" | "precise">("casual");

  const weightsGb = paramsB * BYTES_PER_PARAM[precision];
  const kvCacheGb = VRAM_TOTAL_GB - weightsGb;
  const risk = TASK_QUALITY_RISK[precision][taskType];

  return (
    <div className="space-y-8">
      <QuantizationWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: memory vs. quality risk</h3>
          <p className="text-base text-neutral-500 mb-4">
            Same {VRAM_TOTAL_GB} GB GPU from the walkthrough. Pick a model size, a precision, and
            a task type, and see how much VRAM is left for the KV cache alongside the quality
            risk that precision carries for that kind of task.
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

            <div className="flex gap-2">
              {(["fp16", "int8", "int4"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPrecision(p)}
                  className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                    precision === p
                      ? "bg-cyan-600 border-cyan-600 text-white"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {(["casual", "precise"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTaskType(t)}
                  className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                    taskType === t
                      ? "bg-cyan-600 border-cyan-600 text-white"
                      : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                  }`}
                >
                  {t === "casual" ? "Casual chat" : "Precise math / code"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label={`${precision.toUpperCase()} weights`} value={`${weightsGb} GB`} />
              <StatCard
                label="Free for KV cache"
                value={`${kvCacheGb} GB`}
                tone={kvCacheGb > VRAM_TOTAL_GB / 2 ? "good" : "default"}
              />
            </div>
            <StatCard
              label={`Quality risk — ${taskType === "casual" ? "casual chat" : "precise math / code"}`}
              value={risk}
              tone={risk === "high" ? "warn" : risk === "negligible" ? "good" : "default"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
