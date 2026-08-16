import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WorkflowsLab } from "@/features/genai/workflows/WorkflowsLab";

export const metadata = { title: "Workflows — AI Engineering Lab" };

export default function WorkflowsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "Workflows" }]} />
      <h1 className="text-2xl font-semibold mb-1">Workflows</h1>
      <p className="text-neutral-400 mb-8 max-w-2xl">
        The same input, run through a fixed deterministic pipeline and through an adaptive
        agent, side by side — so the trade-off is something you see, not just something
        you&rsquo;re told. Requires the backend to be running.
      </p>
      <WorkflowsLab />
    </div>
  );
}
