export type ArtifactType = "rag" | "agent" | "workflow" | "prompt" | "inference_configuration";

export interface AIArtifact {
  id: string;
  name: string;
  type: ArtifactType;
  current_version: string;
  status: string;
  completed_stages: string[];
  created_at: string;
  updated_at: string;
}

export interface ArtifactVersion {
  id: string;
  artifact_id: string;
  version: string;
  configuration: Record<string, unknown>;
  model: string | null;
  prompt_version: string | null;
  dataset_version: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface AIArtifactWithVersions {
  artifact: AIArtifact;
  versions: ArtifactVersion[];
}
