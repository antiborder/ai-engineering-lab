"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StoryLine } from "@/components/StoryLine";
import { Equation } from "@/components/Equation";

const REFERENCE = "Worn or tag-removed items only get a partial refund or store credit, not a full refund.";
const DEFAULT_A = "Yes, as long as it's within 30 days, you'll get a full refund.";
const DEFAULT_B = "Worn items get a 70% refund, not a full refund.";

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let shared = 0;
  wordsA.forEach((w) => { if (wordsB.has(w)) shared += 1; });
  return shared / Math.max(wordsA.size, wordsB.size);
}

/** Module 3 (Evaluation), Unit "Evaluation Basics", Chapter 3 of 3. This
 * is the reveal Chapter 2 set up: exact match flagged the bug that went
 * live, but only because it happened to be worded very differently — it
 * isn't a targeted signal. This Chapter shows a sneakier version of the
 * same bug (a fabricated "70% refund" figure, worded close to the real
 * answer) that a naive similarity check would miss, and faithfulness
 * catches. Ends bridging into Unit "Judging & Comparing" (computing
 * faithfulness well needs real judgment, i.e. an LLM judge). */
export function MetricsWalkthrough({
  onComplete,
  initialStep,
  onBackToPreviousChapter,
}: {
  onComplete?: () => void;
  initialStep?: number;
  onBackToPreviousChapter?: () => void;
}) {
  const [answerA, setAnswerA] = useState(DEFAULT_A);
  const [answerB, setAnswerB] = useState(DEFAULT_B);
  const resetAnswers = () => {
    setAnswerA(DEFAULT_A);
    setAnswerB(DEFAULT_B);
  };

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

  const scoreRow = (label: string, answer: string) => {
    const exact = answer.trim().toLowerCase() === REFERENCE.trim().toLowerCase();
    const overlap = wordOverlap(answer, REFERENCE);
    return (
      <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base space-y-1">
        <div className="text-neutral-500 font-medium">{label}</div>
        <div className="text-neutral-800">{answer}</div>
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
          <span className="text-neutral-500">Exact match</span>
          <span className={exact ? "text-emerald-700 font-medium" : "text-red-700 font-medium"}>{exact ? "✓ true" : "✗ false"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-500">Word overlap</span>
          <span className="text-cyan-700 font-medium">{Math.round(overlap * 100)}%</span>
        </div>
      </div>
    );
  };

  /** The TP/FP/FN/TN idea as an actual 2x2 table — candidate columns
   * against expected-answer rows — with different cells dimmed per Step,
   * same highlight/dim technique as PipelineDiagram. TN stays permanently
   * dimmed: claims-based scoring never uses it (there&rsquo;s no fixed list
   * of "things neither text mentions" to count). */
  const claimGrid = (focus: Array<"TP" | "FP" | "FN">) => {
    const dim = (key: "TP" | "FP" | "FN") => (focus.includes(key) ? "" : "opacity-30");
    return (
      <div className="max-w-sm mx-auto space-y-1">
        <div className="flex items-center gap-1 text-sm text-neutral-500">
          <div className="w-32" />
          <div className="flex-1 text-center">In candidate</div>
          <div className="flex-1 text-center">Not in candidate</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-32 text-sm text-neutral-500 text-right pr-1">In expected answer</div>
          <div className={`flex-1 bg-emerald-50 border border-emerald-300 rounded-md p-2 text-center text-base ${dim("TP")}`}>
            <div className="font-semibold text-emerald-700">TP</div>
            <div className="text-neutral-600 text-sm">in both</div>
          </div>
          <div className={`flex-1 bg-red-50 border border-red-300 rounded-md p-2 text-center text-base ${dim("FN")}`}>
            <div className="font-semibold text-red-700">FN</div>
            <div className="text-neutral-600 text-sm">expected only</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-32 text-sm text-neutral-500 text-right pr-1">Not in expected answer</div>
          <div className={`flex-1 bg-amber-50 border border-amber-300 rounded-md p-2 text-center text-base ${dim("FP")}`}>
            <div className="font-semibold text-amber-700">FP</div>
            <div className="text-neutral-600 text-sm">candidate only</div>
          </div>
          <div className="flex-1 bg-neutral-50 border border-neutral-300 rounded-md p-2 text-center text-base opacity-30">
            <div className="font-semibold text-neutral-700">TN</div>
            <div className="text-neutral-600 text-sm">not used</div>
          </div>
        </div>
      </div>
    );
  };

  const steps: Step[] = [
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>We already ran the bug through the pipeline. This chapter finds the metric that catches it, and surveys the rest:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Matching Metrics</strong> — exact match and semantic similarity, and where each is blind.</li>
            <li><strong>Judging Correctness</strong> — correctness, faithfulness, and relevancy: three different questions, three different formulas.</li>
            <li><strong>Cost</strong> — latency, tokens, and price, measured separately from quality.</li>
            <li><strong>Choosing a Metric</strong> — matching the metric to the task.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The Big Picture: Not Every Metric Would Have Caught This",
      story:
        'Chloe: "So we\'ve got the pipeline built and running — this is basically done, right?"\nMaya: "Not quite. Exact match caught our bug last chapter, but only because the wrong answer happened to be worded totally differently."\nChloe: "So what if it wasn\'t?"\nMaya: "That\'s exactly the sneaky version I want to show you — same bug, but worded a lot closer to the real answer."\nChloe: "Let\'s see if exact match still catches it."',
      body: (
        <p>
          Exact match flagged the bug that went live — but only because it happened to be worded
          very differently from the right answer. A sneakier version of the same bug, worded
          closer to correct, would slip past a naive check. This chapter finds the metric that
          wouldn&rsquo;t miss it.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-1.5 text-sm flex-wrap">
          {["Exact match", "Semantic similarity", "Correctness", "Faithfulness", "Retrieval quality", "Latency", "Tokens", "Cost"].map((m) => (
            <span key={m} className="px-2.5 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800">{m}</span>
          ))}
        </div>
      ),
    },
    // -------------------- 1. Matching Metrics --------------------
    {
      section: "1. Matching Metrics",
      title: "Exact Match: Strict and Brittle",
      story:
        'Chloe: "Okay, run the original bug through it — does exact match even catch it?"\nMaya: "It does. But watch closely — I don\'t think it\'s catching it for the reason you\'d expect."',
      body: (
        <p>
          Exact match checks whether the output is
          character-for-character identical to the expected answer. It flagged the bug that went
          live — but it would just as easily flag a correctly-worded paraphrase. It isn&rsquo;t a
          targeted signal for this kind of bug.
        </p>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
          <div className="text-red-700">&ldquo;Yes, you&rsquo;ll get a full refund.&rdquo; vs. &ldquo;...only a partial refund or store credit.&rdquo;</div>
          <div className="text-neutral-400 mt-1">✗ not exact — but so would a correct paraphrase.</div>
        </div>
      ),
    },
    {
      section: "1. Matching Metrics",
      title: "Semantic Similarity: A Sneakier Version of the Same Bug",
      story:
        'Chloe: "Okay, so if exact match is too strict, what if we just check meaning instead of exact wording?"\nMaya: "That\'s semantic similarity — and yeah, it fixes the paraphrase problem."\nChloe: "So we\'re done? That\'s the fix?"\nMaya: "Not quite. Watch what happens with a sneakier version of the bug."',
      body: (
        <div className="space-y-2">
          <p>
            Semantic similarity scores meaning over exact wording. Each answer is turned into an{" "}
            embedding — a list of numbers — and the two
            embeddings&rsquo; angle is compared:
          </p>
          <Equation tex={"\\text{similarity}(A,B) = \\frac{A \\cdot B}{\\|A\\| \\, \\|B\\|}"} />
          <p>
            Closer to 1 means closer in meaning. Imagine the AI assistant instead said worn
            items get a 70% refund: fluent, on-topic, worded close to the real answer, and still
            wrong.
          </p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto">
          <div className="text-amber-700">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo;</div>
          <div className="text-neutral-500 mt-1">vs. &ldquo;...only a partial refund or store credit.&rdquo;</div>
          <div className="text-neutral-400 mt-1">Similarity: 0.86 — high, but 70% is invented. Still wrong.</div>
        </div>
      ),
    },
    // -------------------- 2. Judging Correctness --------------------
    {
      section: "2. Judging Correctness",
      title: "Breaking the Candidate Into Claims",
      story:
        'Maya: "Similarity likes that 70% answer. It shouldn\'t."\nChloe: "So what actually catches it?"\nMaya: "Hmm — before we can compare them, we need to break this down into smaller pieces first."\nChloe: "Break down the AI\'s answer, you mean?"\nMaya: "Right. Take the sentence Worn items get a 70% refund, not a full refund. That one sentence contains two separate claims:\\n• Worn items do not get a full refund.\\n• Worn items get a 70% refund."\nChloe: "Huh, now that you mention it."\nMaya: "Compare it as one mixed blob, and you can\'t compare it accurately."',
      body: (
        <p>
          When the AI&rsquo;s answer (the <strong>candidate</strong>) or the expected answer
          mixes several claims together, they can&rsquo;t be compared accurately. Break each one
          down into individual <strong>claims</strong> first.
        </p>
      ),
      visual: (
        <div className="max-w-sm mx-auto space-y-2">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center text-base text-neutral-700">
            &ldquo;Worn items get a 70% refund, not a full refund.&rdquo;
          </div>
          <div className="text-center text-neutral-300">↓ split into claims</div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="bg-white border border-neutral-200 rounded-md p-2 text-center text-base text-neutral-700">Worn items do not get a full refund.</div>
            <div className="bg-white border border-neutral-200 rounded-md p-2 text-center text-base text-neutral-700">Worn items get a 70% refund.</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Breaking the Expected Answer Into Claims",
      story:
        'Chloe: "So the expected answer should get split up too, right?"\nMaya: "Right. It was: No — worn items only qualify for a partial refund or store credit, not a full refund. How would you split that one?"\nChloe: "Um... let\'s see:\\n• Worn items do not get a full refund.\\n• Worn items qualify for a partial refund.\\n• Worn items qualify for store credit.\\nLike that?"\nMaya: "Yeah, that works. Splitting it that way means you can catch it separately if the AI mentions partial refund but leaves out store credit entirely, say."\nChloe: "Oh, I see."',
      body: (
        <p>
          The expected answer gets the same treatment — broken down into its own individual
          claims.
        </p>
      ),
      visual: (
        <div className="max-w-sm mx-auto space-y-2">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center text-base text-neutral-700">
            &ldquo;No — worn items only qualify for a partial refund or store credit, not a full refund.&rdquo;
          </div>
          <div className="text-center text-neutral-300">↓ split into claims</div>
          <div className="grid sm:grid-cols-3 gap-2">
            <div className="bg-white border border-neutral-200 rounded-md p-2 text-center text-base text-neutral-700">Worn items do not get a full refund.</div>
            <div className="bg-white border border-neutral-200 rounded-md p-2 text-center text-base text-neutral-700">Worn items qualify for a partial refund.</div>
            <div className="bg-white border border-neutral-200 rounded-md p-2 text-center text-base text-neutral-700">Worn items qualify for store credit.</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Matching Claims Between the Two",
      story:
        'Maya: "Now that we\'ve split both into independent claims, let\'s match the AI\'s answer, the candidate, against the expected answer."\nChloe: "So now we can finally compare them."\nMaya: "Right. The candidate has: Worn items do not get a full refund, and Worn items get a 70% refund."\nChloe: "And the expected answer has: Worn items do not get a full refund, Worn items qualify for a partial refund, and Worn items qualify for store credit."\nMaya: "See a claim that shows up on both sides?"\nChloe: "Oh — do not get a full refund! That\'s the part the AI actually got right."\nMaya: "Exactly."',
      body: (
        <p>
          Matching each claim against the other side reveals which ones the candidate actually
          got right — and which ones don&rsquo;t line up at all.
        </p>
      ),
      visual: (
        <div className="max-w-md mx-auto space-y-2">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center text-base text-neutral-700">
            &ldquo;Worn items get a 70% refund, not a full refund.&rdquo;
          </div>
          <div className="text-center text-neutral-300">↓</div>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="bg-emerald-50 border border-emerald-300 rounded-md p-2 text-center text-base text-neutral-700">Worn items do not get a full refund.</div>
            <div className="bg-amber-50 border border-amber-300 rounded-md p-2 text-center text-base text-neutral-700">Worn items get a 70% refund.</div>
          </div>
          <div className="text-center text-emerald-700 font-medium">↕ match</div>
          <div className="grid sm:grid-cols-3 gap-2">
            <div className="bg-emerald-50 border border-emerald-300 rounded-md p-2 text-center text-base text-neutral-700">Worn items do not get a full refund.</div>
            <div className="bg-white border border-neutral-200 rounded-md p-2 text-center text-base text-neutral-700">Worn items qualify for a partial refund.</div>
            <div className="bg-white border border-neutral-200 rounded-md p-2 text-center text-base text-neutral-700">Worn items qualify for store credit.</div>
          </div>
          <div className="text-center text-neutral-300">↑</div>
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center text-base text-neutral-700">
            &ldquo;No — worn items only qualify for a partial refund or store credit, not a full refund.&rdquo;
          </div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "TP, FP, FN: Applying It to Claims",
      story:
        'Chloe: "What about a claim that\'s only on one side? Does that automatically mean it\'s wrong?"\nMaya: "That\'s exactly what needs sorting out next."\nMaya: "Let\'s sort our example by which side each claim is on:\\n1. In both: Worn items do not get a full refund.\\n2. In the expected answer but not the candidate: Worn items qualify for a partial refund, and Worn items qualify for store credit.\\n3. In the candidate but not the expected answer: Worn items get a 70% refund."\nChloe: "So claims that show up on both sides are ones the AI answered correctly, right?"\nMaya: "Exactly. Those fall into a category called TP — True Positive."\nChloe: "In our example, that\'s Worn items do not get a full refund."',
      body: (
        <p>
          <strong>TP</strong> stands for True Positive: a claim that shows up in both the
          candidate and the expected answer — the part the AI actually got right.
        </p>
      ),
      visual: claimGrid(["TP"]),
    },
    {
      section: "2. Judging Correctness",
      title: "Precision: Of What It Claimed, How Much Was Right?",
      story:
        'Chloe: "So then, more TP is better?"\nMaya: "Close, but it\'s not simply \'more TP is better.\'"\nMaya: "It\'s not just about answering correctly — not answering incorrectly matters too."\nChloe: "Huh? Aren\'t those the same thing?"\nMaya: "Let\'s untangle that. In the table below, a correct claim is TP, and a wrong one is FP."\nChloe: "So saying something not in the expected answer, like Worn items get a 70% refund, that\'s FP?"\nMaya: "Right. And the share of everything the AI said that\'s actually correct — that\'s Precision."',
      body: (
        <div className="space-y-2">
          <p>
            Precision asks: of every claim the candidate made, how many were actually correct?
          </p>
          <Equation tex={"\\text{Precision} = \\frac{TP}{TP + FP}"} />
          <p>
            A candidate that pads its answer with invented claims drives FP up and precision
            down, even if everything true is also in there.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          {claimGrid(["TP", "FP"])}
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
            <div className="text-neutral-500">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo;</div>
            <div className="text-neutral-700">TP: 1 (&ldquo;not a full refund&rdquo;) · FP: 1 (&ldquo;70%&rdquo;)</div>
            <div className="text-cyan-700 font-medium">Precision: 1 / (1 + 1) = 0.5</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Recall: Of What It Should Have Said, How Much Made It In?",
      story:
        'Chloe: "So then, we just need to raise precision?"\nMaya: "Here\'s the thing — precision alone isn\'t enough."\nChloe: "Huh? There\'s more?"\nMaya: "Think about it — if the AI only says the things it\'s absolutely sure are correct, and stays silent on everything else, precision comes out to a perfect 100."\nChloe: "Being careful makes you go quiet, huh."\nMaya: "Same for an AI assistant. So keeping down what\'s written in the expected answer but the AI never said — that matters too."\nChloe: "Oh, in the diagram, that\'s FN."\nMaya: "Right. And the share of everything in the expected answer that the AI actually said — that\'s recall."\nChloe: "So it\'s how much the AI actually remembered to say."',
      body: (
        <div className="space-y-2">
          <p>
            Recall asks: of every claim the expected answer makes, how many did the candidate
            actually include?
          </p>
          <Equation tex={"\\text{Recall} = \\frac{TP}{TP + FN}"} />
          <p>
            A candidate that leaves out key facts drives FN up and recall down, even if nothing
            it did say was wrong.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-2">
          {claimGrid(["TP", "FN"])}
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
            <div className="text-neutral-500">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo;</div>
            <div className="text-neutral-700">TP: 1 (&ldquo;not a full refund&rdquo;) · FN: 2 (&ldquo;partial refund&rdquo;, &ldquo;store credit&rdquo;)</div>
            <div className="text-cyan-700 font-medium">Recall: 1 / (1 + 2) ≈ 0.33</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Correctness: Turning Precision and Recall Into One Score",
      story:
        'Chloe: "So we need to raise both precision and recall?"\nMaya: "Right. But an AI is just like a person here — answer more assertively, and mistakes creep in, dragging precision down."\nMaya: "And play it safe to avoid mistakes, and it says less, dragging recall down instead."\nChloe: "Wow, that\'s so human! Can\'t we just raise both at once?"\nMaya: "Well, it comes down to which one you prioritize — but the commonly used approach is a metric that splits the difference between the two: F1."',
      body: (
        <div className="space-y-2">
          <p>
            F1 is the harmonic mean of precision and recall, weighting them equally. The
            &ldquo;F&rdquo; comes from the <strong>F-measure</strong>, a formula for combining
            precision and recall introduced by C. J. van Rijsbergen in the 1970s and now standard
            across search, spam filtering, and classification generally. The &ldquo;1&rdquo;
            means precision and recall count the same — a different F-score could weight one
            more than the other:
          </p>
          <Equation tex={"F_1 = \\frac{2 \\cdot \\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}} = \\frac{TP}{TP + 0.5\\,(FP + FN)}"} />
        </div>
      ),
      visual: (
        <div className="space-y-2">
          {claimGrid(["TP", "FP", "FN"])}
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
            <div className="text-neutral-500">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo;</div>
            <div className="text-neutral-700">Precision: 0.5 · Recall: 0.33</div>
            <div className="text-cyan-700 font-medium">Correctness (F1): 0.4 — partial credit</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Faithfulness: Is It Supported by the Source?",
      story:
        'Chloe: "Wait, is faithfulness related to correctness, or a totally different thing?"\nMaya: "Same idea — same claims, same TP and FP. Just checked against a different target."',
      body: (
        <div className="space-y-2">
          <p>
            Faithfulness reuses precision&rsquo;s formula, but checks claims against the{" "}
            <strong>reference</strong> (the actual doc) instead of the expected answer:
          </p>
          <Equation tex={"\\text{Faithfulness} = \\frac{\\text{supported claims}}{\\text{total claims}} = \\frac{TP}{TP+FP}"} />
          <p>
            There&rsquo;s no recall side to this one. Recall would mean restating everything in
            the reference — but a good answer isn&rsquo;t expected to repeat the whole document,
            so there&rsquo;s no meaningful &ldquo;missed claim&rdquo; to count.
          </p>
          <p>
            Correctness and faithfulness land on the same score here, because the expected answer
            happens to match the reference. That won&rsquo;t always hold — if the expected answer
            were ever written wrong, correctness would be fooled by it, but faithfulness, checked
            straight against the source, wouldn&rsquo;t be.
          </p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-500">&ldquo;Worn items get a 70% refund, not a full refund.&rdquo; vs. the doc: &ldquo;...partial refund or store credit, not a full refund, at Southwear&rsquo;s discretion.&rdquo;</div>
          <div className="text-neutral-700">TP: 1 (&ldquo;not a full refund&rdquo; — the doc says this) · FP: 1 (&ldquo;70%&rdquo; — no percentage anywhere in the doc)</div>
          <div className="text-purple-700 font-medium">Faithfulness: 1 / (1 + 1) = 0.5</div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Relevancy: A Different Question Than Correctness",
      story:
        'Chloe: "What if the answer\'s totally true, just... not really about what I asked?"\nMaya: "That\'s a third thing — relevancy."',
      body: (
        <div className="space-y-2">
          <p>
            Answer relevancy checks whether the answer is actually about the question asked —
            a separate question from whether it&rsquo;s true, which correctness and
            faithfulness already check.
          </p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-500">Q: &ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
          <div className="text-neutral-800">A: &ldquo;Southwear accepts returns within 30 days of delivery.&rdquo;</div>
          <div className="text-purple-700 font-medium">True and faithful — but never mentions worn items</div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Why Not Just Compare the Question to the Answer?",
      story:
        'Chloe: "Can\'t we just check how close the answer is to the question?"\nMaya: "You\'d think so — but that doesn\'t actually work."',
      body: (
        <div className="space-y-2">
          <p>
            Embedding models place similar meanings close together. But a question and its
            correct answer aren&rsquo;t paraphrases of each other — their embeddings often
            land far apart even for a perfect answer.
          </p>
          <p>
            Comparing the question straight to the answer would score a great answer as
            &ldquo;dissimilar,&rdquo; just because a question and an answer are different
            kinds of text.
          </p>
        </div>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3 text-base">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center max-w-32">
            <div className="font-medium text-neutral-700">Question</div>
            <div className="text-neutral-500 text-sm mt-0.5">&ldquo;How many days...?&rdquo;</div>
          </div>
          <div className="text-neutral-400 text-sm text-center max-w-24">far apart, even when correct</div>
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-center max-w-32">
            <div className="font-medium text-neutral-700">Answer</div>
            <div className="text-neutral-500 text-sm mt-0.5">&ldquo;30 days&rdquo;</div>
          </div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "The Fix: Reconstruct Questions From the Answer",
      story:
        'Chloe: "Okay, so comparing question to answer doesn\'t work. Now what?"\nMaya: "What if we made both sides the same kind of text?"\nChloe: "How would you even do that?"\nMaya: "Let\'s see."',
      body: (
        <div className="space-y-2">
          <p>
            An LLM reads only the candidate answer — not the original question — and
            guesses N different questions it could be answering. Each guess is a
            &ldquo;reconstructed question&rdquo;; the <em>i</em>-th one just means the i-th
            guess out of N.
          </p>
          <p>
            Comparing question to question, instead of question to answer, keeps both sides
            the same kind of text.
          </p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-500">Original Q: &ldquo;Can I get a refund if I&rsquo;ve already worn the item?&rdquo;</div>
          <div className="text-neutral-800">A: &ldquo;Southwear accepts returns within 30 days of delivery.&rdquo;</div>
          <div className="text-neutral-600 mt-1">Guessed from A: (1) &ldquo;What is Southwear&rsquo;s return window?&rdquo; (2) &ldquo;How many days do I have to return something?&rdquo;</div>
        </div>
      ),
    },
    {
      section: "2. Judging Correctness",
      title: "Relevancy: Averaging the Similarities",
      story: 'Chloe: "And then?"\nMaya: "Then it\'s the same trick as before — just applied a little differently."',
      body: (
        <div className="space-y-2">
          <p>
            Each reconstructed question is measured against the original by cosine
            similarity, then averaged over all N guesses:
          </p>
          <Equation tex={"\\text{Relevancy} = \\frac{1}{N}\\sum_{i=1}^{N} \\cos(E_{g_i}, E_o)"} />
          <p>
            <strong>E_o</strong> is the embedding of the original question. <strong>E_gi</strong>{" "}
            is the embedding of the i-th guessed question.
          </p>
          <p>
            If the guesses land far from the original question, the answer drifted
            off-topic — even if every word in it is true.
          </p>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1">
          <div className="text-neutral-500">Guessed from A: (1) &ldquo;What is Southwear&rsquo;s return window?&rdquo; (2) &ldquo;How many days do I have to return something?&rdquo;</div>
          <div className="text-neutral-700">vs. Original Q: &ldquo;...if I&rsquo;ve already worn the item?&rdquo;</div>
          <div className="text-amber-700 font-medium">Relevancy: 0.31 — neither guess mentions worn items, despite being faithful</div>
        </div>
      ),
    },
    // -------------------- 3. Cost --------------------
    {
      section: "3. Cost",
      title: "Cost Metrics: Latency, Tokens, Price",
      story:
        'Chloe: "Okay, faithfulness, correctness, relevancy... is that everything?"\nMaya: "Everything about whether the answer is good, sure. But a perfect answer that takes ten seconds and costs a fortune isn\'t shippable either."\nChloe: "Oh — so quality isn\'t the only thing being measured."\nMaya: "Right. Cost matters too, and it\'s measured completely separately."',
      body: (
        <p>
          Fixing the bug shouldn&rsquo;t blow the budget. Latency, token{" "}
          usage, and price all affect whether a system is usable in production, alongside
          whether it&rsquo;s faithful.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-sm flex-wrap">
            {["Latency", "Tokens", "Price"].map((m) => (
              <span key={m} className="px-2.5 py-1.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800">{m}</span>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-base">
            <div className="bg-white border border-neutral-200 rounded-md p-2.5">
              <div className="text-neutral-500">Fast, cheap model</div>
              <div className="text-neutral-800 mt-0.5">&ldquo;Store credit.&rdquo; — 200ms, low cost</div>
            </div>
            <div className="bg-white border border-neutral-200 rounded-md p-2.5">
              <div className="text-neutral-500">Slower, pricier model</div>
              <div className="text-neutral-800 mt-0.5">&ldquo;Store credit, or a partial refund to your original payment method, depending on item condition.&rdquo; — 1.4s, higher cost</div>
            </div>
          </div>
        </div>
      ),
    },
    // -------------------- 4. Choosing a Metric --------------------
    {
      section: "4. Choosing a Metric",
      title: "Choosing the Right Metric for the Task",
      story:
        'Chloe: "That\'s... a lot of metrics. Do we run all of them, every time?"\nMaya: "No — you pick based on the task. Not every metric applies to every question."\nChloe: "So how do you know which one to use?"\nMaya: "Match it to what the task actually needs. Let\'s go through it."',
      body: (
        <div className="space-y-2">
          <p>Match the metric to the task — a policy question like this one needs faithfulness:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Fixed-format</strong> (a category, a number) — exact match.</li>
            <li><strong>Open-ended writing</strong> — semantic similarity, plus faithfulness if it draws on a source.</li>
            <li><strong>Is it on-topic?</strong> — answer relevancy, alongside correctness and faithfulness.</li>
            <li><strong>Retrieval-based systems</strong> — a different set of checks entirely, covered in the RAG Evaluation Unit.</li>
            <li><strong>Every system</strong> — cost metrics too, alongside quality.</li>
          </ul>
        </div>
      ),
      visual: (
        <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base max-w-sm mx-auto space-y-1 text-neutral-700">
          <div>Refund timing fact (&ldquo;5–7 business days&rdquo;) — exact match.</div>
          <div>Paraphrased question — semantic similarity.</div>
          <div className="text-purple-700">Worn-item refund bug (&ldquo;can I return a worn item?&rdquo;) — faithfulness. The metric that catches it.</div>
          <div>A true but off-topic answer — answer relevancy.</div>
          <div>Every question — cost metrics too.</div>
        </div>
      ),
    },
    // -------------------- 5. Try It Yourself --------------------
    {
      section: "5. Try It Yourself",
      title: "Try it yourself: score the bug and its sneaky cousin",
      body: (
        <p>
          The reference is the true return policy. Candidate A is the original bug; Candidate B
          is the 70%-refund near-miss. Edit either and watch exact match and word overlap (a
          simple stand-in for semantic similarity) recompute.
        </p>
      ),
      controls: (
        <div className="w-full space-y-2">
          <div className="bg-white border border-neutral-200 rounded-md p-2.5 text-base">
            <div className="text-neutral-500">Reference answer</div>
            <div className="text-neutral-800">{REFERENCE}</div>
          </div>
          <input
            value={answerA}
            onChange={(e) => setAnswerA(e.target.value)}
            placeholder="Candidate A"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
          />
          <input
            value={answerB}
            onChange={(e) => setAnswerB(e.target.value)}
            placeholder="Candidate B"
            className="w-full bg-white border border-neutral-200 rounded-md px-2.5 py-1.5 text-base text-neutral-900"
          />
        </div>
      ),
      resetAction: resetAnswers,
      visual: (
        <div className="grid sm:grid-cols-2 gap-2">
          {scoreRow("Candidate A — the bug", answerA)}
          {scoreRow("Candidate B — the sneaky cousin", answerB)}
        </div>
      ),
    },
    // -------------------- Wrap-up --------------------
    {
      section: "6. Wrap-up",
      title: "What you just learned",
      story:
        'Maya: "So that\'s the whole toolbox — and we already found the one that would\'ve caught our bug."\nChloe: "Faithfulness. Finally, a real answer!"\nMaya: "Before you celebrate, let\'s make sure it all stuck. Quick recap."\nChloe: "Ugh, fine. Hit me."',
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Exact match is strict and cheap, but not a targeted signal — it flags any differently-worded answer, right or wrong.</li>
            <li>Semantic similarity (cosine similarity of embeddings) catches paraphrases, but a fluent, similarly-worded wrong answer can fool it.</li>
            <li>Correctness (an F1 over claims) gives partial credit for overlap with the expected answer — not strict enough on its own.</li>
            <li>Faithfulness (supported claims ÷ total claims — precision, checked against the reference) doesn&rsquo;t depend on the expected answer being written correctly, unlike correctness.</li>
            <li>Answer relevancy catches a true answer that doesn&rsquo;t actually address the question asked.</li>
            <li>Cost metrics (latency, tokens, price) matter too, measured separately from quality.</li>
            <li>The right metric depends on the task — this policy question needed faithfulness specifically.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "6. Wrap-up",
      title: "Next: Computing Faithfulness Well",
      story:
        'Maya: "Faithfulness is what actually catches this, every time — no matter how it\'s worded."\nChloe: "So how do we compute faithfulness well?"\nMaya: "That takes real judgment. Time to bring in an LLM judge."',
      body: (
        <div className="space-y-2">
          <p>
            Everything above is also unlocked below if you want to score your own answers.
            Faithfulness is what catches this bug — but checking agreement with a reference
            reliably needs real judgment, not just string matching. That means using an LLM as a
            judge.
          </p>
          <Link
            href="/evaluation/judging"
            className="inline-block px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white"
          >
            Continue to Judging &amp; Comparing →
          </Link>
        </div>
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
  const goBack = () => {
    if (isFirst && onBackToPreviousChapter) {
      onBackToPreviousChapter();
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-sm uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst && !onBackToPreviousChapter}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-base text-neutral-700"
          >
            Back
          </button>
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
