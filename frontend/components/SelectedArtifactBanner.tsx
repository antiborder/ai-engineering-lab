"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

/** Shows the artifact SaveArtifactPanel passed through the URL (spec
 * section 3.3 — artifact navigation must preserve context). Read on the
 * client so the module pages around it can still be prerendered as
 * static HTML. */
function Banner() {
  const params = useSearchParams();
  const artifactName = params.get("artifactName");
  const artifactVersion = params.get("artifactVersion");
  if (!artifactName) return null;

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 max-w-2xl mb-6">
      <p className="text-base text-cyan-700">
        Selected artifact: <span className="font-mono">{artifactName} {artifactVersion}</span>
      </p>
    </div>
  );
}

export function SelectedArtifactBanner() {
  return (
    <Suspense fallback={null}>
      <Banner />
    </Suspense>
  );
}
