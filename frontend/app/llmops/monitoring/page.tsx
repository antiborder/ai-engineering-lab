import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MonitoringLab } from "@/features/llmops/monitoring/MonitoringLab";

export const metadata = { title: "Monitoring & Observability" };

export default function MonitoringPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "LLMOps", href: "/llmops" }, { label: "Monitoring & Observability" }]} />
      <h1 className="text-2xl font-semibold mb-1">Monitoring & Observability</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Watching a live system: an aggregate dashboard, tracing a single request, and cost at
        scale — three different questions, one shared stream of telemetry.
      </p>
      <MonitoringLab />
    </div>
  );
}
