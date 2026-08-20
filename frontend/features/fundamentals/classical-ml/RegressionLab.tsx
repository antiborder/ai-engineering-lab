"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { generateRegressionData, type RegressionPoint } from "./data";
import { PolynomialRegressor } from "./models";
import { RegressionPlot } from "./RegressionPlot";
import { RegressionWalkthrough } from "./RegressionWalkthrough";
import { LossChart } from "./LossChart";
import { Slider } from "./Slider";
import { StatCard } from "@/components/StatCard";
import { Term } from "@/components/Term";

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
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);

  const points = useMemo(
    () => generateRegressionData(seed, 60, noiseStd, trainRatio),
    [seed, noiseStd, trainRatio]
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">
          <span className="text-neutral-800 font-medium">Regression</span> means predicting a
          number from an input — here, a y-value from an x-value. The model is a curve; training
          means adjusting that curve so its predictions are as close as possible to the real data,
          measured by a <Term id="loss">loss</Term> function, without memorizing the training
          points so exactly that it fails on new ones (<Term id="overfitting">overfitting</Term>).
        </p>
        <RegressionWalkthrough onComplete={() => setWalkthroughComplete(true)} />
      </div>

      {walkthroughComplete && (
      <div>
        <h3 className="text-sm font-medium text-neutral-800 mb-1">Explore it yourself</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Same idea, now with controls. Try raising the polynomial degree past 8 — watch the gap
          between train and test loss open up.
        </p>
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
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                Test loss is much higher than train loss — the model is overfitting the
                training points instead of learning the underlying function. Try lowering the
                polynomial degree or raising the L2 regularization strength.
              </p>
            )}
            <LossChart
              series={[
                { label: "train", color: "#7c3aed", values: stats.history.train },
                { label: "test", color: "#ea580c", values: stats.history.test },
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
                className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white"
              >
                {playing ? "Pause" : "Resume"} training
              </button>
              <button
                onClick={() => setSeed((s) => s + 1)}
                className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-700"
              >
                New dataset
              </button>
              <label className="flex items-center gap-1.5 text-sm text-neutral-600 ml-auto">
                <input type="checkbox" checked={showTrueFn} onChange={(e) => setShowTrueFn(e.target.checked)} />
                show true function
              </label>
            </div>
            <p className="text-xs text-neutral-500">epoch {stats.epoch} · gradient descent, lr={LR}</p>
          </div>
        )}
      </RegressionTrainer>
        </div>
      </div>
      )}
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
        <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> train points</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-600" /> test points</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-cyan-600" /> model fit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 border-t border-dashed border-neutral-500" /> true function</span>
        </div>
      </div>
      {children({ epoch, history, trainLoss, testLoss, overfitting })}
    </>
  );
}
