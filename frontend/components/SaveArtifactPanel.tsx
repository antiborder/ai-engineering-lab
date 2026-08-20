"use client";

import { useState } from "react";
import Link from "next/link";
import { createArtifact } from "@/lib/artifacts-api";
import type { ArtifactType } from "@/types/artifact";

interface SavedArtifact {
  id: string;
  name: string;
  version: string;
}

/** [Save as AI Artifact] -> [Evaluate] [Optimize] [Deploy] [Monitor]
 * (spec section 17). The saved artifact's id/name/version are passed
 * through the URL so the target module can pick it up and show it as
 * already selected (spec section 3.3 — artifact navigation must preserve
 * context, not just open the generic module homepage). */
export function SaveArtifactPanel({
  type,
  defaultName,
  configuration,
  model,
}: {
  type: ArtifactType;
  defaultName: string;
  configuration: Record<string, unknown>;
  model?: string;
}) {
  const [name, setName] = useState(defaultName);
  const [saved, setSaved] = useState<SavedArtifact | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await createArtifact({ name, type, configuration, model });
      setSaved({ id: res.artifact.id, name: res.artifact.name, version: res.artifact.current_version });
    } catch {
      setError("Could not save artifact — is the backend + Firestore emulator running?");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    const params = new URLSearchParams({
      artifactId: saved.id,
      artifactName: saved.name,
      artifactVersion: saved.version,
    }).toString();

    return (
      <div className="rounded-md border border-emerald-300 bg-emerald-50 p-4 space-y-3">
        <p className="text-sm text-emerald-700">
          Saved as AI Artifact: <span className="font-mono">{saved.name} {saved.version}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Evaluate", href: `/evaluation?${params}` },
            { label: "Optimize", href: `/inference?${params}` },
            { label: "Deploy", href: `/llmops?${params}` },
            { label: "View monitoring", href: `/llmops?${params}&view=monitor` },
          ].map((btn) => (
            <Link
              key={btn.label}
              href={btn.href}
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-sm text-neutral-800"
            >
              {btn.label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-sm text-neutral-900"
          placeholder="Artifact name"
        />
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-sm font-medium text-white whitespace-nowrap"
        >
          {saving ? "Saving…" : "Save as AI Artifact"}
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
