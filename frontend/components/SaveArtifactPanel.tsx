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
      <div className="rounded-md border border-emerald-800 bg-emerald-950/30 p-4 space-y-3">
        <p className="text-sm text-emerald-400">
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
              className="px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-200"
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
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-3 py-1.5 text-sm text-neutral-100"
          placeholder="Artifact name"
        />
        <button
          onClick={handleSave}
          disabled={saving || !name}
          className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-sm font-medium text-white whitespace-nowrap"
        >
          {saving ? "Saving…" : "Save as AI Artifact"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
