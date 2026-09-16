export interface BatchSegment {
  steps: number;
  label: string;
  idle?: boolean;
}

export interface BatchSlotRow {
  label: string;
  segments: BatchSegment[];
}

/** A GPU slot's timeline drawn left-to-right: each colored block is one
 * request occupying that slot for a number of steps, and light gray
 * blocks are idle time — the slot has nothing to do even though other
 * requests are still waiting. `totalSteps` sets the shared time axis so
 * every row lines up, letting two of these side by side (static vs.
 * continuous batching) be compared directly by their overall width and
 * how much gray each row has. */
export function BatchTimelineDiagram({ rows, totalSteps }: { rows: BatchSlotRow[]; totalSteps: number }) {
  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="text-sm text-neutral-500 w-14 shrink-0">{row.label}</span>
          <div className="flex-1 flex h-6 rounded-sm overflow-hidden border border-neutral-200">
            {row.segments.map((seg, i) => (
              <div
                key={i}
                style={{ flexBasis: `${(seg.steps / totalSteps) * 100}%` }}
                className={`flex items-center justify-center text-xs font-medium whitespace-nowrap overflow-hidden ${
                  i < row.segments.length - 1 ? "border-r border-white/70" : ""
                } ${seg.idle ? "bg-neutral-100 text-neutral-400" : "bg-cyan-600 text-white"}`}
              >
                {seg.steps >= 2 ? seg.label : ""}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
