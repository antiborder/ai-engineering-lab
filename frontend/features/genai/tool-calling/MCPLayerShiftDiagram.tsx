function Pill({ label, tone }: { label: string; tone: "cyan" | "orange" | "neutral" }) {
  const cls =
    tone === "cyan"
      ? "border-cyan-300 bg-cyan-50 text-cyan-800"
      : tone === "orange"
        ? "border-2 border-orange-400 bg-orange-50 text-orange-800 font-medium"
        : "border-neutral-300 bg-white text-neutral-600";
  return <div className={`px-2 py-1 rounded-md border text-xs text-center ${cls}`}>{label}</div>;
}

function Down() {
  return (
    <div className="text-neutral-300 leading-none" aria-hidden>
      ↓
    </div>
  );
}

/** The same adapter box (orange) drawn in two panels: on the client side
 * when there's no MCP server to hold it, on the server side once one
 * exists — so the diagram's whole point is that one box visibly relocating
 * between panels, not two unrelated pipelines. Each panel is split into a
 * "client side" and "server side" container, matching the two-lifeline
 * framing MCPSequenceDiagram already established. */
export function MCPLayerShiftDiagram() {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1 text-center">
          Without MCP
        </div>
        <div className="flex items-stretch gap-1.5">
          <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2 space-y-1">
            <div className="text-xs text-neutral-500 text-center mb-0.5">Client side (your app)</div>
            <Pill label="LLM" tone="cyan" />
            <Down />
            <Pill label="Tool Call" tone="cyan" />
            <Down />
            <Pill label="GitHub API adapter (hand-written)" tone="orange" />
          </div>
          <div className="flex items-center text-neutral-300 shrink-0">→</div>
          <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2 space-y-1">
            <div className="text-xs text-neutral-500 text-center mb-0.5">Server side</div>
            <div className="h-full flex items-center justify-center">
              <Pill label="GitHub API endpoint" tone="neutral" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center text-xs text-neutral-500">↓ the adapter box relocates</div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1 text-center">
          With MCP
        </div>
        <div className="flex items-stretch gap-1.5">
          <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2 space-y-1">
            <div className="text-xs text-neutral-500 text-center mb-0.5">Client side (your app)</div>
            <Pill label="LLM" tone="cyan" />
            <Down />
            <Pill label="Tool Call" tone="cyan" />
            <Down />
            <Pill label="MCP Client (generic)" tone="neutral" />
          </div>
          <div className="flex items-center text-neutral-300 shrink-0">→</div>
          <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-2 space-y-1">
            <div className="text-xs text-neutral-500 text-center mb-0.5">Server side</div>
            <Pill label="MCP Server (holds the GitHub adapter)" tone="orange" />
            <Down />
            <Pill label="GitHub API endpoint" tone="neutral" />
          </div>
        </div>
      </div>
    </div>
  );
}
