import { mulberry32 } from "@/lib/random";

/** Minimum data every provider call must capture (spec section 10). */
export interface ProviderResponse {
  text: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  estimated_cost: number;
  request_id: string;
  timestamp: string;
}

export const AVAILABLE_MODELS = ["mock-small", "mock-large"];

// Fabricated but stable per-model pricing so mock cost estimates behave
// consistently (same shape as real per-token pricing) without any real spend.
const MOCK_PRICING_PER_1K_TOKENS: Record<string, [number, number]> = {
  "mock-small": [0.0001, 0.0002],
  "mock-large": [0.001, 0.002],
};

/** FNV-1a: turns a string into a stable 32-bit seed for mulberry32. */
function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function newRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID only exists in secure contexts (https/localhost);
  // e.g. opening the dev server over a LAN IP falls back to this.
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const [inPrice, outPrice] = MOCK_PRICING_PER_1K_TOKENS[model] ?? MOCK_PRICING_PER_1K_TOKENS["mock-small"];
  const cost = (inputTokens / 1000) * inPrice + (outputTokens / 1000) * outPrice;
  return Math.round(cost * 1e6) / 1e6;
}

/** Deterministic, network-free stand-in for a real LLM provider, running
 * entirely in the browser. Output is a hash-seeded pseudo-response so the
 * same prompt+model always produces the same tokens, which keeps demos
 * reproducible — and no real AI service is ever called, so it costs
 * nothing to run. */
export async function mockComplete(model: string, prompt: string, system?: string | null): Promise<ProviderResponse> {
  const start = performance.now();
  const rng = mulberry32(hashString(`${model}:${system ?? ""}:${prompt}`));

  // simulate network + generation latency
  await new Promise((r) => setTimeout(r, Math.min(50 + prompt.length * 0.5, 400)));

  const inputTokens = Math.max(1, prompt.split(/\s+/).filter(Boolean).length);
  const outputTokens = 20 + Math.floor(rng() * 101);
  const preview = `${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`;
  const text =
    `[mock:${model}] This is a simulated response to your prompt ("${preview}"). ` +
    "A real provider would send its model's answer here.";

  return {
    text,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    latency_ms: performance.now() - start,
    estimated_cost: estimateCost(model, inputTokens, outputTokens),
    request_id: newRequestId(),
    timestamp: new Date().toISOString(),
  };
}
