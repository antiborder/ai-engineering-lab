import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "GenAI Systems — AI Engineering Lab" };

const SECTIONS = [
  { href: "/genai/llm-api", label: "LLM API", description: "Model, input, output, tokens, latency, cost, configuration." },
  { href: "/genai/prompt-engineering", label: "Prompt Engineering", description: "Prompt A vs Prompt B, run identical test cases and compare." },
  { href: "/genai/structured-output", label: "Structured Output", description: "Natural language → JSON Schema → validation → structured output." },
  { href: "/genai/rag", label: "RAG", description: "Document → chunking → embedding → vector search → reranking → answer." },
  { href: "/genai/tool-calling", label: "Tool Calling", description: "LLM → tool selection → tool execution → tool result → answer." },
  { href: "/genai/agents", label: "Agents", description: "Goal → plan → tool → observation → next action → final answer." },
  { href: "/genai/workflows", label: "Workflows", description: "Deterministic vs agentic — when is an agent actually useful?" },
];

export default function GenAiPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems" }]} />
      <h1 className="text-2xl font-semibold mb-1">GenAI Systems</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        How modern AI applications are actually built. RAG is where you save your first AI
        Artifact — it then follows you into Evaluation, Inference, and LLMOps.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors"
          >
            <div className="font-medium text-neutral-900">{s.label}</div>
            <p className="text-sm text-neutral-600 mt-1">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
