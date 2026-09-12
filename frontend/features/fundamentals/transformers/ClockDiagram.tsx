const CX = 90;
const CY = 90;
const R = 70;

function tip(angleDeg: number, length: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + length * Math.sin(rad), y: CY - length * Math.cos(rad) };
}

/** An analog clock face with three hands, illustrating that "the time" is
 * really three separate numbers (hour/minute/second angle) read together —
 * the same structure as a vector with three dimensions, just moving at
 * three different speeds. Used to make the positional-encoding "fast wave /
 * slow wave" analogy concrete rather than just verbal. */
export function ClockDiagram() {
  const hourTip = tip(305, 34);
  const minuteTip = tip(60, 54);
  const secondTip = tip(180, 64);

  return (
    <div className="w-full max-w-[220px] mx-auto">
      <svg viewBox="0 0 180 180" className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <circle cx={CX} cy={CY} r={R} fill="white" stroke="#a1a1aa" strokeWidth={2} />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = i * 30;
          const outer = tip(angle, R - 4);
          const inner = tip(angle, R - 11);
          return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#a1a1aa" strokeWidth={1.5} />;
        })}
        <line x1={CX} y1={CY} x2={hourTip.x} y2={hourTip.y} stroke="#7c3aed" strokeWidth={4} strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={minuteTip.x} y2={minuteTip.y} stroke="#0891b2" strokeWidth={3} strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={secondTip.x} y2={secondTip.y} stroke="#ea580c" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={3.5} fill="#3f3f46" />
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-sm text-neutral-600 mt-1.5">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#7c3aed" }} />
          hour (slowest)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#0891b2" }} />
          minute
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#ea580c" }} />
          second (fastest)
        </span>
      </div>
    </div>
  );
}
