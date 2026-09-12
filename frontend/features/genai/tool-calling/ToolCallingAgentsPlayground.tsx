"use client";

import { useState } from "react";
import { ToolCallingLab } from "./ToolCallingLab";
import { AgentLab } from "./AgentLab";

const CHAPTERS = [
  { id: "tool-calling", label: "Tool Calling" },
  { id: "agents", label: "Agents" },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

/** One Unit, two Chapters: Agents is Tool Calling looped, with a plan on
 * top — the same relationship Fundamentals' multi-Chapter Units (e.g.
 * Transformers) already model, so this Unit follows that same pattern
 * instead of staying two separate top-level pages. */
export function ToolCallingAgentsPlayground() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>("tool-calling");

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-neutral-200">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveChapter(c.id)}
            className={`px-4 py-2 text-base font-medium border-b-2 -mb-px transition-colors ${
              activeChapter === c.id
                ? "border-cyan-600 text-neutral-900"
                : "border-transparent text-neutral-500 hover:text-neutral-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {activeChapter === "tool-calling" && <ToolCallingLab onNavigateToChapter={setActiveChapter} />}
      {activeChapter === "agents" && <AgentLab />}
    </div>
  );
}
