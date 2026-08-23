import { probColor } from "@/components/DecisionBoundaryCanvas";
import { positionalEncoding } from "./transformer";

/** The classic sinusoidal positional-encoding "stripes" visualization:
 * position along x, embedding dimension along y, color = the encoding's
 * value at that (position, dimension). Different rows oscillate at
 * different frequencies — that's the actual insight the sin/cos formula
 * encodes, and it's far more visible here than in the equation alone.
 * Every row and column is labeled (which speed/function a row is, which
 * position a column is), and one column is outlined in red with a caption
 * — this is the actual answer to "what does one column mean?", not left
 * for the surrounding prose alone to explain. */
export function PositionalEncodingHeatmap({
  maxPos,
  dModel,
  cellSize = 16,
}: {
  maxPos: number;
  dModel: number;
  cellSize?: number;
}) {
  const titleW = 14;
  const rowLabelW = 42;
  const marginLeft = titleW + rowLabelW;
  const posLabelH = 12;
  const axisTitleH = 14;
  const marginBottom = posLabelH + axisTitleH;
  const captionH = 16;

  const gridW = maxPos * cellSize;
  const gridH = dModel * cellSize;
  const width = marginLeft + gridW + 4;
  const height = captionH + gridH + marginBottom;
  const gridTop = captionH;

  const highlightPos = Math.min(maxPos - 1, Math.floor(maxPos / 2));

  return (
    <div className="w-full max-w-full overflow-x-auto">
      <svg width={width} height={height} className="bg-white rounded-md border border-neutral-200">
        <text
          x={titleW / 2}
          y={gridTop + gridH / 2}
          fontSize={10}
          fill="#525252"
          textAnchor="middle"
          transform={`rotate(-90, ${titleW / 2}, ${gridTop + gridH / 2})`}
        >
          dimension
        </text>

        {Array.from({ length: dModel }, (_, dim) => {
          const i = Math.floor(dim / 2);
          const label = `${dim % 2 === 0 ? "sin" : "cos"} i=${i}`;
          return (
            <text
              key={dim}
              x={marginLeft - 4}
              y={gridTop + dim * cellSize + cellSize / 2 + 3}
              fontSize={9}
              fill="#525252"
              textAnchor="end"
            >
              {label}
            </text>
          );
        })}

        {Array.from({ length: maxPos }, (_, pos) => {
          const pe = positionalEncoding(pos, dModel);
          return pe.map((v, dim) => {
            const t = (v + 1) / 2;
            const [r, g, b] = probColor(t);
            return (
              <rect
                key={`${pos}-${dim}`}
                x={marginLeft + pos * cellSize}
                y={gridTop + dim * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                fill={`rgb(${r},${g},${b})`}
              />
            );
          });
        })}

        {Array.from({ length: maxPos }, (_, pos) => (
          <text
            key={pos}
            x={marginLeft + pos * cellSize + cellSize / 2}
            y={gridTop + gridH + posLabelH - 2}
            fontSize={9}
            fill="#525252"
            textAnchor="middle"
          >
            {pos}
          </text>
        ))}

        <rect
          x={marginLeft + highlightPos * cellSize - 1}
          y={gridTop - 1}
          width={cellSize + 1}
          height={gridH + 2}
          fill="none"
          stroke="#dc2626"
          strokeWidth={2}
          rx={1}
        />
        <text
          x={marginLeft + highlightPos * cellSize + cellSize / 2}
          y={captionH - 4}
          fontSize={9}
          fontWeight={600}
          fill="#dc2626"
          textAnchor="middle"
        >
          ↓ one column = one position
        </text>

        <text x={marginLeft + gridW / 2} y={height - 3} fontSize={10} fill="#525252" textAnchor="middle">
          position
        </text>
      </svg>
    </div>
  );
}
