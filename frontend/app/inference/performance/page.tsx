import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PerformanceLab } from "@/features/inference/performance/PerformanceLab";

export const metadata = { title: "Performance" };

export default function PerformancePage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Inference", href: "/inference" }, { label: "Performance" }]} />
      <h1 className="text-2xl font-semibold mb-1">Performance</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Latency, throughput, and time to first token, read together — then used to decide hosted
        API vs. self-hosted.
      </p>
      <PerformanceLab />
    </div>
  );
}
