import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StructuredOutputLab } from "@/features/genai/structured-output/StructuredOutputLab";

export const metadata = { title: "Structured Output — AI Engineering Lab" };

export default function StructuredOutputPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "Structured Output" }]} />
      <h1 className="text-2xl font-semibold mb-1">Structured Output</h1>
      <p className="text-neutral-400 mb-8 max-w-2xl">
        Edit the JSON Schema and see the shape of the output change with it — and watch
        validation catch it when the output doesn&rsquo;t match. Requires the backend to be
        running.
      </p>
      <StructuredOutputLab />
    </div>
  );
}
