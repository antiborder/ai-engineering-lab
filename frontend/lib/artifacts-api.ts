import { apiGet, apiPost } from "@/lib/api";
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

export function createArtifact(data: CreateArtifactRequest) {
  return apiPost<AIArtifactWithVersions>("/api/artifacts", data);
}

export function addArtifactVersion(artifactId: string, data: CreateArtifactRequest) {
  return apiPost<ArtifactVersion>(`/api/artifacts/${artifactId}/versions`, data);
}

export function getArtifact(artifactId: string) {
  return apiGet<AIArtifactWithVersions>(`/api/artifacts/${artifactId}`);
}

export function listArtifacts(type?: ArtifactType) {
  const query = type ? `?type=${type}` : "";
  return apiGet<AIArtifact[]>(`/api/artifacts${query}`);
}
