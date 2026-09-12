"use client";

import { useState } from "react";
import { LlmJudgeLab } from "./LlmJudgeLab";
import { ModelComparisonLab } from "./ModelComparisonLab";
import { RegressionTestingLab } from "./RegressionTestingLab";

const CHAPTERS = [
  { id: "llm-judge", label: "LLM-as-a-Judge" },
  { id: "model-comparison", label: "Model Comparison" },
  { id: "regression-testing", label: "Regression Testing" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** One Unit, three Chapters — same tab-switcher pattern as
 * EvaluationBasicsPlayground. These three Chapters continue Evaluation
 * Basics' single story (build a judge for the bug → find a model that
 * avoids it → verify the fix), so Next/Back inside each Chapter's
 * Walkthrough can also cross into the next/previous Chapter —
 * `pendingStep` carries the target Step index (-1 = that Chapter's last
 * Step) across the tab switch; each Walkthrough reads it once at mount via
 * its `initialStep` prop. Tabs still work for jumping directly to any
 * Chapter. LlmJudgeWalkthrough's own first-Step "Back" is a real page
 * link to /evaluation/basics (crossing the Unit boundary, not just a
 * Chapter one) — handled inside that component itself, not here. */
export function JudgingPlayground() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>("llm-judge");
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
      {activeChapter === "llm-judge" && (
        <LlmJudgeLab
          initialStep={pendingStep}
          onAdvanceToNextChapter={() => goToChapter("model-comparison", 0)}
        />
      )}
      {activeChapter === "model-comparison" && (
        <ModelComparisonLab
          initialStep={pendingStep}
          onAdvanceToNextChapter={() => goToChapter("regression-testing", 0)}
          onBackToPreviousChapter={() => goToChapter("llm-judge", -1)}
        />
      )}
      {activeChapter === "regression-testing" && (
        <RegressionTestingLab
          initialStep={pendingStep}
          onBackToPreviousChapter={() => goToChapter("model-comparison", -1)}
        />
      )}
    </div>
  );
}
