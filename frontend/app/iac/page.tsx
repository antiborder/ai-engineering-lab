import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "IaC" };

const UNITS = [
  {
    href: "/iac/what-is-iac",
    label: "What Infrastructure as Code Is",
    description: "Manual clicking vs. code, declarative vs. imperative, drift, and plan-before-apply — the ideas every IaC tool builds on.",
    live: true,
  },
  {
    href: "/iac/terraform",
    label: "Terraform: Declaring Infrastructure",
    description: "The representative deep dive — HCL, resources, the init/plan/apply/destroy workflow, state, and modules.",
    live: true,
  },
  {
    href: "/iac/provisioning",
    label: "Provisioning This App's Own Cloud Infrastructure",
    description: "Applying it for real: Cloud Run, Firestore, Cloud Storage, and Artifact Registry, provisioned for the exact image CI/CD & Deployment built.",
    live: true,
  },
  {
    href: "/iac/iam",
    label: "IAM & Least-Privilege Security",
    description: "Service accounts, roles, and why a service should only ever be able to do what it actually needs to.",
    live: true,
  },
];

export default function IacPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "IaC" }]} />
      <h1 className="text-2xl font-semibold mb-1">Infrastructure as Code</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Provisioning the cloud infrastructure everything else runs on — as reviewable,
        versioned, reproducible code, not manual clicks. Terraform is this module&rsquo;s deep-dive
        representative example.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {UNITS.map((u) =>
          u.live ? (
            <Link
              key={u.href}
              href={u.href}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors"
            >
              <div className="font-medium text-neutral-900">{u.label}</div>
              <p className="text-base text-neutral-600 mt-1">{u.description}</p>
            </Link>
          ) : (
            <div key={u.href} className="rounded-lg border border-dashed border-neutral-200 p-4">
              <div className="flex items-center gap-2">
                <div className="font-medium text-neutral-500">{u.label}</div>
                <span className="text-sm uppercase tracking-wide text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
                  Coming soon
                </span>
              </div>
              <p className="text-base text-neutral-400 mt-1">{u.description}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
