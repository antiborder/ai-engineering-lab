// Every GenAI lab talks to these functions. They run entirely in the
// browser against the mock provider (lib/mock-provider.ts), so the labs
// need no server and never call a paid AI service. The request/response
// shapes match what a real LLM API would return.
import { AVAILABLE_MODELS, mockComplete, type ProviderResponse } from "@/lib/mock-provider";
import { runAgent as runAgentLoop, type AgentStep, type AgentTrace } from "./engine/agent";
import type { Document } from "./engine/rag";
import { getRagSession, type QueryParams } from "./engine/rag-session";
import { generateStructuredOutput as generateMockOutput, validateAgainstSchema } from "./engine/structured-output";
import { runToolCalling, type ToolCallTrace } from "./engine/tool-calling";

/** Input limits a real API would enforce, so oversized input fails the
 * same way it would against a hosted endpoint. */
function requireLength(label: string, value: string, max: number): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
  if (value.length > max) throw new Error(`${label} must be at most ${max} characters.`);
}

export type CompletionResponse = ProviderResponse;

export async function listModels(): Promise<string[]> {
  return AVAILABLE_MODELS;
}

export async function complete(model: string, prompt: string, system?: string): Promise<CompletionResponse> {
  requireLength("Prompt", prompt, 4000);
  return mockComplete(model, prompt, system);
}

export interface StructuredOutputResponse {
  output: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

export async function generateStructuredOutput(
  jsonSchema: Record<string, unknown>,
  breakSchema: boolean,
  seed: number
): Promise<StructuredOutputResponse> {
  const output = generateMockOutput(jsonSchema, seed, breakSchema);
  const errors = validateAgainstSchema(output, jsonSchema);
  return { output, valid: errors.length === 0, errors };
}

export type RagDocument = Document;

export async function listDocuments(): Promise<RagDocument[]> {
  return getRagSession().listDocuments();
}

export async function addDocument(title: string, text: string): Promise<RagDocument> {
  requireLength("Title", title, 100);
  requireLength("Text", text, 8000);
  return getRagSession().addDocument(title, text);
}

export async function resetDocuments(): Promise<RagDocument[]> {
  const session = getRagSession();
  session.resetToDemo();
  return session.listDocuments();
}

export async function deleteDocument(id: string): Promise<void> {
  getRagSession().removeDocument(id);
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

export type RagQueryParams = QueryParams;

export async function ragQuery(params: RagQueryParams): Promise<RagQueryResponse> {
  requireLength("Query", params.query, 500);
  const session = getRagSession();
  if (session.listDocuments().length === 0) throw new Error("There are no documents in the corpus.");
  const result = await session.query(params);
  return {
    ...result,
    retrieved: result.retrieved.map((r) => ({
      doc_title: r.chunk.doc_title,
      chunk_index: r.chunk.index,
      text: r.chunk.text,
      score: r.score,
      rerank_score: r.rerank_score,
    })),
  };
}

export type ToolCallResponse = ToolCallTrace;

export async function callWithTools(message: string, model: string): Promise<ToolCallResponse> {
  requireLength("Message", message, 500);
  return runToolCalling(message, getRagSession().listDocuments(), model);
}

export type { AgentStep };
export type AgentRunResponse = AgentTrace;

export async function runAgent(goal: string, model: string): Promise<AgentRunResponse> {
  requireLength("Goal", goal, 500);
  return runAgentLoop(goal, getRagSession().listDocuments(), model);
}
