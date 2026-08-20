import { Breadcrumbs } from "@/components/Breadcrumbs";

interface ArtifactContext {
  artifactId?: string;
  artifactName?: string;
  artifactVersion?: string;
}

export function ModulePlaceholder({
  label,
  href,
  tagline,
  purpose,
  artifact,
}: {
  label: string;
  href: string;
  tagline: string;
  purpose: string;
  artifact?: ArtifactContext;
}) {
  return (
    <div>
      <Breadcrumbs
        items={
          artifact?.artifactName
            ? [{ label, href }, { label: artifact.artifactName }]
            : [{ label }]
        }
      />
      <h1 className="text-2xl font-semibold mb-1">{label}</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">{tagline}</p>

      {artifact?.artifactName && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 max-w-2xl mb-4">
          <p className="text-sm text-cyan-700">
            Selected artifact: <span className="font-mono">{artifact.artifactName} {artifact.artifactVersion}</span>
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Artifact context was preserved from where you came from (spec section 3.3) — this
            module isn&rsquo;t built yet, but it already knows which artifact it would operate on.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-dashed border-neutral-200 p-6 max-w-2xl">
        <p className="text-sm text-neutral-600">{purpose}</p>
        <p className="text-sm text-neutral-500 mt-3">
          This module is not implemented yet. Development proceeds one module at a time,
          starting with Fundamentals — see{" "}
          <a href="/fundamentals" className="text-cyan-700 hover:underline">
            Fundamentals
          </a>{" "}
          for what is live today.
        </p>
      </div>
    </div>
  );
}
