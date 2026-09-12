import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Evaluation" };

const UNITS = [
  {
    href: "/evaluation/basics",
    label: "Evaluation Basics",
    description: "Datasets, the evaluation pipeline, and metrics — the building blocks every evaluation depends on.",
    live: true,
  },
  {
    href: "/evaluation/judging",
    label: "Judging & Comparing",
    description: "LLM-as-a-judge, comparing models on the same dataset, and regression testing between versions.",
    live: true,
  },
  {
    href: "/evaluation/rag",
    label: "RAG Evaluation",
    description: "Separating retrieval quality, answer quality, and faithfulness — and diagnosing which one failed.",
    live: false,
  },
  {
    href: "/evaluation/agents",
    label: "Agent Evaluation",
    description: "Evaluating the whole process, not just the final answer — task success, tool selection, failure modes.",
    live: false,
  },
];

export default async function EvaluationPage({ searchParams }: PageProps<"/evaluation">) {
  const params = await searchParams;
  const artifactName = typeof params.artifactName === "string" ? params.artifactName : undefined;
  const artifactVersion = typeof params.artifactVersion === "string" ? params.artifactVersion : undefined;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Evaluation" }]} />
      <h1 className="text-2xl font-semibold mb-1">Evaluation</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Measure whether an AI system actually works. Datasets, metrics, LLM-as-a-judge, model
        comparison, RAG evaluation, and regression testing — operating on artifacts created in
        GenAI Systems.
      </p>

      {artifactName && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 max-w-2xl mb-6">
          <p className="text-base text-cyan-700">
            Selected artifact: <span className="font-mono">{artifactName} {artifactVersion}</span>
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {UNITS.map((s) =>
          s.live ? (
            <Link
              key={s.href}
              href={s.href}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors"
            >
              <div className="font-medium text-neutral-900">{s.label}</div>
              <p className="text-base text-neutral-600 mt-1">{s.description}</p>
            </Link>
          ) : (
            <div
              key={s.href}
              className="rounded-lg border border-dashed border-neutral-200 p-4"
            >
              <div className="flex items-center gap-2">
                <div className="font-medium text-neutral-500">{s.label}</div>
                <span className="text-sm uppercase tracking-wide text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
                  Coming soon
                </span>
              </div>
              <p className="text-base text-neutral-400 mt-1">{s.description}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
