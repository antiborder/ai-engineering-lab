import { newRequestId } from "@/lib/mock-provider";
import type { AIArtifact, AIArtifactWithVersions, ArtifactType, ArtifactVersion } from "@/types/artifact";

export interface CreateArtifactRequest {
  name: string;
  type: ArtifactType;
  configuration: Record<string, unknown>;
  model?: string;
  prompt_version?: string;
  dataset_version?: string;
  metadata?: Record<string, unknown>;
}

// Artifacts live in the visitor's own browser: an `artifacts` map keyed by
// id, each holding the artifact document plus its versions — the same
// document shape the spec's artifacts/{id}/versions model describes.
const STORAGE_KEY = "ai-playground:artifacts";

type Store = Record<string, AIArtifactWithVersions>;

let memoryStore: Store = {};

function readStore(): Store {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) memoryStore = JSON.parse(raw) as Store;
  } catch {
    // storage unavailable (private window, blocked site data) — use memory
  }
  return memoryStore;
}

function writeStore(store: Store): void {
  memoryStore = store;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // storage unavailable — the in-memory copy still works for this visit
  }
}

function newVersion(artifactId: string, label: string, data: CreateArtifactRequest, now: string): ArtifactVersion {
  return {
    id: newRequestId(),
    artifact_id: artifactId,
    version: label,
    configuration: data.configuration,
    model: data.model ?? null,
    prompt_version: data.prompt_version ?? null,
    dataset_version: data.dataset_version ?? null,
    created_at: now,
    metadata: data.metadata ?? {},
  };
}

export async function createArtifact(data: CreateArtifactRequest): Promise<AIArtifactWithVersions> {
  const id = newRequestId();
  const now = new Date().toISOString();
  const artifact: AIArtifact = {
    id,
    name: data.name,
    type: data.type,
    current_version: "v1",
    status: "draft",
    completed_stages: [],
    created_at: now,
    updated_at: now,
  };
  const entry = { artifact, versions: [newVersion(id, "v1", data, now)] };
  writeStore({ ...readStore(), [id]: entry });
  return entry;
}

export async function addArtifactVersion(artifactId: string, data: CreateArtifactRequest): Promise<ArtifactVersion> {
  const store = readStore();
  const entry = store[artifactId];
  if (!entry) throw new Error("artifact not found");
  const now = new Date().toISOString();
  const label = `v${entry.versions.length + 1}`;
  const version = newVersion(artifactId, label, data, now);
  writeStore({
    ...store,
    [artifactId]: {
      artifact: { ...entry.artifact, current_version: label, updated_at: now },
      versions: [...entry.versions, version],
    },
  });
  return version;
}

export async function getArtifact(artifactId: string): Promise<AIArtifactWithVersions> {
  const entry = readStore()[artifactId];
  if (!entry) throw new Error("artifact not found");
  return entry;
}

export async function listArtifacts(type?: ArtifactType): Promise<AIArtifact[]> {
  return Object.values(readStore())
    .map((e) => e.artifact)
    .filter((a) => !type || a.type === type);
}
