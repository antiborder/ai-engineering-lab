"use client";

import { useState } from "react";
import { LlmJudgeWalkthrough } from "./LlmJudgeWalkthrough";

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  return shared / Math.max(wordsA.size, wordsB.size);
}

const DEFAULTS = {
  question: "Can I get a refund if I've already worn the item?",
  answer: "No — worn items only get a partial refund or store credit.",
  reference: "Items that are worn or missing tags may only receive a partial refund or store credit, at Southwear's discretion.",
};

export function LlmJudgeLab({
  initialStep,
  onAdvanceToNextChapter,
}: {
  initialStep?: number;
  onAdvanceToNextChapter?: () => void;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [question, setQuestion] = useState(DEFAULTS.question);
  const [answer, setAnswer] = useState(DEFAULTS.answer);
  const [reference, setReference] = useState(DEFAULTS.reference);

  const overlap = wordOverlap(answer, reference);
  const pass = overlap >= 0.4;

  return (
    <div className="space-y-8">
      <LlmJudgeWalkthrough
        onComplete={() => setWalkthroughComplete(true)}
        initialStep={initialStep}
        onAdvanceToNextChapter={onAdvanceToNextChapter}
      />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself</h3>
          <p className="text-base text-neutral-500 mb-4">
            Write your own question, answer, and reference — a real judge would use a full model
            call to score this; here, score comes from word overlap as a simple stand-in.
          </p>

          <div className="space-y-3 max-w-lg">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Question"
              className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
            />
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer"
              className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
            />
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Reference"
              className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
            />

            <div className="bg-white border border-neutral-200 rounded-md p-3 text-base space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Score</span>
                <span className="text-cyan-700 font-medium">{Math.round(overlap * 100)}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Verdict</span>
                <span className={pass ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>
                  {pass ? "✓ pass" : "✗ fail"}
                </span>
              </div>
              <div className="text-neutral-600 text-sm pt-1 border-t border-neutral-100">
                {pass
                  ? "Enough shared wording with the reference to count as supported."
                  : "Too little shared wording with the reference to count as supported."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
