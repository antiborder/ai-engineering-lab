import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProvisioningLab } from "@/features/iac/provisioning/ProvisioningLab";

export const metadata = { title: "Provisioning This App's Own Cloud Infrastructure" };

export default function ProvisioningPage() {
  return (
    <div>
      <Breadcrumbs
        items={[{ label: "IaC", href: "/iac" }, { label: "Provisioning This App's Own Cloud Infrastructure" }]}
      />
      <h1 className="text-2xl font-semibold mb-1">Provisioning This App&rsquo;s Own Cloud Infrastructure</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Applying it for real: Cloud Run, Firestore, Cloud Storage, and Artifact Registry,
        provisioned for the exact image CI/CD &amp; Deployment built.
      </p>
      <ProvisioningLab />
    </div>
  );
}
