const CYAN = "#0891b2";
const NEUTRAL = "#a1a1aa";

interface Branch {
  label: string;
  chosen: boolean;
}

const BRANCHES: Branch[] = [
  { label: "Call Tool A", chosen: true },
  { label: "Call Tool B", chosen: false },
  { label: "Answer directly", chosen: false },
];

/** What a fixed script never has: a real fork, with more than one path
 * genuinely reachable from the same starting point. Three branches fan out
 * from one "Goal" box; only the branch actually taken (`chosen: true`) is
 * drawn solid and colored — the other two stay dashed and grey, visible
 * but explicitly "not taken," so the diagram reads as "a choice was made"
 * rather than "the only possible next step." */
export function AgentDecisionDiagram() {
  const width = 320;
  const height = 170;

  const goalW = 120;
  const goalH = 32;
  const goalX = (width - goalW) / 2;
  const goalY = 10;
  const goalBottomX = goalX + goalW / 2;
  const goalBottomY = goalY + goalH;

  const branchW = 96;
  const branchH = 34;
  const branchY = 122;
  const gap = (width - branchW * BRANCHES.length) / (BRANCHES.length + 1);

  const branchX = (i: number) => gap + i * (branchW + gap);
  const branchCenterX = (i: number) => branchX(i) + branchW / 2;

  return (
    <div className="w-full max-w-[320px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <rect x={goalX} y={goalY} width={goalW} height={goalH} rx={6} fill="rgba(8,145,178,0.1)" stroke={CYAN} strokeWidth={2} />
        <text x={goalX + goalW / 2} y={goalY + goalH / 2 + 4} fontSize={12} fontWeight={700} textAnchor="middle" fill="#3f3f46">
          Goal
        </text>

        {BRANCHES.map((b, i) => (
          <path
            key={`line-${i}`}
            d={`M ${goalBottomX} ${goalBottomY} Q ${goalBottomX} ${(goalBottomY + branchY) / 2}, ${branchCenterX(i)} ${branchY}`}
            fill="none"
            stroke={b.chosen ? CYAN : NEUTRAL}
            strokeWidth={b.chosen ? 2 : 1.5}
            strokeDasharray={b.chosen ? undefined : "4,3"}
          />
        ))}

        {BRANCHES.map((b, i) => (
          <g key={b.label}>
            <rect
              x={branchX(i)}
              y={branchY}
              width={branchW}
              height={branchH}
              rx={6}
              fill={b.chosen ? "rgba(8,145,178,0.1)" : "#fafafa"}
              stroke={b.chosen ? CYAN : NEUTRAL}
              strokeWidth={b.chosen ? 2 : 1.5}
              strokeDasharray={b.chosen ? undefined : "4,3"}
            />
            <text
              x={branchCenterX(i)}
              y={branchY + branchH / 2 + 4}
              fontSize={12}
              textAnchor="middle"
              fill={b.chosen ? "#3f3f46" : "#a3a3a3"}
            >
              {b.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-neutral-500 mt-1 text-center">
        Solid = the path actually taken. Dashed = paths that were genuinely possible, but
        weren&rsquo;t chosen this time.
      </p>
    </div>
  );
}
