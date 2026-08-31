export type CombineMode = "question" | "replace" | "add";

const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

/** Schematic (not data-driven) diagram of the one real design choice this
 * section is about: how to combine a token's own vector with its attention
 * output. Three modes share the same layout so the "before/after" reads as
 * the same picture with one thing changed, not three unrelated diagrams:
 * "question" (undecided), "replace" (x discarded), "add" (residual). */
export function CombineDiagram({ mode }: { mode: CombineMode }) {
  const width = 460;
  const height = 170;
  const xBoxX = 40;
  const xBoxY = 38;
  const outBoxX = 40;
  const outBoxY = 100;
  const boxW = 100;
  const boxH = 34;
  const hubX = 250;
  const hubY = (xBoxY + outBoxY + boxH) / 2;
  const resultX = 360;

  const xFaded = mode === "replace";

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {/* x box */}
        <g opacity={xFaded ? 0.3 : 1}>
          <rect x={xBoxX} y={xBoxY} width={boxW} height={boxH} rx={6} fill="rgba(124,58,237,0.12)" stroke={PURPLE} strokeWidth={2} />
          <text x={xBoxX + boxW / 2} y={xBoxY + boxH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
            old_x
          </text>
        </g>

        {/* attn_output box — matches the attn_output symbol used in this
            step's equation exactly (same name, same lack of a subscript:
            this diagram is about one token in isolation, not comparing
            multiple tokens, so there's no token index to attach). */}
        <rect x={outBoxX} y={outBoxY} width={boxW} height={boxH} rx={6} fill="rgba(8,145,178,0.12)" stroke={CYAN} strokeWidth={2} />
        <text x={outBoxX + boxW / 2} y={outBoxY + boxH / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
          attn_output
        </text>

        {/* connecting lines into the hub */}
        <line
          x1={xBoxX + boxW}
          y1={xBoxY + boxH / 2}
          x2={hubX - 20}
          y2={hubY}
          stroke={xFaded ? NEUTRAL : PURPLE}
          strokeWidth={xFaded ? 1.5 : 2}
          strokeDasharray={xFaded ? "4,3" : undefined}
          opacity={xFaded ? 0.5 : 1}
        />
        <line
          x1={outBoxX + boxW}
          y1={outBoxY + boxH / 2}
          x2={hubX - 20}
          y2={hubY}
          stroke={CYAN}
          strokeWidth={2}
        />

        {xFaded && (
          <text x={(xBoxX + boxW + hubX - 20) / 2} y={xBoxY + boxH / 2 - 10} fontSize={13} textAnchor="middle" fill="#dc2626">
            ×
          </text>
        )}

        {/* hub symbol */}
        {mode === "question" && (
          <>
            <circle cx={hubX} cy={hubY} r={17} fill="white" stroke={NEUTRAL} strokeWidth={2} strokeDasharray="3,3" />
            <text x={hubX} y={hubY + 6} fontSize={16} textAnchor="middle" fill={NEUTRAL}>
              ?
            </text>
          </>
        )}
        {mode === "replace" && (
          <>
            <circle cx={hubX} cy={hubY} r={17} fill="white" stroke={CYAN} strokeWidth={2} />
            <text x={hubX} y={hubY + 5} fontSize={12} textAnchor="middle" fill={CYAN}>
              =
            </text>
          </>
        )}
        {mode === "add" && (
          <>
            <circle cx={hubX} cy={hubY} r={17} fill="rgba(234,88,12,0.12)" stroke={ORANGE} strokeWidth={2} />
            <text x={hubX} y={hubY + 6} fontSize={16} textAnchor="middle" fill={ORANGE}>
              +
            </text>
          </>
        )}

        {/* result */}
        <line x1={hubX + 17} y1={hubY} x2={resultX - 6} y2={hubY} stroke={NEUTRAL} strokeWidth={2} />
        <polygon points={`${resultX - 6},${hubY - 5} ${resultX + 6},${hubY} ${resultX - 6},${hubY + 5}`} fill={NEUTRAL} />
        <rect x={resultX + 6} y={hubY - 17} width={70} height={34} rx={6} fill="#fafafa" stroke="#a1a1aa" strokeWidth={2} />
        <text x={resultX + 41} y={hubY + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
          {mode === "question" ? "?" : "new_x"}
        </text>
      </svg>
    </div>
  );
}
