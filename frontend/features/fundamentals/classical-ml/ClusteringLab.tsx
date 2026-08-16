"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { generateBlobsData, type Point2D } from "./data";
import { initCentroids, kmeansStep } from "./models";
import { ClusteringPlot } from "./ClusteringPlot";
import { LossChart } from "./LossChart";
import { Slider } from "./Slider";
import { StatCard } from "@/components/StatCard";

const TICK_MS = 400;

export function ClusteringLab() {
  const [seed, setSeed] = useState(1);
  const [trueK, setTrueK] = useState(3);
  const [k, setK] = useState(3);
  const [playing, setPlaying] = useState(true);

  const points = useMemo(() => generateBlobsData(seed, 120, trueK), [seed, trueK]);

  return (
    <div className="grid md:grid-cols-[340px_1fr] gap-6">
      <ClusteringTrainer key={`${k}-${seed}-${trueK}`} points={points} k={k} seed={seed} playing={playing}>
        {(stats) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Iteration" value={String(stats.iteration)} />
              <StatCard
                label={stats.converged ? "Converged (inertia)" : "Inertia"}
                value={stats.inertia.toFixed(1)}
                tone={stats.converged ? "good" : "default"}
              />
            </div>
            <LossChart series={[{ label: "inertia", color: "#22d3ee", values: stats.inertiaHistory }]} />

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Slider label="k (clusters to find)" value={k} min={1} max={6} step={1} onChange={setK} />
              <Slider label="True number of groups" value={trueK} min={1} max={6} step={1} onChange={setTrueK} />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white"
              >
                {playing ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => setSeed((s) => s + 1)}
                className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-200"
              >
                New dataset
              </button>
              {stats.converged && (
                <span className="text-xs text-emerald-400">converged — assignments stopped changing</span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              Try setting k below or above the true number of groups to see under- and
              over-clustering.
            </p>
          </div>
        )}
      </ClusteringTrainer>
    </div>
  );
}

interface TrainingStats {
  iteration: number;
  inertia: number;
  inertiaHistory: number[];
  converged: boolean;
}

function ClusteringTrainer({
  points,
  k,
  seed,
  playing,
  children,
}: {
  points: Point2D[];
  k: number;
  seed: number;
  playing: boolean;
  children: (stats: TrainingStats) => ReactNode;
}) {
  const initial = useMemo(() => initCentroids(points, k, seed + 100), [points, k, seed]);

  const [centroids, setCentroids] = useState<Point2D[]>(initial);
  const [assignments, setAssignments] = useState<number[]>([]);
  const [iteration, setIteration] = useState(0);
  const [inertia, setInertia] = useState(0);
  const [inertiaHistory, setInertiaHistory] = useState<number[]>([]);
  const [converged, setConverged] = useState(false);

  useEffect(() => {
    if (!playing || converged) return;
    const id = setTimeout(() => {
      const next = kmeansStep(centroids, points, iteration);
      const stable =
        assignments.length === next.assignments.length &&
        assignments.every((a, i) => a === next.assignments[i]);
      setCentroids(next.centroids);
      setAssignments(next.assignments);
      setIteration(next.iteration);
      setInertia(next.inertia);
      setInertiaHistory((h) => [...h, next.inertia]);
      if (stable && next.iteration > 1) setConverged(true);
    }, TICK_MS);
    return () => clearTimeout(id);
  }, [playing, converged, centroids, assignments, iteration, points]);

  return (
    <>
      <div className="space-y-4">
        <ClusteringPlot points={points} centroids={centroids} assignments={assignments} />
        <p className="text-xs text-neutral-500">X marks are centroids · colors show cluster assignment</p>
      </div>
      {children({ iteration, inertia, inertiaHistory, converged })}
    </>
  );
}
