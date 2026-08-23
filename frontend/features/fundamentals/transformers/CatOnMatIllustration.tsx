const ORANGE = "#ea580c";
const ORANGE_LIGHT = "#fdba74";
const CREAM = "#fff7ed";
const MAT = "#e7cba5";
const MAT_DARK = "#d3ac7c";
const INK = "#3f3f46";

/** A literal, illustrative "the cat sat on the mat" — this chapter's
 * running example sentence made concrete, since every step from here
 * treats those words as abstract tokens/vectors. Purely decorative:
 * flat shapes in the app's existing palette, matching ClockDiagram's
 * illustrative (non-data) style rather than the technical diagrams. */
export function CatOnMatIllustration() {
  return (
    <div className="w-full max-w-[220px] mx-auto">
      <svg viewBox="0 0 200 170" className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {/* mat */}
        <rect x={20} y={132} width={160} height={26} rx={13} fill={MAT} stroke={MAT_DARK} strokeWidth={2} />
        {[142, 150].map((y) => (
          <line key={y} x1={30} y1={y} x2={170} y2={y} stroke={MAT_DARK} strokeWidth={1.5} opacity={0.6} />
        ))}

        {/* tail */}
        <path
          d="M 138 128 C 168 128, 176 96, 158 82"
          fill="none"
          stroke={ORANGE}
          strokeWidth={11}
          strokeLinecap="round"
        />

        {/* body */}
        <ellipse cx={100} cy={118} rx={44} ry={34} fill={ORANGE} />
        <ellipse cx={100} cy={132} rx={22} ry={12} fill={CREAM} />

        {/* front paws */}
        <ellipse cx={82} cy={140} rx={9} ry={7} fill={CREAM} />
        <ellipse cx={118} cy={140} rx={9} ry={7} fill={CREAM} />

        {/* head */}
        <circle cx={100} cy={66} r={30} fill={ORANGE} />

        {/* ears */}
        <polygon points="72,50 62,20 92,42" fill={ORANGE} />
        <polygon points="128,50 138,20 108,42" fill={ORANGE} />
        <polygon points="74,46 68,26 88,42" fill={ORANGE_LIGHT} />
        <polygon points="126,46 132,26 112,42" fill={ORANGE_LIGHT} />

        {/* face patch */}
        <ellipse cx={100} cy={78} rx={20} ry={13} fill={CREAM} />

        {/* eyes */}
        <ellipse cx={89} cy={62} rx={4} ry={5.5} fill={INK} />
        <ellipse cx={111} cy={62} rx={4} ry={5.5} fill={INK} />

        {/* nose + mouth */}
        <polygon points="100,72 96,78 104,78" fill="#f472b6" />
        <path d="M 100 78 Q 100 82 94 84" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
        <path d="M 100 78 Q 100 82 106 84" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />

        {/* whiskers */}
        {[[62, 70], [60, 76], [62, 82]].map(([x, y], i) => (
          <line key={`l${i}`} x1={x} y1={y} x2={40} y2={y - 4 + i * 4} stroke={INK} strokeWidth={1} opacity={0.6} />
        ))}
        {[[138, 70], [140, 76], [138, 82]].map(([x, y], i) => (
          <line key={`r${i}`} x1={x} y1={y} x2={160} y2={y - 4 + i * 4} stroke={INK} strokeWidth={1} opacity={0.6} />
        ))}
      </svg>
      <p className="text-[11px] text-neutral-500 mt-1 text-center">
        &ldquo;the cat sat on the mat&rdquo; — this chapter&rsquo;s running example.
      </p>
    </div>
  );
}
