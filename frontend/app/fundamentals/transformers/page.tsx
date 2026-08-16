import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TransformerLab } from "@/features/fundamentals/transformers/TransformerLabClientOnly";

export const metadata = { title: "Transformers — AI Engineering Lab" };

export default function TransformersPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Fundamentals", href: "/fundamentals" }, { label: "Transformers" }]} />
      <h1 className="text-2xl font-semibold mb-1">Transformers</h1>
      <p className="text-neutral-400 mb-8 max-w-2xl">
        Type any text and inspect a real causal self-attention forward pass: tokenization,
        embeddings, Q/K/V, softmax attention scores, multi-head attention, and causal masking.
        The weights are randomly initialized rather than trained — this section is about
        seeing the mechanism clearly, not generating good text.
      </p>
      <TransformerLab />
    </div>
  );
}
