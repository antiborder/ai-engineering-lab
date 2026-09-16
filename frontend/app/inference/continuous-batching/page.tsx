import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ContinuousBatchingLab } from "@/features/inference/continuous-batching/ContinuousBatchingLab";

export const metadata = { title: "Continuous Batching" };

export default function ContinuousBatchingPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Inference", href: "/inference" }, { label: "Continuous Batching" }]} />
      <h1 className="text-2xl font-semibold mb-1">Continuous Batching</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Why waiting for a whole batch to finish wastes the GPU, and how refilling a slot the
        instant it frees up keeps every slot busy instead.
      </p>
      <ContinuousBatchingLab />
    </div>
  );
}
