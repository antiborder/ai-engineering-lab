"use client";

import { Slider } from "../classical-ml/Slider";

// Illustrative next-character logits after the prompt "th" — not pulled
// from a real trained model, just realistic enough (e/space/i beat a rare
// letter like z) to make temperature's reshaping effect legible.
const CANDIDATES = [
  { ch: "e", logit: 2.2 },
  { ch: " ", logit: 1.6 },
  { ch: "i", logit: 1.1 },
  { ch: "a", logit: 0.4 },
  { ch: "o", logit: -0.3 },
  { ch: "z", logit: -2.0 },
];

function softmax(scores: number[]): number[] {
  const max = Math.max(...scores);
  const exps = scores.map((s) => Math.exp(s - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((e) => e / sum);
}

/** Shows temperature's actual effect: divide every logit by the same
 * temperature before softmax, so low temperature sharpens the distribution
 * toward the top candidate and high temperature flattens it out. Fixed,
 * illustrative logits (not from a real forward pass) — the point is the
 * shape of the reshaping, which is exact regardless of which logits. */
export function TemperatureDemo({
  temperature,
  onChange,
}: {
  temperature: number;
  onChange: (v: number) => void;
}) {
  const scaled = CANDIDATES.map((c) => c.logit / Math.max(temperature, 0.05));
  const probs = softmax(scaled);
  const top = probs.indexOf(Math.max(...probs));

  return (
    <div className="space-y-4">
      <Slider
        label="Temperature"
        value={temperature}
        min={0.1}
        max={2}
        step={0.05}
        onChange={onChange}
        format={(v) => v.toFixed(2)}
      />
      <div className="space-y-1.5">
        {CANDIDATES.map((c, i) => (
          <div key={c.ch} className="flex items-center gap-2 text-xs">
            <span className="w-10 shrink-0 font-mono text-neutral-600 text-center bg-neutral-100 rounded px-1">
              {c.ch === " " ? "␣" : c.ch}
            </span>
            <div className="flex-1 h-4 bg-neutral-200 rounded overflow-hidden">
              <div
                className={`h-full ${i === top ? "bg-cyan-600" : "bg-cyan-300"}`}
                style={{ width: `${probs[i] * 100}%` }}
              />
            </div>
            <span className="w-12 text-right text-neutral-500 tabular-nums">
              {(probs[i] * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
