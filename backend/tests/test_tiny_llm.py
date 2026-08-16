from app.fundamentals.tiny_llm_session import TinyLlmConfig, TinyLlmSession

SMALL_CONFIG = TinyLlmConfig(n_layer=1, n_head=1, n_embd=8, block_size=16, lr=0.01)


def test_encode_decode_roundtrips():
    session = TinyLlmSession()
    text = "Alice was beginning"
    assert session.decode(session.encode(text)) == text


def test_reset_builds_a_model_matching_the_requested_config():
    session = TinyLlmSession()
    session.reset(SMALL_CONFIG)
    assert session.step == 0
    assert session.loss_history == []
    assert session.model is not None
    assert session.config.n_layer == 1
    assert session.config.n_embd == 8


def test_train_steps_reduces_loss_over_many_steps():
    session = TinyLlmSession()
    session.reset(SMALL_CONFIG)
    early_losses = session.train_steps(5)
    later_losses = session.train_steps(40)
    assert session.step == 45
    # Training is stochastic over tiny batches, so compare smoothed windows
    # rather than requiring strict monotonic decrease.
    assert sum(later_losses[-10:]) / 10 < sum(early_losses) / len(early_losses)


def test_generate_produces_requested_number_of_new_tokens():
    session = TinyLlmSession()
    session.reset(SMALL_CONFIG)
    text = session.generate("Alice", max_new_tokens=20, temperature=0.8)
    assert text.startswith("Alice")
    assert len(text) == len("Alice") + 20


def test_api_init_train_generate_roundtrip(client):
    init_response = client.post(
        "/api/fundamentals/tiny-llm/init",
        json={"n_layer": 1, "n_head": 1, "n_embd": 8, "block_size": 16, "lr": 0.01},
    )
    assert init_response.status_code == 200
    assert init_response.json()["step"] == 0

    train_response = client.post("/api/fundamentals/tiny-llm/train", json={"steps": 3})
    assert train_response.status_code == 200
    body = train_response.json()
    assert body["step"] == 3
    assert len(body["losses"]) == 3

    generate_response = client.post(
        "/api/fundamentals/tiny-llm/generate",
        json={"prompt": "Alice", "max_new_tokens": 10, "temperature": 0.8},
    )
    assert generate_response.status_code == 200
    assert len(generate_response.json()["text"]) == len("Alice") + 10
