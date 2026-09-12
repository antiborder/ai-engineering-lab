const CYAN = "#0891b2";
const PURPLE = "#7c3aed";
const NEUTRAL = "#a1a1aa";

/** How N apps reach M tools, two ways: `mode="direct"` draws a line from
 * every app straight to every tool (N×M custom integrations — messy, and
 * gets worse fast as either list grows); `mode="hub"` routes every
 * connection through one MCP-server layer instead (N+M connections, no
 * crossing lines). Box positions are computed from the actual list
 * lengths, so this same component draws both the 3-app/3-tool illustrative
 * example and this app's own 1-app/3-tool case. */
export function MCPWiringDiagram({
  apps,
  tools,
  mode,
}: {
  apps: string[];
  tools: string[];
  mode: "direct" | "hub";
}) {
  const width = 320;
  const boxW = 92;
  const boxH = 26;
  const rowGap = 14;
  const topMargin = 14;

  const rows = Math.max(apps.length, tools.length);
  const height = topMargin + rows * boxH + (rows - 1) * rowGap + 44;

  const appX = 6;
  const toolX = width - boxW - 6;
  const hubX = (width - boxW) / 2;
  const contentHeight = rows * boxH + (rows - 1) * rowGap;
  const hubY = topMargin + (contentHeight - boxH) / 2;

  const colY = (index: number, count: number) => {
    const colHeight = count * boxH + (count - 1) * rowGap;
    const start = topMargin + (rows * boxH + (rows - 1) * rowGap - colHeight) / 2;
    return start + index * (boxH + rowGap);
  };

  const connectionCount = mode === "direct" ? apps.length * tools.length : apps.length + tools.length;

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height - 10}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {mode === "direct" &&
          apps.map((_, ai) =>
            tools.map((_, ti) => (
              <line
                key={`${ai}-${ti}`}
                x1={appX + boxW}
                y1={colY(ai, apps.length) + boxH / 2}
                x2={toolX}
                y2={colY(ti, tools.length) + boxH / 2}
                stroke={NEUTRAL}
                strokeWidth={1}
                opacity={0.6}
              />
            ))
          )}

        {mode === "hub" &&
          apps.map((_, ai) => (
            <line
              key={`a-${ai}`}
              x1={appX + boxW}
              y1={colY(ai, apps.length) + boxH / 2}
              x2={hubX}
              y2={hubY + boxH / 2}
              stroke={CYAN}
              strokeWidth={1.5}
            />
          ))}
        {mode === "hub" &&
          tools.map((_, ti) => (
            <line
              key={`t-${ti}`}
              x1={hubX + boxW}
              y1={hubY + boxH / 2}
              x2={toolX}
              y2={colY(ti, tools.length) + boxH / 2}
              stroke={CYAN}
              strokeWidth={1.5}
            />
          ))}

        {apps.map((a, i) => (
          <g key={a}>
            <rect x={appX} y={colY(i, apps.length)} width={boxW} height={boxH} rx={5} fill="rgba(8,145,178,0.08)" stroke={CYAN} strokeWidth={1.5} />
            <text x={appX + boxW / 2} y={colY(i, apps.length) + boxH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
              {a}
            </text>
          </g>
        ))}

        {mode === "hub" && (
          <g>
            <rect x={hubX} y={hubY} width={boxW} height={boxH} rx={5} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={2} />
            <text x={hubX + boxW / 2} y={hubY + boxH / 2 + 4} fontSize={14} fontWeight={700} textAnchor="middle" fill="#3f3f46">
              MCP
            </text>
          </g>
        )}

        {tools.map((t, i) => (
          <g key={t}>
            <rect x={toolX} y={colY(i, tools.length)} width={boxW} height={boxH} rx={5} fill="rgba(234,88,12,0.08)" stroke="#ea580c" strokeWidth={1.5} />
            <text x={toolX + boxW / 2} y={colY(i, tools.length) + boxH / 2 + 4} fontSize={14} textAnchor="middle" fill="#3f3f46">
              {t}
            </text>
          </g>
        ))}

        <text x={width / 2} y={height - 16} fontSize={14} fontWeight={700} textAnchor="middle" fill={mode === "direct" ? "#dc2626" : "#059669"}>
          {connectionCount} {mode === "direct" ? "custom integrations" : "standard connections"}
        </text>
      </svg>
    </div>
  );
}
