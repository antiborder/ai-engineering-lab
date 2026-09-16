export type MemoryCellKind = "used" | "wasted" | "free";
export type MemoryCellOwner = "a" | "b" | "c";

export interface MemoryCell {
  kind: MemoryCellKind;
  owner?: MemoryCellOwner; // which reservation this cell belongs to (used/wasted cells only)
}

const OWNER_CLASSES: Record<MemoryCellOwner, { used: string; wasted: string }> = {
  a: { used: "bg-cyan-500", wasted: "bg-cyan-100" },
  b: { used: "bg-purple-500", wasted: "bg-purple-100" },
  c: { used: "bg-amber-500", wasted: "bg-amber-100" },
};

/** A strip of GPU memory (or a hotel wing — same picture, different
 * label) drawn as a grid of small cells: solid = actually used, hatched
 * = reserved but empty (internal fragmentation), dashed outline = free.
 * Reused across every PagedAttention Step with a different `cells` array
 * (and by the live "Try it yourself" Step, computed from the slider),
 * the same one-diagram-many-Steps technique every other Unit's diagrams
 * use. Kept to plain colored divs — no animation library, matching the
 * rest of this app's diagrams. */
export function MemoryGridDiagram({
  cells,
  cols = 16,
  legend = true,
}: {
  cells: MemoryCell[];
  cols?: number;
  legend?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1.1rem)` }}>
        {cells.map((cell, i) => {
          const owner = cell.owner ? OWNER_CLASSES[cell.owner] : undefined;
          const cls =
            cell.kind === "free"
              ? "bg-white border border-dashed border-neutral-300"
              : cell.kind === "used"
                ? `${owner?.used ?? "bg-emerald-500"} border border-transparent`
                : `${owner?.wasted ?? "bg-neutral-200"} border border-dashed border-neutral-300`;
          return <div key={i} className={`w-[1.1rem] h-[1.1rem] rounded-sm ${cls}`} />;
        })}
      </div>
      {legend && (
        // Neutral swatches on purpose: owner colors (cyan/purple/amber) tell
        // reservations apart, but "used vs. wasted vs. free" is the same
        // solid/light/empty pattern regardless of which owner's color it is.
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-neutral-700 inline-block" /> used
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-neutral-200 border border-dashed border-neutral-300 inline-block" /> reserved, unused
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-white border border-dashed border-neutral-300 inline-block" /> free
          </span>
        </div>
      )}
    </div>
  );
}
