import { chunkDocument, retrieve, TfidfIndex, type Document } from "./rag";

const MATH_RE = /-?\d+(\.\d+)?\s*[-+*/]\s*-?\d+(\.\d+)?(\s*[-+*/]\s*-?\d+(\.\d+)?)*/;
const PERCENT_RE = /\d+(?:\.\d+)?\s*%\s*of\s*\d+(?:\.\d+)?/;
// City capture is bounded to 1-2 words and stops at " and"/punctuation/end —
// unbounded `[a-zA-Z ]*` would greedily swallow the rest of a multi-clause
// message (e.g. "weather in Tokyo and what is ..." must not capture
// "Tokyo and what is" as the city).
const WEATHER_RE = /weather\s+(?:in|for)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)(?=\s+and\b|[?.!,]|$)/;
const SEARCH_TRIGGERS = ["search", "find", "look up", "what is", "who is", "tell me about"];

/** A number plus whether it is a float, so results print the way
 * Python-style calculators do: `2 + 3` → "5", `12% of 850` → "102.0". */
interface CalcValue {
  value: number;
  isFloat: boolean;
}

function formatCalcValue({ value, isFloat }: CalcValue): string {
  if (!isFloat) return String(value);
  const abs = Math.abs(value);
  if (value !== 0 && (abs < 1e-4 || abs >= 1e16)) {
    // e.g. 1e-05, 1.5e+16
    return value.toExponential().replace(/e([+-])(\d)$/, "e$10$2");
  }
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

/** Recursive-descent parser over an allowlist of + - * / ( ) and unary
 * minus — never `eval`, which would execute arbitrary code from user
 * input (spec section 39: no arbitrary user-code execution). */
function evaluateArithmetic(expression: string): CalcValue {
  const tokens = expression.match(/\d+\.?\d*(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?|[-+*/()]|\S/gi) ?? [];
  let pos = 0;

  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr(): CalcValue {
    let left = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const right = parseTerm();
      left = { value: op === "+" ? left.value + right.value : left.value - right.value, isFloat: left.isFloat || right.isFloat };
    }
    return left;
  }

  function parseTerm(): CalcValue {
    let left = parseUnary();
    while (peek() === "*" || peek() === "/") {
      const op = next();
      const right = parseUnary();
      if (op === "*") {
        left = { value: left.value * right.value, isFloat: left.isFloat || right.isFloat };
      } else {
        if (right.value === 0) throw new Error("division by zero");
        left = { value: left.value / right.value, isFloat: true };
      }
    }
    return left;
  }

  function parseUnary(): CalcValue {
    if (peek() === "-") {
      next();
      const operand = parseUnary();
      return { value: -operand.value, isFloat: operand.isFloat };
    }
    return parseAtom();
  }

  function parseAtom(): CalcValue {
    const token = next();
    if (token === "(") {
      const inner = parseExpr();
      if (next() !== ")") throw new Error("unbalanced parentheses");
      return inner;
    }
    if (token !== undefined && /^(\d|\.\d)/.test(token)) {
      return { value: Number(token), isFloat: /[.e]/i.test(token) };
    }
    throw new Error("unsupported expression");
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error("unsupported expression");
  return result;
}

export function calculatorTool(expression: string): string {
  const percentMatch = expression.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/);
  if (percentMatch) {
    const pct = Number(percentMatch[1]);
    const base = Number(percentMatch[2]);
    return formatCalcValue({ value: (pct / 100) * base, isFloat: true });
  }
  try {
    return formatCalcValue(evaluateArithmetic(expression));
  } catch {
    return `error: could not evaluate '${expression}'`;
  }
}

const WEATHER_CONDITIONS = ["sunny", "cloudy", "rainy", "windy", "snowy"];

function titleCase(text: string): string {
  return text.toLowerCase().replace(/(^|[^a-z])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Deterministic fake weather, seeded by city name — no external API call. */
export function weatherTool(city: string): string {
  const seed = [...city.toLowerCase()].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const condition = WEATHER_CONDITIONS[seed % WEATHER_CONDITIONS.length];
  const tempC = 5 + (seed % 30);
  return `${titleCase(city.trim())}: ${condition}, ${tempC}°C`;
}

/** Searches the RAG lab's document corpus via the same TF-IDF retrieval
 * used there — a real (if simple) search, not a fabricated result. */
export function searchTool(query: string, documents: Document[]): string {
  const chunks = documents.flatMap((doc) => chunkDocument(doc, 2, 1));
  if (chunks.length === 0) return "no documents available to search";
  const results = retrieve(new TfidfIndex(chunks), query, 1, 0);
  if (results.length === 0) return "no results found";
  const r = results[0];
  return `[${r.chunk.doc_title}] ${r.chunk.text.slice(0, 220)}`;
}

export type ToolName = "calculator" | "weather" | "search";
export type ToolCall = [name: ToolName, args: Record<string, string>];

/** Stands in for an LLM's function-calling decision: a mock model can't
 * actually reason about the message, so this pattern-matches the same
 * kinds of triggers a real tool-calling model would learn (a math
 * expression, "weather in <city>", a question). Order of checks matters
 * for multi-tool messages (spec section 15's agent loop uses this to
 * build a multi-step plan). */
export function planToolCalls(message: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const lower = message.toLowerCase();

  const mathMatch = message.match(MATH_RE) ?? message.match(PERCENT_RE);
  if (mathMatch) calls.push(["calculator", { expression: mathMatch[0].trim() }]);

  const weatherMatch = lower.match(WEATHER_RE);
  if (weatherMatch) calls.push(["weather", { city: weatherMatch[1].trim() }]);

  if (!weatherMatch && !mathMatch && SEARCH_TRIGGERS.some((t) => lower.includes(t))) {
    calls.push(["search", { query: message }]);
  }
  return calls;
}

export function executeTool(name: ToolName, args: Record<string, string>, documents: Document[]): string {
  switch (name) {
    case "calculator":
      return calculatorTool(args.expression);
    case "weather":
      return weatherTool(args.city);
    case "search":
      return searchTool(args.query, documents);
  }
}
