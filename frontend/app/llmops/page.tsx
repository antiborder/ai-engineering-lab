import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SelectedArtifactBanner } from "@/components/SelectedArtifactBanner";

export const metadata = { title: "LLMOps" };

const UNITS = [
  {
    href: "/llmops/experiment-tracking",
    label: "Experiment Tracking",
    description: "What gets versioned, and comparing many saved versions of the same system, not just the latest two.",
    live: true,
  },
  {
    href: "/llmops/ci-cd",
    label: "CI/CD & Deployment",
    description: "Packaging a version, testing and gating it, and promoting it through Development, Staging, and Production.",
    live: true,
  },
  {
    href: "/llmops/monitoring",
    label: "Monitoring & Observability",
    description: "Watching a live system: an aggregate dashboard, tracing a single request, and cost at scale.",
    live: true,
  },
  {
    href: "/llmops/regression-rollback",
    label: "Regression & Rollback",
    description: "Catching a quality regression after a deploy, and reverting to a known-good version.",
    live: true,
  },
];

export default function LlmOpsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "LLMOps" }]} />
      <h1 className="text-2xl font-semibold mb-1">LLMOps</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Run it in production: tracking experiments, shipping a version, watching it run, and
        recovering when something breaks — operating on artifacts created and evaluated by the
        rest of this app.
      </p>

      <SelectedArtifactBanner />

      <div className="grid sm:grid-cols-2 gap-4">
        {UNITS.map((s) =>
          s.live ? (
            <Link
              key={s.href}
              href={s.href}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors"
            >
              <div className="font-medium text-neutral-900">{s.label}</div>
              <p className="text-base text-neutral-600 mt-1">{s.description}</p>
            </Link>
          ) : (
            <div
              key={s.href}
              className="rounded-lg border border-dashed border-neutral-200 p-4"
            >
              <div className="flex items-center gap-2">
                <div className="font-medium text-neutral-500">{s.label}</div>
                <span className="text-sm uppercase tracking-wide text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
                  Coming soon
                </span>
              </div>
              <p className="text-base text-neutral-400 mt-1">{s.description}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
