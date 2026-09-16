"use client";

import { useState } from "react";
import { RagEvaluationWalkthrough } from "./RagEvaluationWalkthrough";

const DOCS = {
  domestic: {
    label: "Domestic Shipping Policy",
    text: "Domestic orders over $50 ship free. Orders under $50 incur a $5 shipping fee.",
  },
  international: {
    label: "International Shipping Policy",
    text: "International orders over $75 ship free. Orders under $75 incur a flat $14 international shipping fee.",
  },
} as const;

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  return shared / Math.max(wordsA.size, wordsB.size);
}

export function RagEvaluationLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [retrievedDoc, setRetrievedDoc] = useState<keyof typeof DOCS>("domestic");
  const [answer, setAnswer] = useState("Yes! Orders over $50 ship free.");

  const overlap = wordOverlap(answer, DOCS[retrievedDoc].text);

  return (
    <div className="space-y-8">
      <RagEvaluationWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: faithful to what, exactly?</h3>
          <p className="text-base text-neutral-500 mb-4">
            Pick which document got retrieved, write your own answer, and see how faithful it is
            (word overlap, as a simple stand-in) to what was actually retrieved — not to the
            truth.
          </p>

          <div className="space-y-3 max-w-lg">
            <div className="flex gap-3">
              {(Object.keys(DOCS) as (keyof typeof DOCS)[]).map((id) => (
                <label key={id} className="flex items-center gap-1.5 text-base text-neutral-700">
                  <input
                    type="radio"
                    name="retrievedDoc"
                    checked={retrievedDoc === id}
                    onChange={() => setRetrievedDoc(id)}
                  />
                  {DOCS[id].label}
                </label>
              ))}
            </div>

            <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base">
              <div className="text-neutral-500">Retrieved document says</div>
              <div className="text-neutral-800">{DOCS[retrievedDoc].text}</div>
            </div>

            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Answer"
              className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
            />

            <div className="bg-white border border-neutral-200 rounded-md p-3 text-base space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Faithfulness (vs. what was retrieved)</span>
                <span className="text-cyan-700 font-medium">{Math.round(overlap * 100)}%</span>
              </div>
              <div className="text-neutral-600 text-sm pt-1 border-t border-neutral-100">
                This says nothing about whether {DOCS[retrievedDoc].label} was even the right
                document to retrieve for the customer&rsquo;s question.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
