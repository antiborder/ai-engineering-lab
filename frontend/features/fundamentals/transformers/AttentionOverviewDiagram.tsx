const PURPLE = "#7c3aed";
const ORANGE = "#ea580c";
const CYAN = "#0891b2";
const NEUTRAL = "#3f3f46";

interface Row {
  label: string;
  weight: number;
}

const ROWS: Row[] = [
  { label: "the", weight: 0.55 },
  { label: "cat", weight: 0.1 },
  { label: "sat", weight: 0.05 },
  { label: "mat", weight: 0.3 },
];

/** The "big picture before the details" diagram for attention: one query
 * compared against every token's key at once (line thickness = match
 * strength), and the output is a blend of every token's value in those
 * same proportions — not a single value picked out. Illustrative weights,
 * not computed from real data; the point is the shape of the mechanism. */
export function AttentionOverviewDiagram() {
  const width = 460;
  const height = 228;
  const headerY = 14;
  const queryX = 46;
  const keyX = 190;
  const valueX = 330;
  const outX = 430;
  const rowYs = [50, 96, 142, 188];
  const queryY = (rowYs[0] + rowYs[3]) / 2;
  const outY = queryY;

  const op = (w: number) => 0.25 + w * 0.7;
  const sw = (w: number) => 1 + w * 6;

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={queryX} y={headerY} fontSize={10} fontWeight={700} textAnchor="middle" fill={CYAN}>
          Query
        </text>
        <text x={keyX} y={headerY} fontSize={10} fontWeight={700} textAnchor="middle" fill={PURPLE}>
          Key
        </text>
        <text x={valueX} y={headerY} fontSize={10} fontWeight={700} textAnchor="middle" fill={ORANGE}>
          Value
        </text>
        <text x={outX} y={headerY} fontSize={10} fontWeight={700} textAnchor="middle" fill={NEUTRAL}>
          Output
        </text>

        {ROWS.map((row, i) => (
          <line
            key={`qk-${i}`}
            x1={queryX + 26}
            y1={queryY}
            x2={keyX - 24}
            y2={rowYs[i]}
            stroke={CYAN}
            strokeWidth={sw(row.weight)}
            strokeOpacity={op(row.weight)}
          />
        ))}

        <rect x={queryX - 26} y={queryY - 16} width={52} height={32} rx={6} fill="rgba(8,145,178,0.12)" stroke={CYAN} strokeWidth={2} />
        <text x={queryX} y={queryY + 4} fontSize={11} textAnchor="middle" fill="#3f3f46">
          Query
        </text>

        {ROWS.map((row, i) => (
          <g key={`key-${i}`}>
            <rect x={keyX - 24} y={rowYs[i] - 14} width={48} height={28} rx={6} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={1.5} />
            <text x={keyX} y={rowYs[i] + 4} fontSize={10} textAnchor="middle" fill="#3f3f46">
              {row.label}
            </text>
            <text x={keyX} y={rowYs[i] - 20} fontSize={8} textAnchor="middle" fill={CYAN}>
              {Math.round(row.weight * 100)}%
            </text>
            <line x1={keyX + 24} y1={rowYs[i]} x2={valueX - 24} y2={rowYs[i]} stroke="#d4d4d8" strokeWidth={1} strokeDasharray="2,2" />
            <rect x={valueX - 24} y={rowYs[i] - 14} width={48} height={28} rx={6} fill="rgba(234,88,12,0.12)" stroke={ORANGE} strokeWidth={1.5} />
            <text x={valueX} y={rowYs[i] + 4} fontSize={10} textAnchor="middle" fill="#3f3f46">
              v{i + 1}
            </text>
            <line
              x1={valueX + 24}
              y1={rowYs[i]}
              x2={outX - 22}
              y2={outY}
              stroke={ORANGE}
              strokeWidth={sw(row.weight)}
              strokeOpacity={op(row.weight)}
            />
          </g>
        ))}

        <rect x={outX - 22} y={outY - 18} width={44} height={36} rx={6} fill={`${NEUTRAL}1a`} stroke={NEUTRAL} strokeWidth={2} />
        <text x={outX} y={outY - 3} fontSize={9} textAnchor="middle" fill="#3f3f46">
          output
        </text>
        <text x={outX} y={outY + 10} fontSize={9} textAnchor="middle" fill="#3f3f46">
          blend
        </text>
      </svg>
      <p className="text-[11px] text-neutral-500 mt-1 text-center">
        % = attention weight — how much of that key&rsquo;s value gets blended into the output.
        The four numbers always add up to 100%.
      </p>
    </div>
  );
}
