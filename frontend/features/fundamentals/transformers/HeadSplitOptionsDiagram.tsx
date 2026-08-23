const D_MODEL = 8;
const OPTIONS = [1, 2, 4, 8];

function headColor(h: number, heads: number) {
  const hue = (200 + Math.round((h * 360) / heads)) % 360;
  return `hsl(${hue}, 60%, 48%)`;
}

function SplitRow({ heads }: { heads: number }) {
  const headDim = D_MODEL / heads;
  const cellW = 34;
  const cellGap = 3;
  const cellH = 22;
  const width = D_MODEL * cellW + (D_MODEL - 1) * cellGap;

  return (
    <svg viewBox={`0 0 ${width} ${cellH}`} className="w-full h-auto">
      {Array.from({ length: D_MODEL }, (_, i) => {
        const color = headColor(Math.floor(i / headDim), heads);
        return (
          <rect
            key={i}
            x={i * (cellW + cellGap)}
            y={0}
            width={cellW}
            height={cellH}
            rx={3}
            fill={color}
            fillOpacity={0.85}
            stroke={color}
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}

/** All four ways an 8-dimensional vector can be split evenly across heads —
 * shown together (rather than one at a time via a slider) since there are
 * only four possible options (the divisors of D_MODEL), so a side-by-side
 * comparison is more informative than stepping through them. */
export function HeadSplitOptionsDiagram() {
  return (
    <div className="w-full max-w-[460px] mx-auto grid grid-cols-2 gap-3">
      {OPTIONS.map((heads) => (
        <div key={heads} className="rounded-md border border-neutral-200 bg-white p-2">
          <div className="text-[10px] font-semibold text-neutral-700 mb-1.5">
            {heads} head{heads > 1 ? "s" : ""} — {D_MODEL / heads} dim{D_MODEL / heads > 1 ? "s" : ""} each
          </div>
          <SplitRow heads={heads} />
        </div>
      ))}
    </div>
  );
}
