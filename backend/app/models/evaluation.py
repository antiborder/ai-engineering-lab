from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class EvaluationRun(BaseModel):
    """Shared evaluation model (spec section 8). Results are usable by
    LLMOps deployment gates (score >= threshold -> deploy)."""

    id: str
    artifact_id: str
    artifact_version: str
    dataset: str
    evaluator: str
    metrics: dict[str, float] = Field(default_factory=dict)
    score: float
    failures: list[dict[str, Any]] = Field(default_factory=list)
    latency_ms: float | None = None
    cost: float | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
