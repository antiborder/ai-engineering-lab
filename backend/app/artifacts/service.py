from functools import lru_cache

from app.artifacts.repository import ArtifactRepository
from app.core.firestore import get_firestore_client


@lru_cache
def get_artifact_repository() -> ArtifactRepository:
    return ArtifactRepository(get_firestore_client())
