import hashlib
import random
import time

from app.providers.base import AIProvider

# Fabricated but stable per-model pricing so mock cost estimates behave
# consistently (same shape as real per-token pricing) without any real spend.
_MOCK_PRICING_PER_1K_TOKENS = {
    "mock-small": (0.0001, 0.0002),
    "mock-large": (0.0010, 0.0020),
}


class MockProvider(AIProvider):
    """Deterministic, network-free stand-in for a real LLM provider.

    Used for every module until real API keys are configured (spec
    section 10/35). Output is a hash-seeded pseudo-response so the same
    prompt+model always produces the same tokens/latency, which keeps demos
    and tests reproducible.
    """

    name = "mock"

    def _generate(self, model: str, prompt: str, system: str | None) -> tuple[str, int, int]:
        seed = int(hashlib.sha256(f"{model}:{system}:{prompt}".encode()).hexdigest(), 16)
        rng = random.Random(seed)

        # simulate network + generation latency
        time.sleep(min(0.05 + len(prompt) * 0.0005, 0.4))

        input_tokens = max(1, len(prompt.split()))
        output_tokens = rng.randint(20, 120)
        text = (
            f"[mock:{model}] This is a simulated response to your prompt "
            f"(\"{prompt[:60]}{'...' if len(prompt) > 60 else ''}\"). "
            "Configure a real provider API key to replace this with a live model call."
        )
        return text, input_tokens, output_tokens

    def estimate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        in_price, out_price = _MOCK_PRICING_PER_1K_TOKENS.get(
            model, _MOCK_PRICING_PER_1K_TOKENS["mock-small"]
        )
        return round((input_tokens / 1000) * in_price + (output_tokens / 1000) * out_price, 6)
