import { Breadcrumbs } from "@/components/Breadcrumbs";
import { LlmApiLab } from "@/features/genai/llm-api/LlmApiLab";

export const metadata = { title: "LLM API — AI Engineering Lab" };

export default function LlmApiPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "LLM API" }]} />
      <h1 className="text-2xl font-semibold mb-1">LLM API</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Every AI application starts here: a model, a prompt, and a response — with token usage,
        latency, and cost tracked on every call. Requires the backend to be running.
      </p>
      <LlmApiLab />
    </div>
  );
}
