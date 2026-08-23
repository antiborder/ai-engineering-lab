import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TransformerLab } from "@/features/fundamentals/transformers/TransformerLabClientOnly";

export const metadata = { title: "Transformers" };

export default function TransformersPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Fundamentals", href: "/fundamentals" }, { label: "Transformers" }]} />
      <h1 className="text-2xl font-semibold mb-1">Transformers</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Same sentence, taken apart step by step: tokenization, embeddings, Query/Key/Value,
        softmax attention, causal masking, multi-head attention, residual connections and layer
        normalization, the feed-forward network, and stacking it all into blocks. The weights
        are randomly initialized rather than trained — this walkthrough is about seeing the
        mechanism clearly, not generating good text.
      </p>
      <TransformerLab />
    </div>
  );
}
