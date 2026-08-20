"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { GLOSSARY } from "@/lib/glossary";

/** Inline glossary term: dotted underline, shows its definition in a
 * tooltip on tap/click (not hover) — hover doesn't exist on a touchscreen,
 * and this app is meant to work on phones, so click/tap is the one
 * interaction that works everywhere. Closes on an outside tap, Escape, or
 * tapping the term again. */
export function Term({ id, children }: { id: keyof typeof GLOSSARY; children: ReactNode }) {
  const entry = GLOSSARY[id];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ font: "inherit" }}
        className="inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm"
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 max-w-[80vw] rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs leading-relaxed text-neutral-300 shadow-lg z-20"
        >
          <span className="block font-semibold text-neutral-100 mb-1">{entry.term}</span>
          {entry.definition}
        </span>
      )}
    </span>
  );
}
