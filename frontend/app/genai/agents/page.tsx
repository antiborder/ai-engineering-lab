import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AgentLab } from "@/features/genai/agents/AgentLab";

export const metadata = { title: "Agents — AI Engineering Lab" };

export default function AgentsPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "Agents" }]} />
      <h1 className="text-2xl font-semibold mb-1">Agents</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Give the agent a goal. It plans which tools it needs, runs them one at a time, and
        shows every observation along the way — no hidden reasoning, just the plan, the tool
        calls, and the result. Requires the backend to be running.
      </p>
      <AgentLab />
    </div>
  );
}
