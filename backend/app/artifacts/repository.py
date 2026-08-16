import uuid
from datetime import UTC, datetime

from google.cloud.firestore import Client, FieldFilter

from app.models.artifact import AIArtifact, AIArtifactCreate, ArtifactStatus, ArtifactVersion

ARTIFACTS_COLLECTION = "artifacts"
VERSIONS_SUBCOLLECTION = "versions"


class ArtifactRepository:
    """Firestore-backed persistence for AIArtifact / ArtifactVersion.

    Documents live in `artifacts/{artifact_id}` with versions in the
    `versions` subcollection, mirroring the conceptual model in spec
    section 6. This is the only place that talks to Firestore for
    artifacts — callers go through ArtifactService.
    """

    def __init__(self, client: Client):
        self._client = client

    def create(self, data: AIArtifactCreate) -> tuple[AIArtifact, ArtifactVersion]:
        artifact_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())
        now = datetime.now(UTC)

        artifact = AIArtifact(
            id=artifact_id,
            name=data.name,
            type=data.type,
            current_version="v1",
            status=ArtifactStatus.DRAFT,
            created_at=now,
            updated_at=now,
        )
        version = ArtifactVersion(
            id=version_id,
            artifact_id=artifact_id,
            version="v1",
            configuration=data.configuration,
            model=data.model,
            prompt_version=data.prompt_version,
            dataset_version=data.dataset_version,
            created_at=now,
            metadata=data.metadata,
        )

        doc_ref = self._client.collection(ARTIFACTS_COLLECTION).document(artifact_id)
        doc_ref.set(artifact.model_dump(mode="json"))
        doc_ref.collection(VERSIONS_SUBCOLLECTION).document(version_id).set(
            version.model_dump(mode="json")
        )
        return artifact, version

    def add_version(
        self, artifact_id: str, data: AIArtifactCreate
    ) -> tuple[AIArtifact, ArtifactVersion]:
        artifact = self.get(artifact_id)
        if artifact is None:
            raise KeyError(artifact_id)

        existing = self.list_versions(artifact_id)
        next_number = len(existing) + 1
        version_label = f"v{next_number}"
        now = datetime.now(UTC)

        version = ArtifactVersion(
            id=str(uuid.uuid4()),
            artifact_id=artifact_id,
            version=version_label,
            configuration=data.configuration,
            model=data.model,
            prompt_version=data.prompt_version,
            dataset_version=data.dataset_version,
            created_at=now,
            metadata=data.metadata,
        )

        doc_ref = self._client.collection(ARTIFACTS_COLLECTION).document(artifact_id)
        doc_ref.collection(VERSIONS_SUBCOLLECTION).document(version.id).set(
            version.model_dump(mode="json")
        )
        doc_ref.update({"current_version": version_label, "updated_at": now.isoformat()})

        artifact.current_version = version_label
        artifact.updated_at = now
        return artifact, version

    def get(self, artifact_id: str) -> AIArtifact | None:
        snap = self._client.collection(ARTIFACTS_COLLECTION).document(artifact_id).get()
        if not snap.exists:
            return None
        return AIArtifact.model_validate(snap.to_dict())

    def list_all(self, artifact_type: str | None = None) -> list[AIArtifact]:
        query = self._client.collection(ARTIFACTS_COLLECTION)
        if artifact_type:
            query = query.where(filter=FieldFilter("type", "==", artifact_type))
        return [AIArtifact.model_validate(doc.to_dict()) for doc in query.stream()]

    def list_versions(self, artifact_id: str) -> list[ArtifactVersion]:
        docs = (
            self._client.collection(ARTIFACTS_COLLECTION)
            .document(artifact_id)
            .collection(VERSIONS_SUBCOLLECTION)
            .order_by("created_at")
            .stream()
        )
        return [ArtifactVersion.model_validate(doc.to_dict()) for doc in docs]

    def get_version(self, artifact_id: str, version: str) -> ArtifactVersion | None:
        for v in self.list_versions(artifact_id):
            if v.version == version:
                return v
        return None
