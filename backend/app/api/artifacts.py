from fastapi import APIRouter, Depends, HTTPException

from app.artifacts.repository import ArtifactRepository
from app.artifacts.service import get_artifact_repository
from app.models.artifact import (
    AIArtifact,
    AIArtifactCreate,
    AIArtifactWithVersions,
    ArtifactVersion,
)

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.post("", response_model=AIArtifactWithVersions, status_code=201)
def create_artifact(
    data: AIArtifactCreate,
    repo: ArtifactRepository = Depends(get_artifact_repository),
) -> AIArtifactWithVersions:
    artifact, version = repo.create(data)
    return AIArtifactWithVersions(artifact=artifact, versions=[version])


@router.get("", response_model=list[AIArtifact])
def list_artifacts(
    type: str | None = None,
    repo: ArtifactRepository = Depends(get_artifact_repository),
) -> list[AIArtifact]:
    return repo.list_all(artifact_type=type)


@router.get("/{artifact_id}", response_model=AIArtifactWithVersions)
def get_artifact(
    artifact_id: str,
    repo: ArtifactRepository = Depends(get_artifact_repository),
) -> AIArtifactWithVersions:
    artifact = repo.get(artifact_id)
    if artifact is None:
        raise HTTPException(status_code=404, detail="artifact not found")
    versions = repo.list_versions(artifact_id)
    return AIArtifactWithVersions(artifact=artifact, versions=versions)


@router.post("/{artifact_id}/versions", response_model=ArtifactVersion, status_code=201)
def create_version(
    artifact_id: str,
    data: AIArtifactCreate,
    repo: ArtifactRepository = Depends(get_artifact_repository),
) -> ArtifactVersion:
    try:
        _, version = repo.add_version(artifact_id, data)
    except KeyError:
        raise HTTPException(status_code=404, detail="artifact not found") from None
    return version
