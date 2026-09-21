import { Breadcrumbs } from "@/components/Breadcrumbs";
import { IamLab } from "@/features/iac/iam/IamLab";

export const metadata = { title: "IAM & Least-Privilege Security" };

export default function IamPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "IaC", href: "/iac" }, { label: "IAM & Least-Privilege Security" }]} />
      <h1 className="text-2xl font-semibold mb-1">IAM &amp; Least-Privilege Security</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Service accounts, roles, and why a service should only ever be able to do what it
        actually needs to.
      </p>
      <IamLab />
    </div>
  );
}
