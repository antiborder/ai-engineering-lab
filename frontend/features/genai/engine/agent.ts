import { mockComplete } from "@/lib/mock-provider";
import type { Document } from "./rag";
import { executeTool, planToolCalls } from "./tools";

const MAX_STEPS = 5;

export interface AgentStep {
  step: number;
  tool_name: string;
  tool_args: Record<string, string>;
  observation: string;
  failed: boolean;
  retried: boolean;
}

/** Goal -> Plan -> Tool -> Observation -> Next Action -> ... -> Final
 * Answer (spec section 15). No private chain-of-thought is exposed —
 * only the plan, each tool call, and its observation. */
export interface AgentTrace {
  plan: string[];
  steps: AgentStep[];
  final_answer: string;
  model: string;
}

export async function runAgent(goal: string, documents: Document[], model: string): Promise<AgentTrace> {
  const calls = planToolCalls(goal).slice(0, MAX_STEPS);
  const plan = calls.map(
    ([name, args]) => `${name}(${Object.entries(args).map(([k, v]) => `${k}=${v}`).join(", ")})`
  );

  const steps: AgentStep[] = calls.map(([name, args], i) => {
    let observation = executeTool(name, args, documents);
    let failed = observation.startsWith("error:") || observation.startsWith("no ");
    let retried = false;
    if (failed) {
      retried = true;
      const retryObservation = executeTool(name, args, documents);
      if (!retryObservation.startsWith("error:")) {
        observation = retryObservation;
        failed = false;
      }
    }
    return { step: i + 1, tool_name: name, tool_args: args, observation, failed, retried };
  });

  const observationsText =
    steps.length > 0 ? steps.map((s) => `- ${s.tool_name}: ${s.observation}`).join("\n") : "(no tools were needed)";
  const prompt = `Goal: ${goal}\n\nObservations:\n${observationsText}\n\nGive a final answer to the goal using the observations.`;
  const completion = await mockComplete(model, prompt, "You are an agent completing a multi-step goal.");

  return { plan, steps, final_answer: completion.text, model: completion.model };
}
