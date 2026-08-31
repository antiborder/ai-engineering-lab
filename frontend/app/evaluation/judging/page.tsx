import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JudgingPlayground } from "@/features/evaluation/judging/JudgingPlayground";

export const metadata = { title: "Judging & Comparing" };

export default function JudgingPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Evaluation", href: "/evaluation" }, { label: "Judging & Comparing" }]} />
      <h1 className="text-2xl font-semibold mb-1">Judging & Comparing</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Once you have scores, you still need to decide what they mean: whether a model grading
        another model can be trusted, how systems stack up against each other, and whether a new
        version is actually an improvement.
      </p>
      <JudgingPlayground />
    </div>
  );
}
