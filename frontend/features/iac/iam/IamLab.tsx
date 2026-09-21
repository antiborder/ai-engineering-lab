"use client";

import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { IamWalkthrough } from "./IamWalkthrough";

const RESOURCES = ["Firestore", "Cloud Storage", "Artifact Registry", "Compute Engine", "BigQuery", "Pub/Sub"] as const;
const SCOPED_ACCESS: readonly string[] = ["Firestore", "Cloud Storage", "Artifact Registry"];

export function IamLab({ initialStep }: { initialStep?: number } = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [scoped, setScoped] = useState(true);

  return (
    <div className="space-y-8">
      <IamWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: compare the blast radius</h3>
          <p className="text-base text-neutral-500 mb-4">
            Toggle the backend&rsquo;s identity and see which of this app&rsquo;s six real
            services stay reachable.
          </p>

          <div className="space-y-3 max-w-lg">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setScoped(false)}
                className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                  !scoped ? "bg-red-600 border-red-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                Default service account (Editor)
              </button>
              <button
                onClick={() => setScoped(true)}
                className={`px-3 py-1.5 rounded-md text-base font-medium border ${
                  scoped ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                Scoped service account (3 roles)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RESOURCES.map((r) => {
                const reachable = !scoped || SCOPED_ACCESS.includes(r);
                return (
                  <StatCard
                    key={r}
                    label={r}
                    value={reachable ? "Reachable" : "Not reachable"}
                    tone={reachable ? (scoped ? "good" : "warn") : "good"}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
