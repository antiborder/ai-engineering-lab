from app.genai.structured_output import generate_structured_output, validate_against_schema

SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"},
        "active": {"type": "boolean"},
        "role": {"type": "string", "enum": ["admin", "member"]},
    },
    "required": ["name", "age", "active", "role"],
}


def test_generated_output_is_deterministic_for_same_seed():
    a = generate_structured_output(SCHEMA, seed=1, break_schema=False)
    b = generate_structured_output(SCHEMA, seed=1, break_schema=False)
    assert a == b


def test_generated_output_validates_against_its_own_schema():
    output = generate_structured_output(SCHEMA, seed=2, break_schema=False)
    errors = validate_against_schema(output, SCHEMA)
    assert errors == []


def test_generated_output_respects_enum_constraint():
    output = generate_structured_output(SCHEMA, seed=3, break_schema=False)
    assert output["role"] in ("admin", "member")


def test_break_schema_produces_a_validation_error():
    output = generate_structured_output(SCHEMA, seed=1, break_schema=True)
    errors = validate_against_schema(output, SCHEMA)
    assert len(errors) > 0


def test_api_structured_output_roundtrip(client):
    response = client.post(
        "/api/genai/structured-output/generate",
        json={"json_schema": SCHEMA, "break_schema": False, "seed": 5},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is True
    assert body["errors"] == []

    broken = client.post(
        "/api/genai/structured-output/generate",
        json={"json_schema": SCHEMA, "break_schema": True, "seed": 5},
    )
    assert broken.json()["valid"] is False
