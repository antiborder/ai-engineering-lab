import os
from functools import lru_cache

from google.cloud import firestore

from app.core.config import get_settings


@lru_cache
def get_firestore_client() -> firestore.Client:
    """Return a Firestore client.

    In local dev, FIRESTORE_EMULATOR_HOST points the google-cloud-firestore
    SDK at the local emulator instead of real GCP (spec section 35/36 — the
    same client code is reused unchanged against production Firestore in
    Phase 2).
    """
    settings = get_settings()
    if settings.firestore_emulator_host:
        os.environ["FIRESTORE_EMULATOR_HOST"] = settings.firestore_emulator_host
    return firestore.Client(project=settings.gcp_project_id)
