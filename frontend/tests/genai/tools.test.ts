import { describe, expect, it } from "vitest";
import { DEMO_DOCUMENTS } from "@/features/genai/engine/rag-corpus";
import { calculatorTool, planToolCalls, searchTool, weatherTool } from "@/features/genai/engine/tools";
import { runToolCalling } from "@/features/genai/engine/tool-calling";
import { runAgent } from "@/features/genai/engine/agent";

const docs = DEMO_DOCUMENTS.map(([title, text], i) => ({ id: String(i), title, text }));

describe("calculatorTool", () => {
  it("evaluates arithmetic", () => {
    expect(calculatorTool("2 + 3 * 4")).toBe("14");
  });

  it("prints division and percentages as floats", () => {
    expect(calculatorTool("7 / 2")).toBe("3.5");
    expect(calculatorTool("8 / 2")).toBe("4.0");
    expect(calculatorTool("12% of 850")).toBe("102.0");
  });

  it("rejects unsupported syntax instead of executing it", () => {
    expect(calculatorTool("__import__('os').system('echo hi')").startsWith("error:")).toBe(true);
    expect(calculatorTool("2 ** 3").startsWith("error:")).toBe(true);
    expect(calculatorTool("1 / 0").startsWith("error:")).toBe(true);
  });
});

describe("weatherTool", () => {
  it("is deterministic", () => {
    expect(weatherTool("Tokyo")).toBe(weatherTool("Tokyo"));
  });
});

describe("searchTool", () => {
  it("finds the relevant document", () => {
    expect(searchTool("sourdough starter", docs)).toContain("Sourdough Bread");
  });
});

describe("planToolCalls", () => {
  it("detects math", () => {
    expect(planToolCalls("what is 12 * 7")[0][0]).toBe("calculator");
  });

  it("detects weather", () => {
    expect(planToolCalls("what's the weather in Paris")[0]).toEqual(["weather", { city: "paris" }]);
  });

  it("stops the city before a trailing clause", () => {
    const calls = planToolCalls("what is the weather in Tokyo and what is 10 + 5");
    expect(calls.find((c) => c[0] === "weather")).toEqual(["weather", { city: "tokyo" }]);
  });

  it("detects percent-of phrasing", () => {
    expect(planToolCalls("what is 12% of 850")[0]).toEqual(["calculator", { expression: "12% of 850" }]);
  });

  it("detects search", () => {
    expect(planToolCalls("tell me about coffee brewing")[0][0]).toBe("search");
  });

  it("returns nothing for plain chat", () => {
    expect(planToolCalls("hello, how are you?")).toEqual([]);
  });
});

// The Tool Calling and Agents walkthroughs print these exact outputs as
// "real computed output", so the engine must keep producing them.
describe("walkthrough examples", () => {
  it("matches the Tool Calling walkthrough", () => {
    expect(calculatorTool("15% of 240")).toBe("36.0");
    expect(weatherTool("berlin")).toBe("Berlin: cloudy, 11°C");
    expect(searchTool("tell me about mount everest", docs)).toMatch(
      /^\[Mount Everest\] Mount Everest, on the border of Nepal and Tibet, is Earth's highest mountain/
    );
  });

  it("matches the Agents walkthrough", async () => {
    const trace = await runAgent("what is the weather in Tokyo and what is 12% of 850", docs, "mock-small");
    expect(trace.plan).toEqual(["calculator(expression=12% of 850)", "weather(city=tokyo)"]);
    expect(trace.steps.map((s) => s.observation)).toEqual(["102.0", "Tokyo: cloudy, 31°C"]);
  });
});

describe("runToolCalling", () => {
  it("uses the calculator for math", async () => {
    const trace = await runToolCalling("what is 6 * 7", docs, "mock-small");
    expect(trace.tool_name).toBe("calculator");
    expect(trace.tool_result).toBe("42");
    expect(trace.answer).toBeTruthy();
  });

  it("skips tools for plain chat", async () => {
    const trace = await runToolCalling("hello there", docs, "mock-small");
    expect(trace.tool_name).toBeNull();
    expect(trace.answer).toBeTruthy();
  });
});
