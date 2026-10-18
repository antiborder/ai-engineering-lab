import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import { mulberry32 } from "@/lib/random";

type Schema = Record<string, unknown>;

// Small set of realistic-looking sample strings so generated output reads
// as plausible content, not "sample-<key>" placeholders everywhere.
const SAMPLE_STRINGS = ["Alex Rivera", "north wind", "invoice #4471", "pending review", "widget-pro"];

function choice<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

function mockValueForSchema(schema: Schema, rng: () => number): unknown {
  if (Array.isArray(schema.enum)) return choice(rng, schema.enum);

  switch (schema.type) {
    case "string":
      return choice(rng, SAMPLE_STRINGS);
    case "number":
    case "integer":
      return randInt(rng, 1, 100);
    case "boolean":
      return rng() < 0.5;
    case "array": {
      const itemSchema = (schema.items as Schema | undefined) ?? { type: "string" };
      return Array.from({ length: randInt(rng, 1, 3) }, () => mockValueForSchema(itemSchema, rng));
    }
    case "object":
      return mockObjectForSchema(schema, rng);
    default:
      return null;
  }
}

function mockObjectForSchema(schema: Schema, rng: () => number): Record<string, unknown> {
  const properties = (schema.properties as Record<string, Schema> | undefined) ?? {};
  return Object.fromEntries(Object.entries(properties).map(([key, sub]) => [key, mockValueForSchema(sub, rng)]));
}

/** Fabricates a JSON object matching `schema`'s shape (not real
 * extraction — spec 12.3 is about the NL -> schema -> validation pipeline,
 * not model quality). `breakSchema` deliberately corrupts one field's
 * type so the validation step has something real to catch. */
export function generateStructuredOutput(schema: Schema, seed: number, breakSchema: boolean): Record<string, unknown> {
  const result = mockObjectForSchema(schema, mulberry32(seed));
  const firstKey = Object.keys(result)[0];
  if (breakSchema && firstKey !== undefined) {
    result[firstKey] = { unexpected: "wrong-shape" };
  }
  return result;
}

/** Python-style repr, so validation messages read the same way the
 * common Python validator (`jsonschema`) prints them. */
function pyRepr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "string") return `'${value}'`;
  if (Array.isArray(value)) return `[${value.map(pyRepr).join(", ")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value).map(([k, v]) => `'${k}': ${pyRepr(v)}`).join(", ")}}`;
  }
  return String(value);
}

function formatError(e: ErrorObject): string {
  const path = e.instancePath.replace(/^\//, "").replaceAll("/", ".") || "(root)";
  switch (e.keyword) {
    case "type": {
      const types = ([] as string[]).concat(e.params.type as string | string[]);
      return `${path}: ${pyRepr(e.data)} is not of type ${types.map((t) => `'${t}'`).join(", ")}`;
    }
    case "enum":
      return `${path}: ${pyRepr(e.data)} is not one of ${pyRepr(e.params.allowedValues)}`;
    case "required":
      return `${path}: '${e.params.missingProperty}' is a required property`;
    default:
      return `${path}: ${e.message ?? "is invalid"}`;
  }
}

export function validateAgainstSchema(instance: Record<string, unknown>, schema: Schema): string[] {
  const ajv = new Ajv2020({ allErrors: true, strict: false, verbose: true });
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    return [`(schema): ${err instanceof Error ? err.message : "invalid JSON Schema"}`];
  }
  return validate(instance) ? [] : (validate.errors ?? []).map(formatError);
}
