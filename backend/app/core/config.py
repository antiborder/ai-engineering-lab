from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration, sourced from environment variables / .env.

    Phase 1 (local) defaults keep everything mock/emulated so the app runs
    with zero cloud dependency and zero API keys, per spec section 35.
    """

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "local"

    # Firestore. When firestore_emulator_host is set, the google-cloud-firestore
    # client talks to the local emulator instead of real GCP.
    gcp_project_id: str = "ai-engineering-lab-dev"
    firestore_emulator_host: str | None = "localhost:8080"

    # AI providers. Real keys are opt-in; absence of a key means that
    # provider falls back to the mock provider (spec section 10).
    ai_provider_mode: str = "mock"  # "mock" | "live"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None

    # 3000 is Next.js's own default; 3100 is what this repo's docs tell you
    # to run it on locally, chosen to dodge other local dev servers that
    # tend to already be on 3000/3001 on a given machine.
    cors_allow_origins: list[str] = ["http://localhost:3000", "http://localhost:3100"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
