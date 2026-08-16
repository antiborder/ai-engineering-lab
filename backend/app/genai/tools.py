import ast
import operator
import re

_MATH_RE = re.compile(r"-?\d+(\.\d+)?\s*[-+*/]\s*-?\d+(\.\d+)?(\s*[-+*/]\s*-?\d+(\.\d+)?)*")
_PERCENT_RE = re.compile(r"\d+(?:\.\d+)?\s*%\s*of\s*\d+(?:\.\d+)?")
# City capture is bounded to 1-2 words and stops at " and"/punctuation/end —
# unbounded `[a-zA-Z ]*` would greedily swallow the rest of a multi-clause
# message (e.g. "weather in Tokyo and what is ..." must not capture
# "Tokyo and what is" as the city).
_WEATHER_RE = re.compile(r"weather\s+(?:in|for)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)(?=\s+and\b|[?.!,]|$)")
_SEARCH_TRIGGERS = ["search", "find", "look up", "what is", "who is", "tell me about"]

_SAFE_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.USub: operator.neg,
}


def _safe_eval(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, int | float):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _SAFE_OPS:
        return _SAFE_OPS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _SAFE_OPS:
        return _SAFE_OPS[type(node.op)](_safe_eval(node.operand))
    raise ValueError("unsupported expression")


def calculator_tool(expression: str) -> str:
    """Evaluates arithmetic via an AST allowlist — not Python's `eval`,
    which would execute arbitrary code from user input (spec section 39:
    no arbitrary user-code execution)."""
    percent_match = re.search(r"(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)", expression)
    if percent_match:
        pct, base = (float(g) for g in percent_match.groups())
        return str((pct / 100) * base)
    try:
        tree = ast.parse(expression, mode="eval")
        result = _safe_eval(tree.body)
        return str(result)
    except (SyntaxError, ValueError, TypeError, ZeroDivisionError):
        return f"error: could not evaluate '{expression}'"


_WEATHER_CONDITIONS = ["sunny", "cloudy", "rainy", "windy", "snowy"]


def weather_tool(city: str) -> str:
    """Deterministic fake weather, seeded by city name — no external API
    call, consistent with Phase 1's no-cloud-dependency requirement."""
    seed = sum(ord(c) for c in city.lower())
    condition = _WEATHER_CONDITIONS[seed % len(_WEATHER_CONDITIONS)]
    temp_c = 5 + (seed % 30)
    return f"{city.strip().title()}: {condition}, {temp_c}°C"


def search_tool(query: str, documents: list) -> str:
    """Searches the RAG lab's document corpus via the same TF-IDF retrieval
    used there — a real (if simple) search, not a fabricated result."""
    from app.genai.rag import TfidfIndex, chunk_document, retrieve

    chunks = [c for doc in documents for c in chunk_document(doc, chunk_size=60, overlap=10)]
    if not chunks:
        return "no documents available to search"
    index = TfidfIndex(chunks)
    results = retrieve(index, query, pool_size=1, similarity_threshold=0.0)
    if not results:
        return "no results found"
    r = results[0]
    return f"[{r.chunk.doc_title}] {r.chunk.text[:220]}"


ToolCall = tuple[str, dict[str, str]]


def plan_tool_calls(message: str) -> list[ToolCall]:
    """Stands in for an LLM's function-calling decision: a mock model can't
    actually reason about the message, so this pattern-matches the same
    kinds of triggers a real tool-calling model would learn (a math
    expression, "weather in <city>", a question). Order of checks matters
    for multi-tool messages (spec section 15's agent loop uses this to
    build a multi-step plan)."""
    calls: list[ToolCall] = []
    lower = message.lower()

    math_match = _MATH_RE.search(message) or _PERCENT_RE.search(message)
    if math_match:
        calls.append(("calculator", {"expression": math_match.group().strip()}))

    weather_match = _WEATHER_RE.search(lower)
    if weather_match:
        calls.append(("weather", {"city": weather_match.group(1).strip()}))

    if not weather_match and not math_match and any(t in lower for t in _SEARCH_TRIGGERS):
        calls.append(("search", {"query": message}))

    return calls


def execute_tool(name: str, args: dict[str, str], documents: list) -> str:
    if name == "calculator":
        return calculator_tool(args["expression"])
    if name == "weather":
        return weather_tool(args["city"])
    if name == "search":
        return search_tool(args["query"], documents)
    raise ValueError(f"unknown tool: {name}")
