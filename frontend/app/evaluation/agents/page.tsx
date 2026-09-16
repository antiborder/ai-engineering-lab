import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AgentEvaluationLab } from "@/features/evaluation/agents/AgentEvaluationLab";

export const metadata = { title: "Agent Evaluation" };

export default function AgentEvaluationPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Evaluation", href: "/evaluation" }, { label: "Agent Evaluation" }]} />
      <h1 className="text-2xl font-semibold mb-1">Agent Evaluation</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Evaluating the whole process behind an agent&rsquo;s resolution, not just whether the
        final answer looks right — and catching what a clean outcome can hide.
      </p>
      <AgentEvaluationLab />
    </div>
  );
}
