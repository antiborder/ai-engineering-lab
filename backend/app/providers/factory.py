from functools import lru_cache

from app.core.config import get_settings
from app.providers.base import AIProvider
from app.providers.mock import MockProvider


@lru_cache
def get_provider(name: str = "mock") -> AIProvider:
    """Resolve a provider by name.

    Real providers (OpenAI/Anthropic/Gemini) are added here once API keys
    are configured; until then every name falls back to MockProvider so the
    app runs with zero external dependencies (spec section 35).
    """
    settings = get_settings()
    if settings.ai_provider_mode == "mock":
        return MockProvider()

    # Placeholder for live mode: real providers are registered here as they
    # are implemented (OpenAIProvider, AnthropicProvider, GeminiProvider).
    return MockProvider()
