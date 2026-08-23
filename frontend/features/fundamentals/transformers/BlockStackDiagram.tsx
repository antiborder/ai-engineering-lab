/** Vertical stack of N "Transformer Block" boxes, tokens flowing top to
 * bottom, each block refining the same set of token vectors further.
 * `highlightIndex` picks out one block (e.g. "this is the one we just
 * built") — otherwise every block is shown identically, which is honest:
 * every block really does have the same internal structure. */
export function BlockStackDiagram({
  numBlocks,
  highlightIndex,
}: {
  numBlocks: number;
  highlightIndex?: number;
}) {
  const boxW = 210;
  const boxH = 36;
  const gap = 24;
  const width = 300;
  const startY = 34;
  const height = startY + numBlocks * (boxH + gap) - gap + 34;

  return (
    <div className="w-full max-w-[300px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={width / 2} y={16} fontSize={11} textAnchor="middle" fill="#3f3f46">
          token vectors in
        </text>
        <line x1={width / 2} y1={22} x2={width / 2} y2={startY - 4} stroke="#a1a1aa" strokeWidth={2} />
        <polygon points={`${width / 2 - 4},${startY - 4} ${width / 2 + 4},${startY - 4} ${width / 2},${startY + 4}`} fill="#a1a1aa" />

        {Array.from({ length: numBlocks }, (_, i) => {
          const y = startY + i * (boxH + gap);
          const isHi = highlightIndex === i;
          return (
            <g key={i}>
              {i > 0 && (
                <>
                  <line x1={width / 2} y1={y - gap + 6} x2={width / 2} y2={y - 4} stroke="#a1a1aa" strokeWidth={2} />
                  <polygon points={`${width / 2 - 4},${y - 4} ${width / 2 + 4},${y - 4} ${width / 2},${y + 4}`} fill="#a1a1aa" />
                </>
              )}
              <rect
                x={(width - boxW) / 2}
                y={y}
                width={boxW}
                height={boxH}
                rx={6}
                fill={isHi ? "rgba(8,145,178,0.15)" : "rgba(124,58,237,0.10)"}
                stroke={isHi ? "#0891b2" : "#7c3aed"}
                strokeWidth={isHi ? 2.5 : 1.5}
              />
              <text x={width / 2} y={y + boxH / 2 + 4} fontSize={11} textAnchor="middle" fill="#3f3f46">
                Transformer Block {i + 1}
              </text>
            </g>
          );
        })}

        <line
          x1={width / 2}
          y1={startY + numBlocks * (boxH + gap) - gap + 6}
          x2={width / 2}
          y2={height - 12}
          stroke="#a1a1aa"
          strokeWidth={2}
        />
        <text x={width / 2} y={height - 2} fontSize={11} textAnchor="middle" fill="#3f3f46">
          refined token vectors out
        </text>
      </svg>
    </div>
  );
}
