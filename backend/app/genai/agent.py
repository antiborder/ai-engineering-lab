from dataclasses import dataclass

from app.genai.rag import Document
from app.genai.tools import execute_tool, plan_tool_calls
from app.providers.factory import get_provider

MAX_STEPS = 5


@dataclass
class AgentStep:
    step: int
    tool_name: str
    tool_args: dict[str, str]
    observation: str
    failed: bool
    retried: bool


@dataclass
class AgentTrace:
    """Goal -> Plan -> Tool -> Observation -> Next Action -> ... -> Final
    Answer (spec section 15). No private chain-of-thought is exposed —
    only the plan, each tool call, and its observation."""

    goal: str
    plan: list[str]
    steps: list[AgentStep]
    final_answer: str
    model: str


def run_agent(goal: str, documents: list[Document], model: str) -> AgentTrace:
    calls = plan_tool_calls(goal)[:MAX_STEPS]
    plan = [f"{name}({', '.join(f'{k}={v}' for k, v in args.items())})" for name, args in calls]

    steps: list[AgentStep] = []
    for i, (name, args) in enumerate(calls, start=1):
        observation = execute_tool(name, args, documents)
        failed = observation.startswith(("error:", "no "))
        retried = False
        if failed:
            retried = True
            retry_observation = execute_tool(name, args, documents)
            if not retry_observation.startswith("error:"):
                observation = retry_observation
                failed = False
        steps.append(
            AgentStep(step=i, tool_name=name, tool_args=args, observation=observation, failed=failed, retried=retried)
        )

    observations_text = (
        "\n".join(f"- {s.tool_name}: {s.observation}" for s in steps) if steps else "(no tools were needed)"
    )
    provider = get_provider()
    prompt = f"Goal: {goal}\n\nObservations:\n{observations_text}\n\nGive a final answer to the goal using the observations."
    completion = provider.complete(model, prompt, system="You are an agent completing a multi-step goal.")

    return AgentTrace(goal=goal, plan=plan, steps=steps, final_answer=completion.text, model=completion.model)
