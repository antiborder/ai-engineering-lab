import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CiCdLab } from "@/features/llmops/ci-cd/CiCdLab";

export const metadata = { title: "CI/CD & Deployment" };

export default function CiCdPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "LLMOps", href: "/llmops" }, { label: "CI/CD & Deployment" }]} />
      <h1 className="text-2xl font-semibold mb-1">CI/CD & Deployment</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Packaging a version, testing and gating it automatically, and promoting the exact same
        artifact through Development, Staging, and Production.
      </p>
      <CiCdLab />
    </div>
  );
}
