"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateMoonsData, type ClassificationPoint } from "./data";
import { LogisticRegressor } from "./models";
import { DecisionBoundaryCanvas } from "@/components/DecisionBoundaryCanvas";
import { LossChart } from "./LossChart";
import { Slider } from "./Slider";
import { StatCard } from "@/components/StatCard";

const MAX_HISTORY = 120;
const LR = 1.2;
const STEPS_PER_TICK = 4;
const TICK_MS = 60;
const DOMAIN = { xMin: -1.6, xMax: 2.4, yMin: -1.9, yMax: 1.4 };

export function ClassificationLab() {
  const [seed, setSeed] = useState(1);
  const [degree, setDegree] = useState(3);
  const [lambda, setLambda] = useState(0);
  const [noiseStd, setNoiseStd] = useState(0.15);
  const [trainRatio, setTrainRatio] = useState(0.4);
  const [playing, setPlaying] = useState(true);

  const points = useMemo(
    () => generateMoonsData(seed, 90, noiseStd, trainRatio),
    [seed, noiseStd, trainRatio]
  );

  return (
    <div className="grid md:grid-cols-[420px_1fr] gap-6">
      <ClassificationTrainer
        key={`${degree}-${lambda}-${seed}-${noiseStd}-${trainRatio}`}
        points={points}
        degree={degree}
        lambda={lambda}
        playing={playing}
      >
        {(stats) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Train accuracy" value={`${(stats.trainAcc * 100).toFixed(1)}%`} />
              <StatCard label="Test accuracy" value={`${(stats.testAcc * 100).toFixed(1)}%`} tone={stats.overfitting ? "warn" : "default"} />
            </div>
            {stats.overfitting && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-900 rounded-md px-3 py-2">
                The decision boundary is fitting noise in the training set — test loss is much
                higher than train loss. Try a lower polynomial degree or more L2 regularization.
              </p>
            )}
            <LossChart
              series={[
                { label: "train", color: "#a78bfa", values: stats.history.train },
                { label: "test", color: "#fb923c", values: stats.history.test },
              ]}
            />

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Slider label="Polynomial degree" value={degree} min={1} max={8} step={1} onChange={setDegree} />
              <Slider label="L2 regularization (λ)" value={lambda} min={0} max={0.5} step={0.01} onChange={setLambda} format={(v) => v.toFixed(2)} />
              <Slider label="Noise" value={noiseStd} min={0} max={0.4} step={0.01} onChange={setNoiseStd} format={(v) => v.toFixed(2)} />
              <Slider label="Train ratio" value={trainRatio} min={0.1} max={0.9} step={0.05} onChange={setTrainRatio} format={(v) => `${Math.round(v * 100)}%`} />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-sm font-medium text-white"
              >
                {playing ? "Pause" : "Resume"} training
              </button>
              <button
                onClick={() => setSeed((s) => s + 1)}
                className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-200"
              >
                New dataset
              </button>
            </div>
            <p className="text-xs text-neutral-500">epoch {stats.epoch} · gradient descent, lr={LR}</p>
          </div>
        )}
      </ClassificationTrainer>
    </div>
  );
}

interface TrainingStats {
  epoch: number;
  history: { train: number[]; test: number[] };
  trainAcc: number;
  testAcc: number;
  overfitting: boolean;
}

function ClassificationTrainer({
  points,
  degree,
  lambda,
  playing,
  children,
}: {
  points: ClassificationPoint[];
  degree: number;
  lambda: number;
  playing: boolean;
  children: (stats: TrainingStats) => ReactNode;
}) {
  const trainPoints = useMemo(() => points.filter((p) => p.split === "train"), [points]);
  const testPoints = useMemo(() => points.filter((p) => p.split === "test"), [points]);

  const [weights, setWeights] = useState<number[] | undefined>(undefined);
  const [epoch, setEpoch] = useState(0);
  const [history, setHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });

  const model = useMemo(
    () => new LogisticRegressor(degree, lambda, LR, weights),
    [degree, lambda, weights]
  );

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      let w = weights;
      for (let i = 0; i < STEPS_PER_TICK; i++) {
        w = new LogisticRegressor(degree, lambda, LR, w).nextWeights(trainPoints);
      }
      const next = new LogisticRegressor(degree, lambda, LR, w);
      setWeights(w);
      setEpoch((e) => e + STEPS_PER_TICK);
      setHistory((h) => ({
        train: [...h.train.slice(-MAX_HISTORY + 1), next.loss(trainPoints)],
        test: [...h.test.slice(-MAX_HISTORY + 1), next.loss(testPoints)],
      }));
    }, TICK_MS);
    return () => clearTimeout(id);
  }, [playing, weights, degree, lambda, trainPoints, testPoints]);

  const trainAcc = model.accuracy(trainPoints);
  const testAcc = model.accuracy(testPoints);
  const trainLoss = history.train.at(-1) ?? 0;
  const testLoss = history.test.at(-1) ?? 0;
  const overfitting = testLoss > trainLoss * 1.6 && epoch > 40;
  const predict = useCallback((x1: number, x2: number) => model.probability(x1, x2), [model]);

  return (
    <>
      <div className="space-y-4">
        <DecisionBoundaryCanvas points={points} predict={predict} domain={DOMAIN} />
        <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> class 0</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> class 1</span>
          <span>solid = train, outlined = test</span>
        </div>
      </div>
      {children({ epoch, history, trainAcc, testAcc, overfitting })}
    </>
  );
}
