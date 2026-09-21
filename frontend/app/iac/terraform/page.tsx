import { Breadcrumbs } from "@/components/Breadcrumbs";
import { TerraformLab } from "@/features/iac/terraform/TerraformLab";

export const metadata = { title: "Terraform: Declaring Infrastructure" };

export default function TerraformPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "IaC", href: "/iac" }, { label: "Terraform: Declaring Infrastructure" }]} />
      <h1 className="text-2xl font-semibold mb-1">Terraform: Declaring Infrastructure</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        The representative deep dive — HCL, resources, the init/plan/apply/destroy workflow,
        state, and modules.
      </p>
      <TerraformLab />
    </div>
  );
}
