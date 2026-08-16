import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ToolCallingLab } from "@/features/genai/tool-calling/ToolCallingLab";

export const metadata = { title: "Tool Calling — AI Engineering Lab" };

export default function ToolCallingPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "Tool Calling" }]} />
      <h1 className="text-2xl font-semibold mb-1">Tool Calling</h1>
      <p className="text-neutral-400 mb-8 max-w-2xl">
        Send a message and watch the full round trip: the model decides whether a tool is
        needed, the tool runs, and its result is fed back in before the final answer. Requires
        the backend to be running.
      </p>
      <ToolCallingLab />
    </div>
  );
}
