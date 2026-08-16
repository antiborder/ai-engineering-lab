import uuid

# These are integration tests against the local Firestore emulator
# (see docs/architecture/local-dev.md) — they require
# `firebase emulators:start --only firestore` running.


def _create_payload():
    return {
        "name": f"test-rag-{uuid.uuid4()}",
        "type": "rag",
        "configuration": {"chunk_size": 500, "top_k": 5},
        "model": "mock-small",
    }


def test_create_artifact_creates_v1(client):
    response = client.post("/api/artifacts", json=_create_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["artifact"]["current_version"] == "v1"
    assert len(body["versions"]) == 1
    assert body["versions"][0]["version"] == "v1"


def test_get_artifact_roundtrips(client):
    created = client.post("/api/artifacts", json=_create_payload()).json()
    artifact_id = created["artifact"]["id"]

    response = client.get(f"/api/artifacts/{artifact_id}")
    assert response.status_code == 200
    assert response.json()["artifact"]["id"] == artifact_id


def test_get_missing_artifact_404s(client):
    response = client.get(f"/api/artifacts/{uuid.uuid4()}")
    assert response.status_code == 404


def test_add_version_increments_and_updates_current(client):
    created = client.post("/api/artifacts", json=_create_payload()).json()
    artifact_id = created["artifact"]["id"]

    response = client.post(
        f"/api/artifacts/{artifact_id}/versions",
        json={
            "name": "unused",
            "type": "rag",
            "configuration": {"chunk_size": 300, "top_k": 3},
        },
    )
    assert response.status_code == 201
    assert response.json()["version"] == "v2"

    updated = client.get(f"/api/artifacts/{artifact_id}").json()
    assert updated["artifact"]["current_version"] == "v2"
    assert len(updated["versions"]) == 2


def test_list_artifacts_filters_by_type(client):
    client.post("/api/artifacts", json=_create_payload())
    response = client.get("/api/artifacts", params={"type": "rag"})
    assert response.status_code == 200
    assert all(a["type"] == "rag" for a in response.json())
