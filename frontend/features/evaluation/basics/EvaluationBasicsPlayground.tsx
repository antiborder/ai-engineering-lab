"use client";

import { useState } from "react";
import { DatasetLab } from "./DatasetLab";
import { EvaluationPipelineLab } from "./EvaluationPipelineLab";
import { MetricsLab } from "./MetricsLab";

const CHAPTERS = [
  { id: "dataset", label: "Dataset" },
  { id: "evaluation-pipeline", label: "The Evaluation Pipeline" },
  { id: "metrics", label: "Metrics" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** One Unit, three Chapters — same tab-switcher pattern as
 * ToolCallingAgentsPlayground. Split back out of what was briefly one
 * merged "Evaluation Pipeline" Chapter, per the user's explicit request, so
 * the three Chapters tell one continuous story across tabs (a wrong answer
 * that went live → the dataset that would catch it → the pipeline that
 * runs it → the metric that actually flags it). Next/Back inside each
 * Chapter's Walkthrough can also cross into the next/previous Chapter —
 * `pendingStep` carries the target Step index (-1 = that Chapter's last
 * Step) across the tab switch; each Walkthrough reads it once at mount via
 * its `initialStep` prop. Tabs still work for jumping directly to any
 * Chapter. */
export function EvaluationBasicsPlayground() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>("dataset");
  const [pendingStep, setPendingStep] = useState<number | undefined>(undefined);

  const goToChapter = (id: ChapterId, stepIndex: number) => {
    setPendingStep(stepIndex);
    setActiveChapter(id);
  };

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-neutral-200 flex-wrap">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setPendingStep(undefined);
              setActiveChapter(c.id);
            }}
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
      {activeChapter === "dataset" && (
        <DatasetLab
          initialStep={pendingStep}
          onAdvanceToNextChapter={() => goToChapter("evaluation-pipeline", 0)}
        />
      )}
      {activeChapter === "evaluation-pipeline" && (
        <EvaluationPipelineLab
          initialStep={pendingStep}
          onAdvanceToNextChapter={() => goToChapter("metrics", 0)}
          onBackToPreviousChapter={() => goToChapter("dataset", -1)}
        />
      )}
      {activeChapter === "metrics" && (
        <MetricsLab
          initialStep={pendingStep}
          onBackToPreviousChapter={() => goToChapter("evaluation-pipeline", -1)}
        />
      )}
    </div>
  );
}
