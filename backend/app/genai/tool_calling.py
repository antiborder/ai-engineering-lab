from dataclasses import dataclass

from app.genai.rag import Document
from app.genai.tools import execute_tool, plan_tool_calls
from app.providers.factory import get_provider


@dataclass
class ToolCallTrace:
    """User -> LLM -> Tool Selection -> Tool Execution -> Tool Result -> LLM
    -> Answer (spec section 14)."""

    message: str
    tool_name: str | None
    tool_args: dict[str, str] | None
    tool_result: str | None
    answer: str
    model: str


def run_tool_calling(message: str, documents: list[Document], model: str) -> ToolCallTrace:
    calls = plan_tool_calls(message)
    provider = get_provider()

    if not calls:
        completion = provider.complete(model, message, system="Answer directly; no tool is needed.")
        return ToolCallTrace(
            message=message, tool_name=None, tool_args=None, tool_result=None,
            answer=completion.text, model=completion.model,
        )

    name, args = calls[0]
    result = execute_tool(name, args, documents)
    prompt = (
        f"User asked: {message}\nTool `{name}` returned: {result}\n"
        "Answer the user's question using this result."
    )
    completion = provider.complete(model, prompt, system="You are a helpful assistant with tool access.")
    return ToolCallTrace(
        message=message, tool_name=name, tool_args=args, tool_result=result,
        answer=completion.text, model=completion.model,
    )
