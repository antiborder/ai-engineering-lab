import { describe, expect, it } from "vitest";
import { generateStructuredOutput, validateAgainstSchema } from "@/features/genai/engine/structured-output";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "integer" },
    active: { type: "boolean" },
    role: { type: "string", enum: ["admin", "member"] },
  },
  required: ["name", "age", "active", "role"],
};

describe("generateStructuredOutput", () => {
  it("is deterministic for the same seed", () => {
    expect(generateStructuredOutput(SCHEMA, 1, false)).toEqual(generateStructuredOutput(SCHEMA, 1, false));
  });

  it("validates against its own schema", () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(validateAgainstSchema(generateStructuredOutput(SCHEMA, seed, false), SCHEMA)).toEqual([]);
    }
  });

  it("respects the enum constraint", () => {
    expect(["admin", "member"]).toContain(generateStructuredOutput(SCHEMA, 3, false).role);
  });
});

describe("validateAgainstSchema", () => {
  it("catches a deliberately broken field, in the walkthrough's message format", () => {
    const errors = validateAgainstSchema(generateStructuredOutput(SCHEMA, 1, true), SCHEMA);
    expect(errors).toEqual(["name: {'unexpected': 'wrong-shape'} is not of type 'string'"]);
  });

  it("reports missing required properties at the root", () => {
    expect(validateAgainstSchema({ name: "x", age: 1, active: true }, SCHEMA)).toEqual([
      "(root): 'role' is a required property",
    ]);
  });

  it("reports an invalid schema instead of throwing", () => {
    const errors = validateAgainstSchema({}, { type: "not-a-type" });
    expect(errors).toHaveLength(1);
    expect(errors[0].startsWith("(schema):")).toBe(true);
  });
});
