"use client";

/** Segmented progress bar for step-by-step walkthroughs: one short pill per
 * subsection (grouped from consecutive steps sharing the same `section`
 * label), rather than one bar for the whole walkthrough. Each segment's
 * width is proportional to how many Steps it contains, not an equal split —
 * a 2-Step subsection reads as visibly shorter than a 10-Step one. A
 * subsection that's fully behind the current step is solid; the current
 * subsection is partially filled left-to-right by how far through *it* the
 * user is; subsections not yet reached are empty. Clicking anywhere on a
 * segment jumps to the step at that horizontal position within that
 * subsection. */
export function SegmentedProgressBar({
  sections,
  currentStep,
  onSelectStep,
}: {
  /** sections[i] = the section label of step i, for every step in order. */
  sections: string[];
  currentStep: number;
  onSelectStep: (index: number) => void;
}) {
  const segments: { section: string; start: number; end: number }[] = [];
  sections.forEach((section, i) => {
    const last = segments[segments.length - 1];
    if (last && last.section === section) {
      last.end = i + 1;
    } else {
      segments.push({ section, start: i, end: i + 1 });
    }
  });
  const total = sections.length;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, start: number, end: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = rect.width === 0 ? 0 : (e.clientX - rect.left) / rect.width;
    const segLen = end - start;
    const offset = Math.min(segLen - 1, Math.max(0, Math.floor(fraction * segLen)));
    onSelectStep(start + offset);
  };

  return (
    <div className="flex gap-1">
      {segments.map((seg) => {
        const segLen = seg.end - seg.start;
        const isPast = currentStep >= seg.end;
        const isCurrent = currentStep >= seg.start && currentStep < seg.end;
        const fillPct = isPast ? 100 : isCurrent ? ((currentStep - seg.start + 1) / segLen) * 100 : 0;

        return (
          <div
            key={`${seg.section}-${seg.start}`}
            role="button"
            tabIndex={0}
            title={seg.section}
            aria-label={`Jump to ${seg.section}`}
            onClick={(e) => handleClick(e, seg.start, seg.end)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectStep(seg.start);
            }}
            style={{ width: `${(segLen / total) * 100}%` }}
            className="shrink-0 h-1.5 rounded-full bg-neutral-200 overflow-hidden cursor-pointer"
          >
            <div
              className="h-full bg-cyan-600 transition-all"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
