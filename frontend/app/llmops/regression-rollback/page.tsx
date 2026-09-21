import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RegressionRollbackLab } from "@/features/llmops/regression-rollback/RegressionRollbackLab";

export const metadata = { title: "Regression & Rollback" };

export default function RegressionRollbackPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "LLMOps", href: "/llmops" }, { label: "Regression & Rollback" }]} />
      <h1 className="text-2xl font-semibold mb-1">Regression & Rollback</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Catching a quality regression after a deploy, and reverting to a known-good version
        without rebuilding it.
      </p>
      <RegressionRollbackLab />
    </div>
  );
}
