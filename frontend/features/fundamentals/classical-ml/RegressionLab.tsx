"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { generateRegressionData, type RegressionPoint } from "./data";
import { PolynomialRegressor } from "./models";
import { RegressionPlot } from "./RegressionPlot";
import { LossChart } from "./LossChart";
import { Slider } from "./Slider";
import { StatCard } from "@/components/StatCard";

const MAX_HISTORY = 120;
const LR = 0.6;
const STEPS_PER_TICK = 4;
const TICK_MS = 60;

export function RegressionLab() {
  const [seed, setSeed] = useState(1);
  const [degree, setDegree] = useState(3);
  const [lambda, setLambda] = useState(0);
  const [noiseStd, setNoiseStd] = useState(0.15);
  const [trainRatio, setTrainRatio] = useState(0.3);
  const [showTrueFn, setShowTrueFn] = useState(true);
  const [playing, setPlaying] = useState(true);

  const points = useMemo(
    () => generateRegressionData(seed, 60, noiseStd, trainRatio),
    [seed, noiseStd, trainRatio]
  );

  return (
    <div className="grid md:grid-cols-[420px_1fr] gap-6">
      {/* Changing degree/lambda/dataset remounts the trainer below, which
          restarts training from scratch — so every parameter's effect is
          visible from epoch 0 (spec 11.1). */}
      <RegressionTrainer
        key={`${degree}-${lambda}-${seed}-${noiseStd}-${trainRatio}`}
        points={points}
        degree={degree}
        lambda={lambda}
        showTrueFn={showTrueFn}
        playing={playing}
      >
        {(stats) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Train loss (MSE)" value={stats.trainLoss.toFixed(4)} />
              <StatCard label="Test loss (MSE)" value={stats.testLoss.toFixed(4)} tone={stats.overfitting ? "warn" : "default"} />
            </div>
            {stats.overfitting && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-900 rounded-md px-3 py-2">
                Test loss is much higher than train loss — the model is overfitting the
                training points instead of learning the underlying function. Try lowering the
                polynomial degree or raising the L2 regularization strength.
              </p>
            )}
            <LossChart
              series={[
                { label: "train", color: "#a78bfa", values: stats.history.train },
                { label: "test", color: "#fb923c", values: stats.history.test },
              ]}
            />

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Slider label="Polynomial degree" value={degree} min={1} max={12} step={1} onChange={setDegree} />
              <Slider label="L2 regularization (λ)" value={lambda} min={0} max={0.05} step={0.001} onChange={setLambda} format={(v) => v.toFixed(3)} />
              <Slider label="Noise" value={noiseStd} min={0} max={0.5} step={0.01} onChange={setNoiseStd} format={(v) => v.toFixed(2)} />
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
              <label className="flex items-center gap-1.5 text-sm text-neutral-400 ml-auto">
                <input type="checkbox" checked={showTrueFn} onChange={(e) => setShowTrueFn(e.target.checked)} />
                show true function
              </label>
            </div>
            <p className="text-xs text-neutral-500">epoch {stats.epoch} · gradient descent, lr={LR}</p>
          </div>
        )}
      </RegressionTrainer>
    </div>
  );
}

interface TrainingStats {
  epoch: number;
  history: { train: number[]; test: number[] };
  trainLoss: number;
  testLoss: number;
  overfitting: boolean;
}

function RegressionTrainer({
  points,
  degree,
  lambda,
  showTrueFn,
  playing,
  children,
}: {
  points: RegressionPoint[];
  degree: number;
  lambda: number;
  showTrueFn: boolean;
  playing: boolean;
  children: (stats: TrainingStats) => ReactNode;
}) {
  const trainPoints = useMemo(() => points.filter((p) => p.split === "train"), [points]);
  const testPoints = useMemo(() => points.filter((p) => p.split === "test"), [points]);

  const [weights, setWeights] = useState<number[] | undefined>(undefined);
  const [epoch, setEpoch] = useState(0);
  const [history, setHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });

  const model = useMemo(
    () => new PolynomialRegressor(degree, lambda, LR, weights),
    [degree, lambda, weights]
  );

  // Self-scheduling training loop: each tick computes the next weights from
  // the current ones and schedules the following tick as a fresh effect run
  // (triggered by `weights` changing) — no ref reads, no setState during
  // render, no synchronous setState in the effect body itself.
  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      let w = weights;
      for (let i = 0; i < STEPS_PER_TICK; i++) {
        w = new PolynomialRegressor(degree, lambda, LR, w).nextWeights(trainPoints);
      }
      const next = new PolynomialRegressor(degree, lambda, LR, w);
      setWeights(w);
      setEpoch((e) => e + STEPS_PER_TICK);
      setHistory((h) => ({
        train: [...h.train.slice(-MAX_HISTORY + 1), next.loss(trainPoints)],
        test: [...h.test.slice(-MAX_HISTORY + 1), next.loss(testPoints)],
      }));
    }, TICK_MS);
    return () => clearTimeout(id);
  }, [playing, weights, degree, lambda, trainPoints, testPoints]);

  const trainLoss = history.train.at(-1) ?? 0;
  const testLoss = history.test.at(-1) ?? 0;
  const overfitting = testLoss > trainLoss * 1.6 && epoch > 40;

  return (
    <>
      <div className="space-y-4">
        <RegressionPlot points={points} model={model} showTrueFn={showTrueFn} />
        <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-400" /> train points</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> test points</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-cyan-400" /> model fit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 border-t border-dashed border-neutral-500" /> true function</span>
        </div>
      </div>
      {children({ epoch, history, trainLoss, testLoss, overfitting })}
    </>
  );
}
