import { apiDelete, apiGet, apiPost } from "@/lib/api";

export interface CompletionResponse {
  text: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  estimated_cost: number;
  request_id: string;
  timestamp: string;
}

export function listModels() {
  return apiGet<string[]>("/api/genai/models");
}

export function complete(model: string, prompt: string, system?: string) {
  return apiPost<CompletionResponse>("/api/genai/complete", { model, prompt, system });
}

export interface StructuredOutputResponse {
  output: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

export function generateStructuredOutput(
  jsonSchema: Record<string, unknown>,
  breakSchema: boolean,
  seed: number
) {
  return apiPost<StructuredOutputResponse>("/api/genai/structured-output/generate", {
    json_schema: jsonSchema,
    break_schema: breakSchema,
    seed,
  });
}

export interface RagDocument {
  id: string;
  title: string;
  text: string;
}

export function listDocuments() {
  return apiGet<RagDocument[]>("/api/genai/rag/documents");
}

export function addDocument(title: string, text: string) {
  return apiPost<RagDocument>("/api/genai/rag/documents", { title, text });
}

export function resetDocuments() {
  return apiPost<RagDocument[]>("/api/genai/rag/documents/reset", {});
}

export function deleteDocument(id: string): Promise<void> {
  return apiDelete(`/api/genai/rag/documents/${id}`);
}

export interface RetrievedChunk {
  doc_title: string;
  chunk_index: number;
  text: string;
  score: number;
  rerank_score: number | null;
}

export interface RagQueryResponse {
  retrieved: RetrievedChunk[];
  context: string;
  answer: string;
  model: string;
  latency_ms: number;
  estimated_cost: number;
}

export interface RagQueryParams {
  query: string;
  chunk_size: number;
  overlap: number;
  top_k: number;
  similarity_threshold: number;
  use_reranking: boolean;
  model: string;
}

export function ragQuery(params: RagQueryParams) {
  return apiPost<RagQueryResponse>("/api/genai/rag/query", params);
}

export interface ToolCallResponse {
  tool_name: string | null;
  tool_args: Record<string, string> | null;
  tool_result: string | null;
  answer: string;
  model: string;
}

export function callWithTools(message: string, model: string) {
  return apiPost<ToolCallResponse>("/api/genai/tools/call", { message, model });
}

export interface AgentStep {
  step: number;
  tool_name: string;
  tool_args: Record<string, string>;
  observation: string;
  failed: boolean;
  retried: boolean;
}

export interface AgentRunResponse {
  plan: string[];
  steps: AgentStep[];
  final_answer: string;
  model: string;
}

export function runAgent(goal: string, model: string) {
  return apiPost<AgentRunResponse>("/api/genai/agent/run", { goal, model });
}
