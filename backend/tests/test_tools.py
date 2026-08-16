from app.genai.rag_session import RagSession
from app.genai.tools import calculator_tool, plan_tool_calls, search_tool, weather_tool


def test_calculator_tool_evaluates_arithmetic():
    assert calculator_tool("2 + 3 * 4") == "14"


def test_calculator_tool_rejects_unsupported_syntax():
    result = calculator_tool("__import__('os').system('echo hi')")
    assert result.startswith("error:")


def test_weather_tool_is_deterministic():
    assert weather_tool("Tokyo") == weather_tool("Tokyo")


def test_search_tool_finds_relevant_document():
    session = RagSession()
    result = search_tool("sourdough starter", session.list_documents())
    assert "Sourdough Bread" in result


def test_plan_tool_calls_detects_math():
    calls = plan_tool_calls("what is 12 * 7")
    assert calls[0][0] == "calculator"


def test_plan_tool_calls_detects_weather():
    calls = plan_tool_calls("what's the weather in Paris")
    assert calls[0] == ("weather", {"city": "paris"})


def test_plan_tool_calls_city_extraction_stops_before_trailing_clause():
    # Regression: the city capture used to be unbounded and would swallow
    # everything up to the next digit, e.g. "tokyo and what is" instead of
    # just "tokyo".
    calls = plan_tool_calls("what is the weather in Tokyo and what is 10 + 5")
    weather_call = next(c for c in calls if c[0] == "weather")
    assert weather_call == ("weather", {"city": "tokyo"})


def test_plan_tool_calls_detects_percent_of_phrasing():
    calls = plan_tool_calls("what is 12% of 850")
    assert calls[0] == ("calculator", {"expression": "12% of 850"})


def test_calculator_tool_evaluates_percent_of_phrasing():
    assert calculator_tool("12% of 850") == "102.0"


def test_plan_tool_calls_detects_search():
    calls = plan_tool_calls("tell me about coffee brewing")
    assert calls[0][0] == "search"


def test_plan_tool_calls_returns_empty_for_plain_chat():
    assert plan_tool_calls("hello, how are you?") == []
