import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ModelServingLab } from "@/features/inference/model-serving/ModelServingLab";

export const metadata = { title: "Model Serving" };

export default function ModelServingPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Inference", href: "/inference" }, { label: "Model Serving" }]} />
      <h1 className="text-2xl font-semibold mb-1">Model Serving</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Why serving is a different problem from training, the path every request follows, and
        why a single request is easy while many at once is not.
      </p>
      <ModelServingLab />
    </div>
  );
}
