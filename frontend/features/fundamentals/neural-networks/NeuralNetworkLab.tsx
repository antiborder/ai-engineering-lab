"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { generateMoonsData, type ClassificationPoint } from "../classical-ml/data";
import { LossChart } from "../classical-ml/LossChart";
import { Slider } from "../classical-ml/Slider";
import { DecisionBoundaryCanvas } from "@/components/DecisionBoundaryCanvas";
import {
  accuracy,
  initMlp,
  loss,
  meanActivations,
  nextWeights,
  predictProb,
  type Activation,
  type MlpConfig,
  type MlpWeights,
  type Sample,
} from "./mlp";
import { NetworkDiagram } from "./NetworkDiagram";

const MAX_HISTORY = 120;
const STEPS_PER_TICK = 4;
const TICK_MS = 60;
const DOMAIN = { xMin: -1.6, xMax: 2.4, yMin: -1.9, yMax: 1.4 };

const ARCHITECTURES: { label: string; hiddenSizes: number[] }[] = [
  { label: "no hidden layer (linear)", hiddenSizes: [] },
  { label: "1 layer × 4", hiddenSizes: [4] },
  { label: "1 layer × 8", hiddenSizes: [8] },
  { label: "2 layers × 6, 4", hiddenSizes: [6, 4] },
];

function toSamples(points: ClassificationPoint[]): Sample[] {
  return points.map((p) => ({ x: [p.x1, p.x2], y: p.label }));
}

export function NeuralNetworkLab() {
  const [seed, setSeed] = useState(1);
  const [archIndex, setArchIndex] = useState(2);
  const [activation, setActivation] = useState<Activation>("tanh");
  const [lr, setLr] = useState(0.8);
  const [noiseStd, setNoiseStd] = useState(0.15);
  const [trainRatio, setTrainRatio] = useState(0.4);
  const [playing, setPlaying] = useState(true);

  const points = useMemo(
    () => generateMoonsData(seed, 90, noiseStd, trainRatio),
    [seed, noiseStd, trainRatio]
  );
  const config: MlpConfig = useMemo(
    () => ({ inputDim: 2, hiddenSizes: ARCHITECTURES[archIndex].hiddenSizes, activation }),
    [archIndex, activation]
  );

  return (
    <div className="grid md:grid-cols-[460px_1fr] gap-6">
      <NetworkTrainer
        key={`${archIndex}-${activation}-${lr}-${seed}-${noiseStd}-${trainRatio}`}
        points={points}
        config={config}
        lr={lr}
        playing={playing}
      >
        {(stats) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Train accuracy" value={`${(stats.trainAcc * 100).toFixed(1)}%`} />
              <StatCard label="Test accuracy" value={`${(stats.testAcc * 100).toFixed(1)}%`} warn={stats.overfitting} />
            </div>
            {stats.overfitting && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-900 rounded-md px-3 py-2">
                Test loss is diverging from train loss. Larger networks can overfit just like
                high-degree polynomials did in Classical ML.
              </p>
            )}
            <LossChart
              series={[
                { label: "train", color: "#a78bfa", values: stats.history.train },
                { label: "test", color: "#fb923c", values: stats.history.test },
              ]}
            />

            <div className="space-y-3 pt-2">
              <label className="block text-sm">
                <div className="text-neutral-400 mb-1">Architecture</div>
                <select
                  value={archIndex}
                  onChange={(e) => setArchIndex(Number(e.target.value))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-neutral-100"
                >
                  {ARCHITECTURES.map((a, i) => (
                    <option key={a.label} value={i}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <div className="text-neutral-400 mb-1">Activation</div>
                <select
                  value={activation}
                  onChange={(e) => setActivation(e.target.value as Activation)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2 py-1.5 text-neutral-100"
                >
                  <option value="tanh">tanh</option>
                  <option value="relu">ReLU</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Slider label="Learning rate" value={lr} min={0.05} max={2} step={0.05} onChange={setLr} format={(v) => v.toFixed(2)} />
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
            <p className="text-xs text-neutral-500">epoch {stats.epoch} · backpropagation, lr={lr.toFixed(2)}</p>
          </div>
        )}
      </NetworkTrainer>
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

function NetworkTrainer({
  points,
  config,
  lr,
  playing,
  children,
}: {
  points: ClassificationPoint[];
  config: MlpConfig;
  lr: number;
  playing: boolean;
  children: (stats: TrainingStats) => ReactNode;
}) {
  const samples = useMemo(() => toSamples(points), [points]);
  const trainSamples = useMemo(
    () => toSamples(points.filter((p) => p.split === "train")),
    [points]
  );
  const testSamples = useMemo(
    () => toSamples(points.filter((p) => p.split === "test")),
    [points]
  );

  const [weights, setWeights] = useState<MlpWeights>(() => initMlp(config, 7));
  const [epoch, setEpoch] = useState(0);
  const [history, setHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });

  useEffect(() => {
    if (!playing) return;
    const id = setTimeout(() => {
      let w = weights;
      for (let i = 0; i < STEPS_PER_TICK; i++) w = nextWeights(w, config, trainSamples, lr, 0);
      setWeights(w);
      setEpoch((e) => e + STEPS_PER_TICK);
      setHistory((h) => ({
        train: [...h.train.slice(-MAX_HISTORY + 1), loss(w, config, trainSamples)],
        test: [...h.test.slice(-MAX_HISTORY + 1), loss(w, config, testSamples)],
      }));
    }, TICK_MS);
    return () => clearTimeout(id);
  }, [playing, weights, config, lr, trainSamples, testSamples]);

  const trainAcc = accuracy(weights, config, trainSamples);
  const testAcc = accuracy(weights, config, testSamples);
  const trainLoss = history.train.at(-1) ?? 0;
  const testLoss = history.test.at(-1) ?? 0;
  const overfitting = testLoss > trainLoss * 1.6 && epoch > 40;

  const predict = useCallback(
    (x1: number, x2: number) => predictProb(weights, config, [x1, x2]),
    [weights, config]
  );
  const activations = useMemo(() => meanActivations(weights, config, samples), [weights, config, samples]);

  return (
    <>
      <div className="space-y-4">
        <NetworkDiagram config={config} weights={weights} activations={activations} />
        <DecisionBoundaryCanvas points={points} predict={predict} domain={DOMAIN} />
        <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> class 0</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> class 1</span>
          <span>node brightness = mean activation · edge color = weight sign</span>
        </div>
      </div>
      {children({ epoch, history, trainAcc, testAcc, overfitting })}
    </>
  );
}

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${warn ? "border-amber-800 bg-amber-950/30" : "border-neutral-800 bg-neutral-900"}`}>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`text-lg font-mono ${warn ? "text-amber-400" : "text-neutral-100"}`}>{value}</div>
    </div>
  );
}
