const CYAN = "#0891b2";
const PURPLE = "#7c3aed";
const NEUTRAL = "#a1a1aa";

interface Message {
  label: string;
  direction: "right" | "left";
}

const MESSAGES: Message[] = [
  { label: "what tools do you have?", direction: "right" },
  { label: "\"calendar\" — call it like this", direction: "left" },
  { label: "calendar(date=today)", direction: "right" },
  { label: "today's events: …", direction: "left" },
];

/** A real sequence diagram (two lifelines, arrows crossing between them
 * over time) for one concrete MCP exchange — discover, then call — as
 * opposed to MCPWiringDiagram's static "who connects to whom" shape. The
 * model itself never speaks MCP directly (per the real MCP architecture):
 * it decides *that* a tool is needed via ordinary tool calling, the
 * surrounding app is what actually talks to the MCP server, and the
 * result is handed back to the model afterward — both ends of that outer
 * exchange are called out in the two caption lines rather than drawn as
 * their own lifeline, to keep the diagram to the two participants that
 * actually exchange MCP messages. */
export function MCPSequenceDiagram() {
  const width = 320;
  const laneAX = 60;
  const laneBX = 260;
  const topMargin = 34;
  const rowH = 40;
  const height = topMargin + MESSAGES.length * rowH + 20;

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={laneAX} y={16} fontSize={14} fontWeight={700} textAnchor="middle" fill={CYAN}>
          Your App
        </text>
        <text x={laneBX} y={16} fontSize={14} fontWeight={700} textAnchor="middle" fill={PURPLE}>
          MCP Server
        </text>
        <line x1={laneAX} y1={24} x2={laneAX} y2={height - 10} stroke={NEUTRAL} strokeWidth={1.5} strokeDasharray="3,3" />
        <line x1={laneBX} y1={24} x2={laneBX} y2={height - 10} stroke={NEUTRAL} strokeWidth={1.5} strokeDasharray="3,3" />

        {MESSAGES.map((m, i) => {
          const y = topMargin + i * rowH;
          const x1 = m.direction === "right" ? laneAX : laneBX;
          const x2 = m.direction === "right" ? laneBX : laneAX;
          const arrowX = m.direction === "right" ? x2 - 8 : x2 + 8;
          const color = m.direction === "right" ? CYAN : PURPLE;
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={1.5} />
              <polygon
                points={
                  m.direction === "right"
                    ? `${arrowX},${y - 4} ${arrowX},${y + 4} ${arrowX + 8},${y}`
                    : `${arrowX},${y - 4} ${arrowX},${y + 4} ${arrowX - 8},${y}`
                }
                fill={color}
              />
              <text x={(x1 + x2) / 2} y={y - 6} fontSize={14} textAnchor="middle" fill="#3f3f46">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-sm text-neutral-500 mt-1 text-center">
        Before this: the model decided (via tool calling) that it needs the calendar. After
        this: your app hands the result back to the model.
      </p>
    </div>
  );
}
