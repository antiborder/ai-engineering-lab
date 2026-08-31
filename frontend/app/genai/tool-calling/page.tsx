import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCallingAgentsPlayground } from "@/features/genai/tool-calling/ToolCallingAgentsPlayground";

export const metadata = { title: "Tool Calling & Agents" };

export default function ToolCallingPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "Tool Calling & Agents" }]} />
      <h1 className="text-2xl font-semibold mb-1">Tool Calling & Agents</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Tool Calling is one round trip: the model decides whether a tool is needed, the tool
        runs, its result feeds back in, and the model answers. An Agent repeats that same round
        trip in a loop, with a plan on top — give it a goal, and it decides how many tool calls
        it needs, in what order. Requires the backend to be running.
      </p>
      <ToolCallingAgentsPlayground />
    </div>
  );
}
