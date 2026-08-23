"use client";

import { useState } from "react";
import { RegressionLab } from "./RegressionLab";
import { ClassificationLab } from "./ClassificationLab";
import { ClusteringLab } from "./ClusteringLab";

const CHAPTERS = [
  { id: "regression", label: "Regression" },
  { id: "classification", label: "Classification" },
  { id: "clustering", label: "Clustering" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

export function ClassicalMlPlayground() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>("regression");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-neutral-200">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveChapter(c.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeChapter === c.id
                ? "border-cyan-600 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {activeChapter === "regression" && <RegressionLab onNavigateToChapter={setActiveChapter} />}
      {activeChapter === "classification" && (
        <ClassificationLab onNavigateToChapter={setActiveChapter} />
      )}
      {activeChapter === "clustering" && <ClusteringLab />}
    </div>
  );
}
