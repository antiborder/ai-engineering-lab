from app.genai.agent import run_agent
from app.genai.rag_session import RagSession
from app.genai.tool_calling import run_tool_calling


def test_run_tool_calling_uses_calculator_for_math():
    session = RagSession()
    trace = run_tool_calling("what is 6 * 7", session.list_documents(), "mock-small")
    assert trace.tool_name == "calculator"
    assert trace.tool_result == "42"
    assert trace.answer


def test_run_tool_calling_skips_tool_for_plain_chat():
    session = RagSession()
    trace = run_tool_calling("hello there", session.list_documents(), "mock-small")
    assert trace.tool_name is None
    assert trace.tool_result is None
    assert trace.answer


def test_run_agent_builds_multi_step_plan():
    session = RagSession()
    trace = run_agent(
        "what is the weather in Tokyo and what is 10 + 5", session.list_documents(), "mock-small"
    )
    assert len(trace.plan) == 2
    assert {s.tool_name for s in trace.steps} == {"weather", "calculator"}
    assert all(not s.failed for s in trace.steps)
    assert trace.final_answer


def test_run_agent_handles_no_applicable_tools():
    session = RagSession()
    trace = run_agent("just say hello", session.list_documents(), "mock-small")
    assert trace.plan == []
    assert trace.steps == []
    assert trace.final_answer


def test_api_tool_call_and_agent_run(client):
    tool_response = client.post("/api/genai/tools/call", json={"message": "what is 3 + 4"})
    assert tool_response.status_code == 200
    assert tool_response.json()["tool_result"] == "7"

    agent_response = client.post(
        "/api/genai/agent/run", json={"goal": "search for cat behavior and compute 2 * 2"}
    )
    assert agent_response.status_code == 200
    body = agent_response.json()
    assert len(body["plan"]) >= 1
    assert body["final_answer"]
