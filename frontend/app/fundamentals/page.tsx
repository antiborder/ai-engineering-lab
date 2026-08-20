import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Fundamentals — AI Engineering Lab" };

const SECTIONS = [
  {
    href: "/fundamentals/classical-ml",
    label: "Classical ML",
    description: "Regression, classification, clustering, loss, gradient descent, overfitting.",
    status: "ready" as const,
  },
  {
    href: "/fundamentals/neural-networks",
    label: "Neural Networks",
    description: "Neurons, weights, activations, forward propagation, backpropagation.",
    status: "ready" as const,
  },
  {
    href: "/fundamentals/transformers",
    label: "Transformers",
    description: "Tokenization, embeddings, Q/K/V attention, multi-head attention, causal masking.",
    status: "ready" as const,
  },
  {
    href: "/fundamentals/tiny-llm",
    label: "Tiny LLM",
    description: "Inspect, train, and generate text from a real (tiny) Transformer.",
    status: "ready" as const,
  },
];

export default function FundamentalsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Fundamentals" }]} />
      <h1 className="text-2xl font-semibold mb-1">Fundamentals</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Engineering-level understanding of how modern AI systems work, from classical ML up
        through a real (tiny) Transformer you train yourself.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) =>
          s.status === "ready" ? (
            <Link
              key={s.href}
              href={s.href}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors"
            >
              <div className="font-medium text-neutral-900">{s.label}</div>
              <p className="text-sm text-neutral-600 mt-1">{s.description}</p>
            </Link>
          ) : (
            <div
              key={s.href}
              className="block rounded-lg border border-neutral-200 bg-neutral-50 p-4 opacity-50"
            >
              <div className="font-medium text-neutral-400 flex items-center gap-2">
                {s.label}
                <span className="text-[10px] uppercase tracking-wide text-neutral-500 border border-neutral-200 rounded px-1.5 py-0.5">
                  coming soon
                </span>
              </div>
              <p className="text-sm text-neutral-500 mt-1">{s.description}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
