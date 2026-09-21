import { Breadcrumbs } from "@/components/Breadcrumbs";
import { WhatIsIacLab } from "@/features/iac/what-is-iac/WhatIsIacLab";

export const metadata = { title: "What Infrastructure as Code Is" };

export default function WhatIsIacPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "IaC", href: "/iac" }, { label: "What Infrastructure as Code Is" }]} />
      <h1 className="text-2xl font-semibold mb-1">What Infrastructure as Code Is</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Manual clicking vs. code, declarative vs. imperative, drift, and plan-before-apply — the
        ideas every Infrastructure as Code tool builds on.
      </p>
      <WhatIsIacLab />
    </div>
  );
}
