"use client";

import { useState } from "react";
import { RegressionLab } from "./RegressionLab";
import { ClassificationLab } from "./ClassificationLab";
import { ClusteringLab } from "./ClusteringLab";

const TABS = [
  { id: "regression", label: "Regression" },
  { id: "classification", label: "Classification" },
  { id: "clustering", label: "Clustering" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ClassicalMlPlayground() {
  const [tab, setTab] = useState<TabId>("regression");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-cyan-400 text-white"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "regression" && <RegressionLab />}
      {tab === "classification" && <ClassificationLab />}
      {tab === "clustering" && <ClusteringLab />}
    </div>
  );
}
