"use client";

import { useEffect, useState } from "react";
import { LossChart } from "../classical-ml/LossChart";
import { Slider } from "../classical-ml/Slider";
import { ApiError } from "@/lib/api";
import { StatCard } from "@/components/StatCard";
import {
  generateTinyLlm,
  getTinyLlmCorpus,
  getTinyLlmState,
  initTinyLlm,
  trainTinyLlm,
  type TinyLlmState,
} from "./api";

const N_EMBD = 32;
const BLOCK_SIZE = 48;
const STEPS_PER_TICK = 10;
const TICK_MS = 150;

function backendUnreachableMessage(err: unknown): string {
  if (err instanceof ApiError) return `Backend error (${err.status}): ${err.message}`;
  return "Could not reach the backend API. Is it running? See docs/architecture/local-dev.md.";
}

export function TinyLlmLab() {
  const [nLayer, setNLayer] = useState(2);
  const [nHead, setNHead] = useState(2);
  const [lr, setLr] = useState(0.003);

  const [state, setState] = useState<TinyLlmState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const [corpus, setCorpus] = useState<string>("");
  const [prompt, setPrompt] = useState("Alice");
  const [maxNewTokens, setMaxNewTokens] = useState(200);
  const [temperature, setTemperature] = useState(0.8);
  const [generated, setGenerated] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, c] = await Promise.all([getTinyLlmState(), getTinyLlmCorpus()]);
        if (cancelled) return;
        setState(s);
        setNLayer(s.n_layer);
        setNHead(s.n_head);
        setLr(s.lr);
        setCorpus(c.text);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(backendUnreachableMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled) {
        try {
          const res = await trainTinyLlm(STEPS_PER_TICK);
          if (cancelled) return;
          setState((prev) => (prev ? { ...prev, step: res.step, loss_history: res.loss_history } : prev));
        } catch (err) {
          if (!cancelled) {
            setError(backendUnreachableMessage(err));
            setPlaying(false);
          }
          return;
        }
        await new Promise((r) => setTimeout(r, TICK_MS));
      }
    };
    loop();
    return () => {
      cancelled = true;
    };
  }, [playing]);

  const handleReinit = async () => {
    setPlaying(false);
    setLoading(true);
    setGenerated(null);
    try {
      const s = await initTinyLlm({ n_layer: nLayer, n_head: nHead, n_embd: N_EMBD, block_size: BLOCK_SIZE, lr });
      setState(s);
      setError(null);
    } catch (err) {
      setError(backendUnreachableMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateTinyLlm(prompt, maxNewTokens, temperature);
      setGenerated(res.text);
      setError(null);
    } catch (err) {
      setError(backendUnreachableMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !state) {
    return <p className="text-neutral-500 text-sm">Loading Tiny LLM session…</p>;
  }

  if (error && !state) {
    return <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2 max-w-lg">{error}</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-300 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer text-neutral-600">Training text ({corpus.length} characters)</summary>
        <pre className="mt-2 whitespace-pre-wrap text-xs text-neutral-500 bg-white border border-neutral-200 rounded-md p-3 max-h-40 overflow-y-auto">
          {corpus}
        </pre>
      </details>

      <div className="grid md:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Parameters" value={state ? state.num_params.toLocaleString() : "—"} />
            <StatCard label="Vocab size" value={state ? String(state.vocab_size) : "—"} />
          </div>

          <div className="space-y-3">
            <label className="block text-sm">
              <div className="text-neutral-600 mb-1">Transformer blocks</div>
              <select
                value={nLayer}
                onChange={(e) => setNLayer(Number(e.target.value))}
                className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-900"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} layer{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <div className="text-neutral-600 mb-1">Attention heads</div>
              <select
                value={nHead}
                onChange={(e) => setNHead(Number(e.target.value))}
                className="w-full bg-white border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-900"
              >
                {[1, 2, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} head{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <Slider label="Learning rate" value={lr} min={0.0005} max={0.02} step={0.0005} onChange={setLr} format={(v) => v.toFixed(4)} />
          </div>

          <button
            onClick={handleReinit}
            className="w-full px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-800"
          >
            Reinitialize model (resets training)
          </button>
        </div>

        <div className="space-y-4">
          <LossChart series={[{ label: "loss", color: "#0891b2", values: state?.loss_history ?? [] }]} />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white"
            >
              {playing ? "Pause" : "Train"}
            </button>
            <p className="text-xs text-neutral-500">
              step {state?.step ?? 0} · {N_EMBD}-dim embeddings, {BLOCK_SIZE}-char context
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-neutral-200">
            <div className="text-sm text-neutral-600">Generate</div>
            <div className="flex gap-2">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm text-neutral-900 font-mono"
                placeholder="prompt"
              />
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt}
                className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium text-white"
              >
                {generating ? "Generating…" : "Generate"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Length" value={maxNewTokens} min={20} max={400} step={10} onChange={setMaxNewTokens} />
              <Slider label="Temperature" value={temperature} min={0.1} max={1.5} step={0.05} onChange={setTemperature} format={(v) => v.toFixed(2)} />
            </div>
            {generated && (
              <pre className="whitespace-pre-wrap text-sm text-neutral-800 bg-white border border-neutral-200 rounded-md p-3 max-h-56 overflow-y-auto">
                {generated}
              </pre>
            )}
            <p className="text-xs text-neutral-500">
              Early in training this will look like noise. Train for a while and it should start
              producing recognizable words and quoted dialogue, since that&rsquo;s the pattern in
              the training text above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
