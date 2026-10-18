// The Tiny LLM lab talks to these functions. Training and generation run
// in the visitor's own browser with TensorFlow.js — on the GPU through
// WebGL when the device supports it, otherwise on the CPU — so the lab
// needs no server.
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { TINY_LLM_CORPUS } from "./corpus";
import { TinyLlmSession } from "./session";

export interface TinyLlmState {
  n_layer: number;
  n_head: number;
  n_embd: number;
  block_size: number;
  lr: number;
  vocab_size: number;
  num_params: number;
  step: number;
  loss_history: number[];
}

export interface TinyLlmInitRequest {
  n_layer: number;
  n_head: number;
  n_embd: number;
  block_size: number;
  lr: number;
}

export interface TrainResponse {
  step: number;
  losses: number[];
  loss_history: number[];
}

let sessionPromise: Promise<TinyLlmSession> | null = null;

function getSession(): Promise<TinyLlmSession> {
  sessionPromise ??= (async () => {
    const usingWebgl = await tf.setBackend("webgl").catch(() => false);
    if (!usingWebgl) await tf.setBackend("cpu");
    await tf.ready();
    return new TinyLlmSession();
  })();
  return sessionPromise;
}

let queue: Promise<unknown> = Promise.resolve();

/** Runs session operations one at a time, in call order. Without this, a
 * "Reinitialize" click could dispose the model while a training step is
 * still using it. */
function serialized<T>(op: (session: TinyLlmSession) => Promise<T> | T): Promise<T> {
  const run = queue.then(async () => op(await getSession()));
  queue = run.catch(() => undefined);
  return run;
}

function stateOf(session: TinyLlmSession): TinyLlmState {
  return {
    ...session.config,
    vocab_size: session.chars.length,
    num_params: session.model!.numParams(),
    step: session.step,
    loss_history: session.lossHistory,
  };
}

export function getTinyLlmState(): Promise<TinyLlmState> {
  return serialized(stateOf);
}

export function initTinyLlm(config: TinyLlmInitRequest): Promise<TinyLlmState> {
  return serialized((session) => {
    session.reset(config);
    return stateOf(session);
  });
}

export function trainTinyLlm(steps: number): Promise<TrainResponse> {
  return serialized(async (session) => {
    const losses = await session.trainSteps(steps);
    return { step: session.step, losses, loss_history: session.lossHistory };
  });
}

export function generateTinyLlm(prompt: string, maxNewTokens: number, temperature: number) {
  return serialized(async (session) => ({ text: await session.generate(prompt, maxNewTokens, temperature) }));
}

export async function getTinyLlmCorpus() {
  return { text: TINY_LLM_CORPUS, length: TINY_LLM_CORPUS.length };
}
