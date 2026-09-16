export interface PrecisionRow {
  label: string;
  bits: number;
}

/** Renders each precision as a row of unit squares — one square per bit,
 * filled up to `maxBits` — so "fewer bits" is something the reader sees
 * (a shorter filled strip) rather than just reads as a number. */
export function PrecisionBarsDiagram({ rows, maxBits = 16 }: { rows: PrecisionRow[]; maxBits?: number }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="text-sm text-neutral-500 w-16 shrink-0">{row.label}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: row.bits }).map((_, i) => (
              <div key={`filled-${i}`} className="w-3 h-5 rounded-sm bg-cyan-600" />
            ))}
            {Array.from({ length: maxBits - row.bits }).map((_, i) => (
              <div key={`empty-${i}`} className="w-3 h-5 rounded-sm bg-neutral-100" />
            ))}
          </div>
          <span className="text-sm text-neutral-500 tabular-nums shrink-0">{row.bits} bits</span>
        </div>
      ))}
    </div>
  );
}
