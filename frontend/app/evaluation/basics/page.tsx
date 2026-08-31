import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EvaluationBasicsPlayground } from "@/features/evaluation/basics/EvaluationBasicsPlayground";

export const metadata = { title: "Evaluation Basics" };

export default function EvaluationBasicsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Evaluation", href: "/evaluation" }, { label: "Evaluation Basics" }]} />
      <h1 className="text-2xl font-semibold mb-1">Evaluation Basics</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Before you can measure whether an AI system works, you need a dataset of test cases, a
        pipeline to run them through, and metrics to score the results. This is where evaluation
        starts.
      </p>
      <EvaluationBasicsPlayground />
    </div>
  );
}
