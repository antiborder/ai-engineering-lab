import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RagEvaluationLab } from "@/features/evaluation/rag/RagEvaluationLab";

export const metadata = { title: "RAG Evaluation" };

export default function RagEvaluationPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Evaluation", href: "/evaluation" }, { label: "RAG Evaluation" }]} />
      <h1 className="text-2xl font-semibold mb-1">RAG Evaluation</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Separating retrieval quality, answer quality, and faithfulness — and diagnosing which one
        actually failed when a RAG system gives a wrong answer.
      </p>
      <RagEvaluationLab />
    </div>
  );
}
