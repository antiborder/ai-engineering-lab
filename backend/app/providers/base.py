import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class ProviderResponse:
    """Minimum data every AIProvider call must capture (spec section 10)."""

    text: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    estimated_cost: float
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))


class AIProvider(ABC):
    """Vendor-neutral abstraction over chat-completion providers.

    Concrete providers (OpenAIProvider, AnthropicProvider, GeminiProvider,
    VLLMProvider) subclass this. MockProvider lets every module run with no
    API keys and no network calls, per spec section 35.
    """

    name: str

    @abstractmethod
    def _generate(self, model: str, prompt: str, system: str | None) -> tuple[str, int, int]:
        """Return (text, input_tokens, output_tokens)."""

    @abstractmethod
    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        ...

    def complete(self, model: str, prompt: str, system: str | None = None) -> ProviderResponse:
        start = time.perf_counter()
        text, input_tokens, output_tokens = self._generate(model, prompt, system)
        latency_ms = (time.perf_counter() - start) * 1000
        cost = self.estimate_cost(model, input_tokens, output_tokens)
        return ProviderResponse(
            text=text,
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            estimated_cost=cost,
        )
