"use client";

import { Slider } from "../classical-ml/Slider";

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** The interactive "graph" for softmax: since it's a many-in, many-out
 * function (not a single curve like sigmoid/tanh/ReLU), the clearest way
 * to show its shape is to let the user drag raw scores directly and watch
 * the resulting probabilities redistribute live. */
export function SoftmaxDemo({
  scores,
  labels,
  onChange,
}: {
  scores: number[];
  labels: string[];
  onChange: (index: number, value: number) => void;
}) {
  const probs = softmax(scores);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores.map((s, i) => (
          <Slider
            key={i}
            label={`score(${labels[i]})`}
            value={s}
            min={-4}
            max={4}
            step={0.1}
            onChange={(v) => onChange(i, v)}
            format={(v) => v.toFixed(1)}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        {probs.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-16 shrink-0 font-mono text-neutral-600 truncate">{labels[i]}</span>
            <div className="flex-1 h-4 bg-neutral-200 rounded overflow-hidden">
              <div className="h-full bg-cyan-600" style={{ width: `${p * 100}%` }} />
            </div>
            <span className="w-12 text-right text-neutral-500 tabular-nums">{(p * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
