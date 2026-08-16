export type ModuleId =
  | "fundamentals"
  | "genai"
  | "evaluation"
  | "inference"
  | "llmops";

export interface ModuleInfo {
  id: ModuleId;
  slug: string;
  label: string;
  tagline: string;
  lifecycleStage: string;
}

/** Global + learning-path navigation order (spec section 3.1 / 3.2). */
export const MODULES: ModuleInfo[] = [
  {
    id: "fundamentals",
    slug: "fundamentals",
    label: "Fundamentals",
    tagline: "Understand how LLMs work",
    lifecycleStage: "Understand",
  },
  {
    id: "genai",
    slug: "genai",
    label: "GenAI Systems",
    tagline: "Build AI applications",
    lifecycleStage: "Build",
  },
  {
    id: "evaluation",
    slug: "evaluation",
    label: "Evaluation",
    tagline: "Measure whether it works",
    lifecycleStage: "Evaluate",
  },
  {
    id: "inference",
    slug: "inference",
    label: "Inference",
    tagline: "Serve models efficiently",
    lifecycleStage: "Optimize",
  },
  {
    id: "llmops",
    slug: "llmops",
    label: "LLMOps",
    tagline: "Run it in production",
    lifecycleStage: "Operate",
  },
];

export function getModule(id: ModuleId): ModuleInfo {
  const found = MODULES.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown module: ${id}`);
  return found;
}
