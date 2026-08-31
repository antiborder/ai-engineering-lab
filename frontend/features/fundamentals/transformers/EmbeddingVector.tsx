import { probColor } from "@/components/DecisionBoundaryCanvas";

/** Renders a vector of numbers as a strip of colored cells, each with its
 * actual value printed underneath — orange for negative, white near zero,
 * cyan for positive (same diverging palette as the decision-boundary
 * heatmaps elsewhere in Fundamentals). The color is only a pattern-at-a-
 * glance aid; the printed numbers are what an embedding actually *is*, so
 * they're never omitted. `scale` sets the value that maps to full color
 * saturation; values beyond it just clip, which is fine for teaching
 * purposes. */
export function EmbeddingVector({
  values,
  label,
  scale = 1.2,
  cellSize = 32,
}: {
  values: number[];
  label?: string;
  scale?: number;
  cellSize?: number;
}) {
  return (
    <div className="inline-flex items-start gap-2">
      {label && <span className="text-xs font-mono text-neutral-500 w-14 shrink-0 pt-1.5">{label}</span>}
      <div>
        <div className="flex rounded-sm overflow-hidden border border-neutral-200">
          {values.map((v, i) => {
            const t = Math.max(0, Math.min(1, (v / scale + 1) / 2));
            const [r, g, b] = probColor(t);
            return (
              <div
                key={i}
                style={{ width: cellSize, height: cellSize, backgroundColor: `rgb(${r},${g},${b})` }}
              />
            );
          })}
        </div>
        <div className="flex">
          {values.map((v, i) => (
            <div
              key={i}
              style={{ width: cellSize }}
              className="text-center text-xs font-mono text-neutral-500 tabular-nums pt-0.5"
            >
              {v.toFixed(1)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
