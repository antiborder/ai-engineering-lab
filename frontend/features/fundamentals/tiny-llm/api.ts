import { apiGet, apiPost } from "@/lib/api";

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

export function getTinyLlmState() {
  return apiGet<TinyLlmState>("/api/fundamentals/tiny-llm/state");
}

export function initTinyLlm(config: TinyLlmInitRequest) {
  return apiPost<TinyLlmState>("/api/fundamentals/tiny-llm/init", config);
}

export function trainTinyLlm(steps: number) {
  return apiPost<TrainResponse>("/api/fundamentals/tiny-llm/train", { steps });
}

export function generateTinyLlm(prompt: string, maxNewTokens: number, temperature: number) {
  return apiPost<{ text: string }>("/api/fundamentals/tiny-llm/generate", {
    prompt,
    max_new_tokens: maxNewTokens,
    temperature,
  });
}

export function getTinyLlmCorpus() {
  return apiGet<{ text: string; length: number }>("/api/fundamentals/tiny-llm/corpus");
}
