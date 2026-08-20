import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TinyLlmLab } from "@/features/fundamentals/tiny-llm/TinyLlmLabClientOnly";

export const metadata = { title: "Tiny LLM — AI Engineering Lab" };

export default function TinyLlmPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Fundamentals", href: "/fundamentals" }, { label: "Tiny LLM" }]} />
      <h1 className="text-2xl font-semibold mb-1">Tiny LLM</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        A real, from-scratch character-level Transformer, trained live on the backend with
        PyTorch — the same architecture visualized in Transformers, but this one actually
        learns. Requires the local backend to be running (see local dev docs).
      </p>
      <TinyLlmLab />
    </div>
  );
}
