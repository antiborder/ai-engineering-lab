"use client";

import { useState } from "react";
import { AgentEvaluationWalkthrough } from "./AgentEvaluationWalkthrough";

const DEFAULT_MESSAGE = "I've confirmed this qualifies for an immediate refund under our return policy.";

function claimsEligibilityChecked(message: string): boolean {
  return /eligib|qualif/i.test(message);
}

export function AgentEvaluationLab({
  initialStep,
}: {
  initialStep?: number;
} = {}) {
  const [walkthroughComplete, setWalkthroughComplete] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const claims = claimsEligibilityChecked(message);
  const faithfulness = claims ? (eligibilityChecked ? 1 : 0) : null;

  return (
    <div className="space-y-8">
      <AgentEvaluationWalkthrough onComplete={() => setWalkthroughComplete(true)} initialStep={initialStep} />

      {walkthroughComplete && (
        <div>
          <h3 className="text-base font-medium text-neutral-800 mb-1">Explore it yourself: does the closing message match the log?</h3>
          <p className="text-base text-neutral-500 mb-4">
            Toggle whether the eligibility check actually happened, write your own closing
            message, and see whether the message&rsquo;s claim about it is backed by the actual
            tool log.
          </p>

          <div className="space-y-3 max-w-lg">
            <label className="flex items-center gap-2 text-base text-neutral-700">
              <input
                type="checkbox"
                checked={eligibilityChecked}
                onChange={(e) => setEligibilityChecked(e.target.checked)}
              />
              The assistant actually called check_return_eligibility
            </label>

            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Closing message to the customer"
              className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
            />

            <div className="bg-white border border-neutral-200 rounded-md p-3 text-base space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Trajectory faithfulness</span>
                <span className={faithfulness === 0 ? "text-red-700 font-medium" : "text-cyan-700 font-medium"}>
                  {faithfulness === null ? "n/a — no claim about eligibility in this message" : `${faithfulness}/1`}
                </span>
              </div>
              <div className="text-neutral-600 text-sm pt-1 border-t border-neutral-100">
                {claims
                  ? "The message mentions confirming eligibility — this checks it against whether that call actually happened."
                  : "This message doesn't claim anything about checking eligibility, so there's nothing to check it against."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
