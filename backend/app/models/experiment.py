from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class ExperimentStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Experiment(BaseModel):
    """Shared experiment model (spec section 7) — lets one module's runs be
    consumed by another, e.g. an inference benchmark informing LLMOps."""

    id: str
    artifact_id: str | None = None
    artifact_version: str | None = None
    module: str
    model: str | None = None
    prompt: str | None = None
    dataset: str | None = None
    configuration: dict[str, Any] = Field(default_factory=dict)
    metrics: dict[str, float] = Field(default_factory=dict)
    latency_ms: float | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    estimated_cost: float | None = None
    status: ExperimentStatus = ExperimentStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
