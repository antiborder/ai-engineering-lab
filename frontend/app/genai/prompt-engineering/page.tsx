import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PromptComparisonLab } from "@/features/genai/prompt-engineering/PromptComparisonLab";

export const metadata = { title: "Prompt Engineering — AI Engineering Lab" };

export default function PromptEngineeringPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "Prompt Engineering" }]} />
      <h1 className="text-2xl font-semibold mb-1">Prompt Engineering</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Two system prompts, the same test cases, run side by side. Requires the backend to be
        running.
      </p>
      <PromptComparisonLab />
    </div>
  );
}
