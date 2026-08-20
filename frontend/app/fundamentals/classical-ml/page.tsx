import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ClassicalMlPlayground } from "@/features/fundamentals/classical-ml/ClassicalMlPlaygroundClientOnly";

export const metadata = { title: "Classical ML — AI Engineering Lab" };

export default function ClassicalMlPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Fundamentals", href: "/fundamentals" }, { label: "Classical ML" }]} />
      <h1 className="text-2xl font-semibold mb-1">Classical ML</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Before Transformers, most ML was a model, a loss function, and gradient descent.
        Adjust the controls below and watch training happen live — the same loop (predict,
        measure loss, compute gradients, update weights) that trains every neural network
        later in this module.
      </p>
      <ClassicalMlPlayground />
    </div>
  );
}
