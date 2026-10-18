import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TinyLlmLab } from "@/features/fundamentals/tiny-llm/TinyLlmLabClientOnly";

export const metadata = { title: "Tiny LLM" };

export default function TinyLlmPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Fundamentals", href: "/fundamentals" }, { label: "Tiny LLM" }]} />
      <h1 className="text-2xl font-semibold mb-1">Tiny LLM</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        A real, from-scratch character-level Transformer, trained live in your browser — the
        same architecture visualized in Transformers, but this one actually learns.
      </p>
      <TinyLlmLab />
    </div>
  );
}
