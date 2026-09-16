"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { Equation } from "@/components/Equation";
import { AgentTrajectoryDiagram } from "./AgentTrajectoryDiagram";

interface AgentAction {
  id: string;
  label: string;
  required: boolean;
}

const ACTIONS: AgentAction[] = [
  { id: "look_up_order", label: "Look up the order", required: true },
  { id: "check_return_eligibility", label: "Check return eligibility", required: true },
  { id: "cancel_order", label: "Cancel the order", required: true },
  { id: "issue_refund", label: "Issue the refund", required: true },
  { id: "send_confirmation", label: "Send confirmation to the customer", required: true },
  { id: "check_shipping_policy", label: "Check shipping policy", required: false },
];

const DEFAULT_DONE: Record<string, boolean> = {
  look_up_order: true,
  check_return_eligibility: false,
  cancel_order: true,
  issue_refund: true,
  send_confirmation: true,
  check_shipping_policy: false,
};

/** Module 3 (Evaluation), Unit "Agent Evaluation", 1 Chapter — the final
 * Unit in the Evaluation module. Continues the story from RAG Evaluation:
 * Southwear's Help Center Assistant now plans and runs a sequence of tool
 * calls (look up an order, check a policy, cancel it, refund it) instead
 * of retrieving-then-answering in one step. That sequence is a
 * trajectory, and it introduces a failure mode neither retrieval-vs-
 * generation nor faithfulness ever had: a task can succeed by outcome
 * while the trajectory behind it skipped a required step. Deliberately
 * built at Evaluation Basics' depth (TP/FP/FN framework reused directly
 * from Metrics, a "the number looks fine but isn't" trap, several
 * distinct blind-spot examples) rather than RAG Evaluation's lighter
 * pass. Closes the whole Evaluation module — no further Unit to link
 * forward to. */
export function AgentEvaluationWalkthrough({
  onComplete,
  initialStep,
}: {
  onComplete?: () => void;
  initialStep?: number;
}) {
  const [done, setDone] = useState<Record<string, boolean>>(DEFAULT_DONE);
  const resetDone = () => setDone(DEFAULT_DONE);

  const tp = ACTIONS.filter((a) => a.required && done[a.id]).length;
  const fp = ACTIONS.filter((a) => !a.required && done[a.id]).length;
  const totalRequired = ACTIONS.filter((a) => a.required).length;
  const precision = tp + fp === 0 ? null : tp / (tp + fp);
  const recall = tp / totalRequired;

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";

  interface Step {
    section: string;
    title: string;
    story?: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const ticketCard = (
    <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
      <div className="text-neutral-700">Ticket #4471: &ldquo;Please cancel my order and refund me.&rdquo;</div>
      <div className="text-emerald-700 font-medium">Status: Resolved — order canceled, $84.50 refunded</div>
    </div>
  );

  const steps: Step[] = [
    // -------------------- Welcome --------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>
            RAG Evaluation split a wrong answer into a retrieval problem or a generation problem.
            Southwear&rsquo;s assistant can now also act, not just answer — this chapter finds
            what can go wrong there:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Diagnosing the Failure</strong> — a task can look completed while the process behind it broke.</li>
            <li><strong>Evaluating the Trajectory</strong> — precision and recall, applied to a sequence of actions instead of retrieved documents.</li>
            <li><strong>Task Success vs. Trajectory Correctness</strong> — why a satisfied customer doesn&rsquo;t prove the process was right.</li>
            <li><strong>What Precision and Recall Still Miss</strong> — order, repetition, and whether the assistant&rsquo;s own account of itself can be trusted.</li>
            <li><strong>Diagnosing in Practice</strong> — checking all of it, in order, on one real ticket.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: When the Assistant Starts Acting",
      story:
        'Chloe: "Southwear\'s assistant can actually do things now? Cancel orders, issue refunds?"\nMaya: "Right — it plans out a sequence of tool calls instead of just answering from whatever it retrieved."\nChloe: "Okay, but isn\'t that just another flavor of the retrieval-or-generation problem?"\nMaya: "No. Watch what this one gets away with."',
      body: (
        <p>
          Southwear&rsquo;s assistant now plans a sequence of tool calls — look up an order,
          check a policy, cancel it, refund it — instead of retrieving documents and answering in
          one step. That sequence is called a trajectory, and it
          opens up a failure mode last chapter never had.
        </p>
      ),
      visual: <AgentTrajectoryDiagram />,
    },
    // -------------------- 1. Diagnosing the Failure --------------------
    {
      section: "1. Diagnosing the Failure",
      title: "Same Symptom, Different Disease",
      story:
        'Chloe: "So what happened this time?"\nMaya: "A customer asked to cancel order #4471 and get refunded. The assistant did it — canceled, refunded, ticket closed as resolved."\nChloe: "That... sounds like it worked?"\nMaya: "By the outcome, yes. Let\'s see how it got there before you agree."',
      body: (
        <p>
          The customer&rsquo;s request was fulfilled: the order shows canceled, the refund shows
          issued, the ticket is marked resolved. Whether that outcome tells the whole story
          depends on what actually happened in between.
        </p>
      ),
      visual: ticketCard,
    },
    {
      section: "1. Diagnosing the Failure",
      title: "What Did It Actually Do?",
      story:
        'Chloe: "Okay, so what did it actually do to get there?"\nMaya: "Let\'s pull the trajectory — every tool call it made, in order."\nChloe: "...it went straight from looking up the order to canceling it. It never checked eligibility at all."\nMaya: "Exactly. Southwear\'s policy requires that check before refunding an order that already shipped."',
      body: (
        <p>
          Southwear&rsquo;s policy requires five calls, in order, for a cancel-and-refund
          request: look up the order, check return eligibility, cancel it, issue the refund, and
          confirm with the customer. The assistant&rsquo;s actual trajectory skipped one.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-md mx-auto space-y-1">
          <div className="text-neutral-700">Required: Look up order → Check return eligibility → Cancel order → Issue refund → Send confirmation</div>
          <div className="text-red-700 mt-1">Actual: Look up order → Cancel order → Issue refund → Send confirmation</div>
        </div>
      ),
    },
    {
      section: "1. Diagnosing the Failure",
      title: "The Successful, Confident, Risky Resolution",
      story:
        'Chloe: "But it still canceled the order and refunded the money. Isn\'t that the goal?"\nMaya: "It is, for this one ticket. But the order had already shipped — the eligibility check exists to catch exactly that before refunding."\nChloe: "So we refunded $84.50, and the customer keeps the item too?"\nMaya: "That\'s the risk this trajectory took on. Nothing in the ticket log shows it."',
      body: (
        <p>
          Skipping the eligibility check didn&rsquo;t make the final answer wrong from the
          customer&rsquo;s side — they got exactly what they asked for. But the order had already
          shipped, and the policy exists to catch that case before refunding. The outcome hides
          the process that produced it.
        </p>
      ),
      visual: (
        <div className="bg-white border border-amber-300 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">Order #4471: already shipped 2 days ago.</div>
          <div className="text-amber-700 font-medium">Refunded in full, with no return required — Southwear now has neither the item nor the money.</div>
        </div>
      ),
    },
    // -------------------- 2. Evaluating the Trajectory --------------------
    {
      section: "2. Evaluating the Trajectory",
      title: "Evaluating the Trajectory, Separately From the Outcome",
      story:
        'Chloe: "How do we catch this before it happens on more tickets?"\nMaya: "Same principle as retrieval quality — check the process on its own, completely separately from whether the customer ended up happy."\nChloe: "Why not just grade the final result?"\nMaya: "Because a happy customer and a broken process just showed up on the exact same ticket."',
      body: (
        <p>
          A trajectory is graded against a reference trajectory — the sequence of tool calls the
          task actually required — independent of whether the final outcome looks fine. This
          catches process problems an outcome-only check can&rsquo;t see.
        </p>
      ),
      visual: <AgentTrajectoryDiagram highlight="trajectory" />,
    },
    {
      section: "2. Evaluating the Trajectory",
      title: "Matching the Actual Trajectory Against the Required One",
      story:
        'Maya: "Same idea as matching claims against a reference answer — just applied to tool calls instead of sentences."\nChloe: "So line them up and see what matches."',
      body: (
        <p>
          Line up the assistant&rsquo;s actual tool calls against the five the policy requires.
          Four of them match. One required call — check return eligibility — never happened.
        </p>
      ),
      visual: (
        <div className="max-w-md mx-auto grid sm:grid-cols-2 gap-2 text-base">
          <div className="space-y-1">
            <div className="text-neutral-500 text-sm mb-1">Required (5)</div>
            {["Look up order", "Check return eligibility", "Cancel order", "Issue refund", "Send confirmation"].map((l) => (
              <div key={l} className="bg-white border border-neutral-200 rounded-md p-1.5 text-center">{l}</div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="text-neutral-500 text-sm mb-1">Actual (4)</div>
            <div className="bg-emerald-50 border border-emerald-300 rounded-md p-1.5 text-center">Look up order</div>
            <div className="bg-red-50 border border-red-300 rounded-md p-1.5 text-center text-red-700">— never called —</div>
            <div className="bg-emerald-50 border border-emerald-300 rounded-md p-1.5 text-center">Cancel order</div>
            <div className="bg-emerald-50 border border-emerald-300 rounded-md p-1.5 text-center">Issue refund</div>
            <div className="bg-emerald-50 border border-emerald-300 rounded-md p-1.5 text-center">Send confirmation</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Evaluating the Trajectory",
      title: "TP, FP, FN — Applied to Tool Calls",
      story:
        'Chloe: "This is the same TP, FP, FN thing from Metrics, right? Just tool calls instead of claims?"\nMaya: "Exactly the same three categories. Only what\'s being counted changes."',
      body: (
        <div className="space-y-2">
          <p>The same categories from claims-based scoring apply directly to tool calls:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>TP</strong> — a required call the assistant actually made.</li>
            <li><strong>FP</strong> — a call the assistant made that wasn&rsquo;t required.</li>
            <li><strong>FN</strong> — a required call the assistant never made.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="flex items-center justify-center gap-2 text-base">
          <div className="bg-emerald-50 border border-emerald-300 rounded-md p-2 text-center max-w-32">
            <div className="font-semibold text-emerald-700">TP: 4</div>
            <div className="text-neutral-600 text-sm">look up, cancel, refund, confirm</div>
          </div>
          <div className="bg-amber-50 border border-amber-300 rounded-md p-2 text-center max-w-32">
            <div className="font-semibold text-amber-700">FP: 0</div>
            <div className="text-neutral-600 text-sm">nothing extra called</div>
          </div>
          <div className="bg-red-50 border border-red-300 rounded-md p-2 text-center max-w-32">
            <div className="font-semibold text-red-700">FN: 1</div>
            <div className="text-neutral-600 text-sm">eligibility check</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Evaluating the Trajectory",
      title: "Step Precision: Was Everything It Did Necessary?",
      story:
        'Chloe: "So precision says everything\'s fine?"\nMaya: "Precision only ever looks at what it did do. It has no way to see what it skipped."',
      body: (
        <div className="space-y-2">
          <p>Step precision asks: of every call the assistant actually made, how many were required?</p>
          <Equation tex={"\\text{Step precision} = \\frac{TP}{TP + FP}"} />
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">TP: 4 · FP: 0</div>
          <div className="text-cyan-700 font-medium">Step precision: 4 / (4 + 0) = 1.0 — nothing here reveals a problem.</div>
        </div>
      ),
    },
    {
      section: "2. Evaluating the Trajectory",
      title: "Step Recall: Did It Do Everything Required?",
      story:
        'Maya: "Recall asks the opposite question — not what it did, but what it left out."\nChloe: "And that\'s where the eligibility check shows up."',
      body: (
        <div className="space-y-2">
          <p>Step recall asks: of every call the task required, how many did the assistant actually make?</p>
          <Equation tex={"\\text{Step recall} = \\frac{TP}{TP + FN}"} />
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">TP: 4 · FN: 1</div>
          <div className="text-purple-700 font-medium">Step recall: 4 / (4 + 1) = 0.8 — the skipped call is exactly what recall catches.</div>
        </div>
      ),
    },
    {
      section: "2. Evaluating the Trajectory",
      title: "Trajectory F1: One Number, and Its Limit",
      story:
        'Chloe: "So we combine them like before? F1?"\nMaya: "Same formula, same reason — neither number alone tells the whole story."\nChloe: "0.89 sounds pretty close to fine, though."\nMaya: "That\'s exactly the trap. A threshold is supposed to catch failures — a score this high can still slide past it."',
      body: (
        <div className="space-y-2">
          <p>Trajectory F1 combines them the same way correctness combined precision and recall over claims:</p>
          <Equation tex={"F_1 = \\frac{2 \\cdot \\text{Step precision} \\cdot \\text{Step recall}}{\\text{Step precision} + \\text{Step recall}}"} />
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-700">Step precision: 1.0 · Step recall: 0.8</div>
          <div className="text-cyan-700 font-medium">Trajectory F1 ≈ 0.89 — high enough to slide past a coarse pass/fail threshold.</div>
        </div>
      ),
    },
    // -------------------- 3. Task Success vs. Trajectory Correctness --------------------
    {
      section: "3. Task Success vs. Trajectory Correctness",
      title: "Task Success: Measured Completely Separately",
      story:
        'Chloe: "What about just asking: did the customer get what they wanted?"\nMaya: "That\'s task success, and it\'s measured completely separately from the trajectory."\nChloe: "So what does task success say about this ticket?"\nMaya: "By itself? That everything worked."',
      body: (
        <p>
          Task success asks a single outcome question: did the customer&rsquo;s actual goal get
          accomplished? Here, the order was canceled and the refund was issued — task success is
          a clean yes, with no visibility into how it got there.
        </p>
      ),
      visual: (
        <div className="bg-white border border-emerald-300 rounded-md p-2.5 text-base max-w-sm mx-auto text-center">
          <div className="text-emerald-700 font-medium">Task success: ✓</div>
          <div className="text-neutral-500 text-sm mt-0.5">order canceled, refund issued</div>
        </div>
      ),
    },
    {
      section: "3. Task Success vs. Trajectory Correctness",
      title: "Why the Two Can Disagree",
      story:
        'Chloe: "So task success says yes, trajectory F1 says 0.89. Which one do you trust?"\nMaya: "Both — for different questions. And it can go the other way too: a perfect trajectory can still end in a failed task."\nChloe: "Like a payment gateway just declining the refund?"\nMaya: "Exactly that. Right process, and it can still fail on the very last step."',
      body: (
        <div className="space-y-2">
          <p>Task success and trajectory correctness measure different things, and can disagree in either direction:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>High task success, low trajectory score — a shortcut that happened to still work out, like this ticket.</li>
            <li>Perfect trajectory, task failure — every call correct and in order, but an external tool (a payment gateway, a warehouse system) itself failed on the last step.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    // -------------------- 4. What Precision and Recall Still Miss --------------------
    {
      section: "4. What Precision and Recall Still Miss",
      title: "What Precision and Recall Still Miss",
      story:
        'Chloe: "Okay, so if precision and recall look perfect, we\'re actually safe?"\nMaya: "Not quite. They check which calls happened. They don\'t check how many times each one happened, or what order they happened in."',
      body: (
        <p>
          Step precision and recall only compare two things: which tool calls happened, and which
          tool calls were required. Two failure patterns can still score perfectly on both. One is
          the right calls happening in the wrong order. The other is the same call repeated more
          times than needed.
        </p>
      ),
      visual: undefined,
    },
    {
      section: "4. What Precision and Recall Still Miss",
      title: "Same Calls, Wrong Order",
      story:
        'Chloe: "Why would the order even matter, if all the right calls happened?"\nMaya: "Watch this trajectory. It has the same five calls, and all five are required. But it issues the refund before it actually cancels the order."\nChloe: "So the refund goes out first?"\nMaya: "Right. The warehouse doesn\'t know about the refund yet. It might still ship the order — or ship it again."',
      body: (
        <p>
          This trajectory scores a perfect 1.0 on both step precision and step recall. Every
          required call happened, and nothing extra was added. But the refund happens before the
          cancellation. During that gap, the order can still get shipped.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-md mx-auto space-y-1">
          <div className="text-neutral-700">
            Look up order → Check eligibility → <span className="text-red-700 font-medium">Issue refund</span> →{" "}
            <span className="text-red-700 font-medium">Cancel order</span> → Send confirmation
          </div>
          <div className="text-cyan-700 font-medium mt-1">Step precision: 1.0 · Step recall: 1.0</div>
          <div className="text-red-700">Refunded before canceled — the warehouse can still ship it.</div>
        </div>
      ),
    },
    {
      section: "4. What Precision and Recall Still Miss",
      title: "The Same Call, Too Many Times",
      story:
        'Chloe: "What about repeating a call?"\nMaya: "Same idea. Imagine the order lookup fails three times in a row. The assistant just keeps calling it again, instead of stopping to check what went wrong."\nChloe: "But it eventually gets everything right?"\nMaya: "Eventually, yes — but that took eight tool calls instead of five, for one routine cancellation."',
      body: (
        <p>
          If you only count which tool <em>types</em> were called, this trajectory also scores a
          perfect 1.0 on both. Every required type shows up, and nothing unrequired was added. But
          it still made three redundant calls. That nearly doubled the latency and cost of the
          ticket.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-md mx-auto space-y-1">
          <div className="text-neutral-700">Look up order ×4 → Check eligibility → Cancel order → Issue refund → Send confirmation</div>
          <div className="text-cyan-700 font-medium mt-1">Step precision: 1.0 · Step recall: 1.0</div>
          <div className="text-amber-700">8 tool calls instead of 5 — nearly double the cost, for one cancellation.</div>
        </div>
      ),
    },
    {
      section: "4. What Precision and Recall Still Miss",
      title: "Saying vs. Doing: Trajectory Faithfulness",
      story:
        'Chloe: "Is there anything that precision and recall can\'t see, because it isn\'t a tool call at all?"\nMaya: "Yes — the assistant\'s own explanation of what it did. Look at the actual closing message on ticket #4471."\nChloe: "\'I\'ve confirmed this qualifies for an immediate refund under our return policy.\' ...but it never called the eligibility check."\nMaya: "Right. That sentence describes a step that never happened."',
      body: (
        <div className="space-y-2">
          <p>
            Faithfulness checks whether an answer&rsquo;s claims are supported by the retrieved
            source. Trajectory faithfulness checks the same way, but for actions instead of
            claims: it checks whether the assistant&rsquo;s own explanation is supported by its
            actual tool calls.
          </p>
          <Equation tex={"\\text{Trajectory faithfulness} = \\frac{\\text{claimed actions actually taken}}{\\text{claimed actions}} = \\frac{TP}{TP + FP}"} />
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-md mx-auto space-y-1">
          <div className="text-neutral-700">Closing message: &ldquo;I&rsquo;ve confirmed this qualifies under our return policy.&rdquo;</div>
          <div className="text-neutral-500">1 claim made about a check — 0 of the trajectory&rsquo;s calls support it.</div>
          <div className="text-red-700 font-medium">Trajectory faithfulness: 0 / 1 = 0.0</div>
        </div>
      ),
    },
    // -------------------- 5. Diagnosing in Practice --------------------
    {
      section: "5. Diagnosing in Practice",
      title: "Putting the Full Diagnosis Together",
      story:
        'Chloe: "So how many things do we actually have to check now?"\nMaya: "Four, in order — each one catches something the last one couldn\'t."\nChloe: "Lay it out for me."',
      body: (
        <p>
          Diagnosing an agent&rsquo;s resolution means checking four things in order, since each
          one is blind to a different failure the ones before it can miss.
        </p>
      ),
      visual: (
        <div className="max-w-sm mx-auto space-y-1.5 text-base">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center">Task success looks fine</div>
          <div className="text-center text-neutral-300">↓</div>
          <div className="bg-white border border-purple-300 rounded-md p-2.5 text-center">Step precision / recall vs. the required trajectory</div>
          <div className="text-center text-neutral-300">↓ that checks out too</div>
          <div className="bg-white border border-amber-300 rounded-md p-2.5 text-center">Right order, no redundant calls?</div>
          <div className="text-center text-neutral-300">↓ that checks out too</div>
          <div className="bg-white border border-cyan-300 rounded-md p-2.5 text-center">Trajectory faithfulness: does the explanation match the log?</div>
        </div>
      ),
    },
    // -------------------- 6. Try It Yourself --------------------
    {
      section: "6. Try It Yourself",
      title: "Try it yourself: diagnose ticket #4471",
      body: (
        <p>
          Toggle which tool calls the assistant actually made, and watch step precision and
          recall recompute. Add the eligibility check to see recall reach 1.0, or add the
          (unrequired) shipping-policy check to see precision drop instead.
        </p>
      ),
      controls: (
        <div className="w-full space-y-1.5">
          {ACTIONS.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-base text-neutral-700">
              <input
                type="checkbox"
                checked={done[a.id]}
                onChange={(e) => setDone((d) => ({ ...d, [a.id]: e.target.checked }))}
              />
              {a.label}
              {!a.required && <span className="text-sm text-amber-700">(not required for this ticket)</span>}
            </label>
          ))}
        </div>
      ),
      resetAction: resetDone,
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-cyan-700 font-medium">
            Step precision: {precision === null ? "n/a" : `${tp}/${tp + fp} = ${precision.toFixed(2)}`}
          </div>
          <div className="text-purple-700 font-medium">
            Step recall: {tp}/{totalRequired} = {recall.toFixed(2)}
          </div>
        </div>
      ),
    },
    // -------------------- 7. Wrap-up --------------------
    {
      section: "7. Wrap-up",
      title: "What you just learned",
      story:
        'Maya: "So — same lesson as always, one more layer down: don\'t trust the outcome alone."\nChloe: "Yeah, I would\'ve closed that ticket without a second thought."\nMaya: "That\'s exactly why the trajectory gets checked separately. Recap time?"\nChloe: "Go."',
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A task can succeed by outcome while its trajectory skipped a required step — outcome and process are checked separately, same principle as retrieval quality.</li>
            <li>Step precision (TP/(TP+FP)) asks whether every call the agent made was necessary; step recall (TP/(TP+FN)) asks whether every required call was actually made.</li>
            <li>Trajectory F1 combines them into one number, but a high F1 can still hide a real gap — the same trap as correctness&rsquo;s partial credit.</li>
            <li>Task success and trajectory correctness can diverge in either direction: a shortcut that still works, or a perfect process undone by one tool failing.</li>
            <li>Step precision and recall can&rsquo;t see order or repetition — the right calls, wrong sequence or needlessly duplicated, both score perfectly.</li>
            <li>Trajectory faithfulness checks whether the agent&rsquo;s own explanation matches what its tool calls actually show — the same faithfulness idea, applied to the agent&rsquo;s account of itself.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "7. Wrap-up",
      title: "Closing: The Same Discipline, Every Time",
      story:
        'Chloe: "So is that the whole toolkit now? Every way to check whether an AI system actually works?"\nMaya: "From one LLM call, to search, to a full agent — yeah. Same discipline every time: never trust the final output by itself."\nChloe: "Never take the fluent, confident answer at face value."\nMaya: "Exactly that."',
      body: (
        <p>
          This chapter closes the Evaluation module: a single call, a RAG pipeline, and now a
          full agent all get checked the same way — verify the process that produced an answer,
          not just the answer itself.
        </p>
      ),
      visual: undefined,
    },
  ];

  const total = steps.length;
  const [step, setStep] = useState(() => {
    if (initialStep === undefined) return 0;
    return initialStep < 0 ? total - 1 : Math.min(initialStep, total - 1);
  });
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => {
    if (isLast) {
      onComplete?.();
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-sm uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          {isFirst ? (
            <a
              href="/evaluation/rag"
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              ← Back to RAG Evaluation
            </a>
          ) : (
            <button
              onClick={goBack}
              className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 text-base text-neutral-700"
            >
              Back
            </button>
          )}
          <button onClick={goNext} className={nextBtn}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
        <span className="text-sm text-neutral-500 sm:flex-1 sm:text-right">
          Step {step + 1} of {total}
        </span>
      </div>

      <SegmentedProgressBar sections={steps.map((s) => s.section)} currentStep={step} onSelectStep={setStep} />

      <div className="space-y-4">
        {current.story && (
          <div className="pb-3 border-b border-neutral-200">
            <StoryLine text={current.story} />
          </div>
        )}

        <h3 className="text-xl font-medium text-neutral-900">{current.title}</h3>
        <div className="text-base text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
          </div>
        )}
        {current.resetAction && (
          <button onClick={current.resetAction} className="text-sm text-neutral-500 hover:text-neutral-800">
            ↺ Undo / reset this step
          </button>
        )}

        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
