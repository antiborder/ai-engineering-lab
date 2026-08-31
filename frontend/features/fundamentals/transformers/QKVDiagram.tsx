export type QKVPart = "input" | "q" | "k" | "v";

const DIM = 0.22;

/** Schematic (not data-driven) diagram of one token's embedding branching
 * into Query, Key, and Value via three separate linear maps. Distinct from
 * NeuronDiagram's circle style — these are vectors, not scalars, so nodes
 * are drawn as boxes. `highlight` dims every part except the ones named. */
export function QKVDiagram({ highlight }: { highlight?: QKVPart[] }) {
  const width = 460;
  const height = 200;
  const op = (part: QKVPart) => (!highlight || highlight.length === 0 ? 1 : highlight.includes(part) ? 1 : DIM);
  const sw = (part: QKVPart, base: number) => (highlight?.includes(part) ? base + 1.5 : base);

  const inX = 62;
  const outX = 380;
  const cy = 100;
  const rows: { part: QKVPart; label: string; wLabel: string; y: number; color: string }[] = [
    { part: "q", label: "Q", wLabel: "Wq", y: 40, color: "#0891b2" },
    { part: "k", label: "K", wLabel: "Wk", y: 100, color: "#7c3aed" },
    { part: "v", label: "V", wLabel: "Wv", y: 160, color: "#ea580c" },
  ];

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="bg-white rounded-md border border-neutral-200 w-full h-auto"
      >
        <g opacity={op("input")}>
          <rect x={inX - 30} y={cy - 16} width={60} height={32} rx={6} fill="rgba(124,58,237,0.12)" stroke="#7c3aed" strokeWidth={sw("input", 2)} />
          <text x={inX} y={cy + 5} fontSize={12} fill="#3f3f46" textAnchor="middle">x</text>
        </g>
        {rows.map((row) => (
          <g key={row.part} opacity={op(row.part)}>
            <line x1={inX + 30} y1={cy} x2={outX - 40} y2={row.y} stroke={row.color} strokeWidth={sw(row.part, 2)} />
            <text x={(inX + outX) / 2 - 4} y={(cy + row.y) / 2 - 8} fontSize={12} fill={row.color} textAnchor="middle">
              {row.wLabel}
            </text>
            <rect x={outX - 40} y={row.y - 16} width={80} height={32} rx={6} fill={`${row.color}1f`} stroke={row.color} strokeWidth={sw(row.part, 2)} />
            <text x={outX} y={row.y + 5} fontSize={12} fill="#3f3f46" textAnchor="middle">
              {row.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
