import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExperimentTrackingLab } from "@/features/llmops/experiment-tracking/ExperimentTrackingLab";

export const metadata = { title: "Experiment Tracking" };

export default function ExperimentTrackingPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "LLMOps", href: "/llmops" }, { label: "Experiment Tracking" }]} />
      <h1 className="text-2xl font-semibold mb-1">Experiment Tracking</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        What gets versioned, and how to compare many saved versions of the same system — not just
        the latest two — before deciding which one ships.
      </p>
      <ExperimentTrackingLab />
    </div>
  );
}
