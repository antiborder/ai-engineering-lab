from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ArtifactType(StrEnum):
    """AIArtifact.type — spec section 6."""

    RAG = "rag"
    AGENT = "agent"
    WORKFLOW = "workflow"
    PROMPT = "prompt"
    INFERENCE_CONFIGURATION = "inference_configuration"


class ArtifactStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    DEPLOYED = "deployed"
    ARCHIVED = "archived"


class LifecycleStage(StrEnum):
    """The Build -> Evaluate -> Optimize -> Deploy -> Monitor lifecycle
    (spec section 1/5) that every artifact version progresses through."""

    BUILD = "build"
    EVALUATE = "evaluate"
    OPTIMIZE = "optimize"
    DEPLOY = "deploy"
    MONITOR = "monitor"


class AIArtifact(BaseModel):
    """The object shared across all five modules (spec section 2)."""

    id: str
    name: str
    type: ArtifactType
    current_version: str
    status: ArtifactStatus = ArtifactStatus.DRAFT
    completed_stages: list[LifecycleStage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ArtifactVersion(BaseModel):
    """A reproducible configuration snapshot of an AIArtifact (spec section 6)."""

    id: str
    artifact_id: str
    version: str
    configuration: dict[str, Any] = Field(default_factory=dict)
    model: str | None = None
    prompt_version: str | None = None
    dataset_version: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    metadata: dict[str, Any] = Field(default_factory=dict)


class AIArtifactCreate(BaseModel):
    name: str
    type: ArtifactType
    configuration: dict[str, Any] = Field(default_factory=dict)
    model: str | None = None
    prompt_version: str | None = None
    dataset_version: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AIArtifactWithVersions(BaseModel):
    artifact: AIArtifact
    versions: list[ArtifactVersion]
