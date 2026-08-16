import random
from typing import Any

from jsonschema import Draft202012Validator

# Small set of realistic-looking sample strings so generated output reads
# as plausible content, not "sample-<key>" placeholders everywhere.
_SAMPLE_STRINGS = ["Alex Rivera", "north wind", "invoice #4471", "pending review", "widget-pro"]


def _mock_value_for_schema(schema: dict[str, Any], seed_key: str, rng: random.Random) -> Any:
    if "enum" in schema:
        return rng.choice(schema["enum"])

    schema_type = schema.get("type")
    if schema_type == "string":
        return rng.choice(_SAMPLE_STRINGS)
    if schema_type in ("number", "integer"):
        value = rng.randint(1, 100)
        return float(value) if schema_type == "number" else value
    if schema_type == "boolean":
        return rng.choice([True, False])
    if schema_type == "array":
        item_schema = schema.get("items", {"type": "string"})
        return [_mock_value_for_schema(item_schema, f"{seed_key}-{i}", rng) for i in range(rng.randint(1, 3))]
    if schema_type == "object":
        return _mock_object_for_schema(schema, rng)
    return None


def _mock_object_for_schema(schema: dict[str, Any], rng: random.Random) -> dict[str, Any]:
    properties = schema.get("properties", {})
    return {key: _mock_value_for_schema(sub, key, rng) for key, sub in properties.items()}


def generate_structured_output(schema: dict[str, Any], seed: int, break_schema: bool) -> dict[str, Any]:
    """Fabricates a JSON object matching `schema`'s shape (not real
    extraction — spec 12.3 is about the NL -> schema -> validation pipeline,
    not model quality). `break_schema` deliberately corrupts one field's
    type so the validation step has something real to catch.
    """
    rng = random.Random(seed)
    result = _mock_object_for_schema(schema, rng)
    if break_schema and result:
        key = next(iter(result))
        result[key] = {"unexpected": "wrong-shape"}
    return result


def validate_against_schema(instance: dict[str, Any], schema: dict[str, Any]) -> list[str]:
    validator = Draft202012Validator(schema)
    errors = []
    for e in validator.iter_errors(instance):
        path = ".".join(str(p) for p in e.path) or "(root)"
        errors.append(f"{path}: {e.message}")
    return errors
