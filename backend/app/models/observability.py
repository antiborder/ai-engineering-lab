from datetime import UTC, datetime

from pydantic import BaseModel, Field


class ObservabilityEvent(BaseModel):
    """Structured telemetry emitted by every AI operation (spec section 9).
    Consumed by the LLMOps module for tracing, monitoring and cost tracking."""

    trace_id: str
    request_id: str
    artifact_id: str | None = None
    artifact_version: str | None = None
    module: str
    operation: str
    model: str | None = None
    latency_ms: float | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    cost: float | None = None
    status: str = "ok"
    error: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
