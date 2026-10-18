import { mockComplete } from "@/lib/mock-provider";
import type { Document } from "./rag";
import { executeTool, planToolCalls } from "./tools";

/** User -> LLM -> Tool Selection -> Tool Execution -> Tool Result -> LLM
 * -> Answer (spec section 14). */
export interface ToolCallTrace {
  tool_name: string | null;
  tool_args: Record<string, string> | null;
  tool_result: string | null;
  answer: string;
  model: string;
}

export async function runToolCalling(message: string, documents: Document[], model: string): Promise<ToolCallTrace> {
  const calls = planToolCalls(message);

  if (calls.length === 0) {
    const completion = await mockComplete(model, message, "Answer directly; no tool is needed.");
    return { tool_name: null, tool_args: null, tool_result: null, answer: completion.text, model: completion.model };
  }

  const [name, args] = calls[0];
  const result = executeTool(name, args, documents);
  const prompt =
    `User asked: ${message}\nTool \`${name}\` returned: ${result}\n` +
    "Answer the user's question using this result.";
  const completion = await mockComplete(model, prompt, "You are a helpful assistant with tool access.");
  return { tool_name: name, tool_args: args, tool_result: result, answer: completion.text, model: completion.model };
}
