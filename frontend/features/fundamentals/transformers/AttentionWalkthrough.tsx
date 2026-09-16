"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Equation } from "@/components/Equation";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { tokenize } from "./tokenize";
import { forward, initWeights, type TransformerConfig } from "./transformer";
import { TokenChips } from "./TokenChips";
import { AttentionHeatmap } from "./AttentionHeatmap";
import { EmbeddingVector } from "./EmbeddingVector";
import { QKVDiagram } from "./QKVDiagram";
import { AttentionOverviewDiagram } from "./AttentionOverviewDiagram";
import { SoftmaxDemo } from "./SoftmaxDemo";
import { CausalMaskDiagram } from "./CausalMaskDiagram";
import { MultiHeadIntuitionDiagram } from "./MultiHeadIntuitionDiagram";
import { MultiHeadSplitDiagram } from "./MultiHeadSplitDiagram";
import { HeadSplitOptionsDiagram } from "./HeadSplitOptionsDiagram";
import { Slider } from "../classical-ml/Slider";
import type { ChapterId } from "./TransformerLab";

const D_MODEL = 8;
const DEFAULT_TEXT = "the cat sat on the mat";
const SEED = 7;
const HEAD_OPTIONS = [1, 2, 4, 8];

/** Chapter 2 of the Transformers Unit: Query/Key/Value through
 * multi-head attention. See TokensEmbeddingsWalkthrough.tsx for the split
 * rationale — each Chapter keeps its own copy of only the sandbox state
 * its own Steps need. This Chapter has no block-count slider anywhere, so
 * numLayers is fixed at 1 and every layer index is just 0. */
export function AttentionWalkthrough({
  onComplete,
  onNavigateToChapter,
}: {
  onComplete?: () => void;
  onNavigateToChapter?: (chapter: ChapterId) => void;
}) {
  const [step, setStep] = useState(0);

  const [text, setText] = useState(DEFAULT_TEXT);
  const tokens = useMemo(() => tokenize(text), [text]);
  const [numHeads, setNumHeads] = useState(2);
  const config: TransformerConfig = useMemo(
    () => ({ dModel: D_MODEL, numHeads, numLayers: 1, seed: SEED }),
    [numHeads]
  );
  const weights = useMemo(() => initWeights(config), [config]);
  const result = useMemo(
    () => (tokens.length > 0 ? forward(tokens, weights, config) : null),
    [tokens, weights, config]
  );

  const [tokenIndex, setTokenIndex] = useState(0);
  const clampedTokenIndex = Math.min(tokenIndex, Math.max(0, tokens.length - 1));

  const resetText = () => setText(DEFAULT_TEXT);

  // --- Softmax sandbox: a small fixed example, independent of the live
  // text, so the demo stays legible regardless of what the user typed. ---
  const softmaxLabels = ["cat", "sat", "on", "mat"];
  const [softmaxScores, setSoftmaxScores] = useState([2, 0.5, -1, 1]);
  const resetSoftmax = () => setSoftmaxScores([2, 0.5, -1, 1]);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";
  const chapterLinkBtn =
    "inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm font-semibold";

  const textInputControl = (
    <div className="space-y-2">
      <label className="block text-sm text-neutral-500">Input text</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-white border border-neutral-200 rounded-md px-3 py-2 text-neutral-900 font-mono text-base"
        maxLength={100}
      />
      <TokenChips tokens={tokens} highlight={clampedTokenIndex} />
    </div>
  );

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    chart?: ReactNode;
    controls?: ReactNode;
    onAdvance?: () => void;
    resetAction?: () => void;
  }

  const firstToken = tokens[clampedTokenIndex] ?? "the";
  const layer0 = result?.layers[0];
  const qkvTokenIndex = Math.min(clampedTokenIndex, (layer0?.Q.length ?? 1) - 1);
  const qVec = layer0?.Q[qkvTokenIndex] ?? [];
  const kVec = layer0?.K[qkvTokenIndex] ?? [];
  const vVec = layer0?.V[qkvTokenIndex] ?? [];

  // For the "attention output = weighted blend of values" step: use the
  // LAST token's real attention weights (head 0) against every other
  // token's real V vector.
  const lastIdx = tokens.length - 1;
  const lastAttnWeights = layer0?.attnByHead[0]?.[lastIdx] ?? [];

  const steps: Step[] = [
    // -------------------------- 5. Query, Key, Value --------------------------
    {
      section: "5. Query, Key, Value",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers how one token gathers information from every other token:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Query, Key, Value</strong> — the three vectors attention computes from each token.</li>
            <li><strong>Attention Scores</strong> — turning Query/Key comparisons into weights.</li>
            <li><strong>Causal Masking</strong> — why a token can only look backward.</li>
            <li><strong>Multi-Head Attention</strong> — running several attention patterns at once.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "5. Query, Key, Value",
      title: "The big picture, before the details",
      body: (
        <p>
          This chapter is about one thing: figuring out how much attention each token should pay
          to every other token, then blending that into a single vector for each token — its{" "}
          <Equation tex={"\\text{attn\\_output}"} display={false} />. Everything from here is
          just the details of how that gets built.
        </p>
      ),
      visual: <AttentionOverviewDiagram />,
    },
    {
      section: "5. Query, Key, Value",
      title: "A new idea: attention",
      body: (
        <p>
          Every token now has a vector. Attention is the operation that
          lets each token gather information from <em>other</em> tokens&rsquo; vectors, weighted
          by how relevant each one is — instead of only ever looking at itself. Think about how
          you read a sentence yourself: you don&rsquo;t weigh every word equally — your attention
          naturally lands on whichever earlier words matter most for making sense of the one
          you&rsquo;re on right now. Attention gives each token that same ability, letting it
          decide, on the fly, which other tokens to focus on and how strongly. The picture below
          is the shape of that idea: one token weighs every other token by relevance, and blends
          their information together accordingly.
        </p>
      ),
      visual: <AttentionOverviewDiagram />,
    },
    {
      section: "5. Query, Key, Value",
      title: "Three questions every token asks",
      body: (
        <div className="space-y-3">
          <p>
            To decide relevance, each token&rsquo;s embedding is transformed into three different
            vectors. Each one answers a different question:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="text-left text-sm text-neutral-500">
                  <th className="pb-1.5 pr-3 font-medium"></th>
                  <th className="pb-1.5 pr-3 font-medium">Question it answers</th>
                  <th className="pb-1.5 font-medium">Search-engine analogy</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 font-medium text-cyan-700">Query</td>
                  <td className="py-1.5 pr-3 text-neutral-700">What am I looking for?</td>
                  <td className="py-1.5 text-neutral-700">Your search text</td>
                </tr>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 font-medium text-violet-700">Key</td>
                  <td className="py-1.5 pr-3 text-neutral-700">What do I offer?</td>
                  <td className="py-1.5 text-neutral-700">Each page&rsquo;s indexed keywords</td>
                </tr>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 font-medium text-orange-700">Value</td>
                  <td className="py-1.5 pr-3 text-neutral-700">What do I actually contain?</td>
                  <td className="py-1.5 text-neutral-700">The page content you actually read</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
      visual: <AttentionOverviewDiagram />,
    },
    {
      section: "5. Query, Key, Value",
      title: "How attention works, in one picture",
      body: (
        <div className="space-y-3">
          <p>
            Now put Query, Key, and Value together — here&rsquo;s the whole mechanism in one
            picture:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Every token&rsquo;s embedding <Equation tex="x" display={false} /> becomes a Query, a Key, and a Value — each via its own weight matrix.</li>
            <li>A token&rsquo;s query is compared against <em>every</em> token&rsquo;s key, not just one — every token gets its own relevance score.</li>
            <li>The <Equation tex={"\\text{attn\\_output}"} display={false} /> is never one value picked out — it&rsquo;s a blend of <em>every</em> token&rsquo;s value, weighted by how well each key matched.</li>
          </ul>
          <p>
            The picture below shows exactly this shape: one query, weighed against every
            key (line thickness = match strength), producing one blended{" "}
            <Equation tex={"\\text{attn\\_output}"} display={false} /> from every value in those
            same proportions. Illustrative numbers — the real ones come a few steps from now. That
            blended <Equation tex={"\\text{attn\\_output}"} display={false} /> isn&rsquo;t thrown
            away — updating the token&rsquo;s vector with it is exactly what the next chapter
            covers.
          </p>
        </div>
      ),
      visual: <AttentionOverviewDiagram />,
    },
    {
      section: "5. Query, Key, Value",
      title: "Query: what am I looking for?",
      body: (
        <div className="space-y-2">
          <p>
            Computed with a weight matrix <Equation tex="W_q" display={false} /> — a full grid
            of numbers, not a single one:
          </p>
          <Equation tex={"q = W_q \\cdot x"} />
          <p>
            Written out at the real size — {D_MODEL} dimensions, so {D_MODEL} rows and an{" "}
            {D_MODEL}×{D_MODEL} matrix ({"⋯"} skips the repeated middle entries):
          </p>
          <Equation tex={"\\begin{pmatrix} q_1 \\\\ q_2 \\\\ \\vdots \\\\ q_8 \\end{pmatrix} = \\begin{pmatrix} w_{11} & w_{12} & \\cdots & w_{18} \\\\ w_{21} & w_{22} & \\cdots & w_{28} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ w_{81} & w_{82} & \\cdots & w_{88} \\end{pmatrix} \\begin{pmatrix} x_1 \\\\ x_2 \\\\ \\vdots \\\\ x_8 \\end{pmatrix}"} />
          <p>
            <Equation tex="x" display={false} /> is this token&rsquo;s final embedding from the
            previous section — token embedding plus positional encoding, already added together.
            The equation itself is exactly a weighted sum again — no bias, no activation, just a
            linear layer. You already know this operation from Neural Networks.
          </p>
        </div>
      ),
      visual: <QKVDiagram highlight={["q"]} />,
    },
    {
      section: "5. Query, Key, Value",
      title: "Key: what do I offer?",
      body: (
        <div className="space-y-2">
          <p>Same idea, a different weight matrix <Equation tex="W_k" display={false} />:</p>
          <Equation tex={"k = W_k \\cdot x"} />
          <Equation tex={"\\begin{pmatrix} k_1 \\\\ k_2 \\\\ \\vdots \\\\ k_8 \\end{pmatrix} = \\begin{pmatrix} w_{11} & w_{12} & \\cdots & w_{18} \\\\ w_{21} & w_{22} & \\cdots & w_{28} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ w_{81} & w_{82} & \\cdots & w_{88} \\end{pmatrix} \\begin{pmatrix} x_1 \\\\ x_2 \\\\ \\vdots \\\\ x_8 \\end{pmatrix}"} />
        </div>
      ),
      visual: <QKVDiagram highlight={["k"]} />,
    },
    {
      section: "5. Query, Key, Value",
      title: "Value: what do I actually contain?",
      body: (
        <div className="space-y-2">
          <p>And a third weight matrix <Equation tex="W_v" display={false} />:</p>
          <Equation tex={"v = W_v \\cdot x"} />
          <Equation tex={"\\begin{pmatrix} v_1 \\\\ v_2 \\\\ \\vdots \\\\ v_8 \\end{pmatrix} = \\begin{pmatrix} w_{11} & w_{12} & \\cdots & w_{18} \\\\ w_{21} & w_{22} & \\cdots & w_{28} \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ w_{81} & w_{82} & \\cdots & w_{88} \\end{pmatrix} \\begin{pmatrix} x_1 \\\\ x_2 \\\\ \\vdots \\\\ x_8 \\end{pmatrix}"} />
          <p>Three linear layers, same input, three different learned lenses on it.</p>
        </div>
      ),
      visual: <QKVDiagram highlight={["v"]} />,
    },
    {
      section: "5. Query, Key, Value",
      title: "Try it yourself: see real Q/K/V vectors",
      body: <p>Pick a token and look at its actual Query, Key, and Value vectors.</p>,
      visual: textInputControl,
      chart: (
        <div className="space-y-2">
          <EmbeddingVector values={qVec} label="Q" scale={1.5} />
          <EmbeddingVector values={kVec} label="K" scale={1.5} />
          <EmbeddingVector values={vVec} label="V" scale={1.5} />
        </div>
      ),
      controls: (
        <Slider
          label="Token"
          value={clampedTokenIndex}
          min={0}
          max={Math.max(0, tokens.length - 1)}
          step={1}
          onChange={setTokenIndex}
          format={() => firstToken}
        />
      ),
      resetAction: resetText,
    },
    // -------------------------- 6. Attention Scores --------------------------
    {
      section: "6. Attention Scores",
      title: "Scoring how well a query matches a key",
      body: (
        <p>
          A token&rsquo;s query is compared against every token&rsquo;s key with a dot product — a
          dot product is itself just a weighted sum, where one vector supplies the &ldquo;weights&rdquo;:
          <Equation tex={"\\text{score}_{ij} = q_i \\cdot k_j"} />
          A high score means key <Equation tex="j" display={false} /> matches query{" "}
          <Equation tex="i" display={false} /> well.
        </p>
      ),
      chart: (
        <p className="text-base text-neutral-600">
          Recall from math class: a dot product adds up each pair of matching components — it{" "}
          <em>extracts what two vectors have in common</em>. Large in the same components as each
          other, on the same sign, and the products stack up into a big positive number; pointing
          in unrelated directions, and they mostly cancel out toward zero. That&rsquo;s exactly why
          it works as a match score here: a query and key that share structure in the same
          dimensions naturally produce a high score.
        </p>
      ),
      visual: <QKVDiagram />,
    },
    {
      section: "6. Attention Scores",
      title: "Scaling the score",
      body: (
        <p>
          Divide by the square root of each head&rsquo;s vector length before going further:
          <Equation tex={"\\text{score}_{ij} = \\frac{q_i \\cdot k_j}{\\sqrt{d_k}}"} />
          Without this, scores from longer vectors would run larger just from having more terms to
          sum — scaling keeps them in a consistent range no matter the vector size.
        </p>
      ),
      visual: <QKVDiagram />,
    },
    {
      section: "6. Attention Scores",
      title: "Turning scores into weights: softmax",
      body: (
        <p>
          Softmax turns a list of raw scores into positive numbers that
          sum to 1 — a probability distribution over &ldquo;how much attention to pay to each
          token&rdquo;:
          <Equation tex={"\\text{softmax}(z_i) = \\frac{e^{z_i}}{\\sum_j e^{z_j}}"} />
          Drag the scores below and watch the weights redistribute.
        </p>
      ),
      visual: (
        <SoftmaxDemo
          scores={softmaxScores}
          labels={softmaxLabels}
          onChange={(i, v) => setSoftmaxScores((s) => s.map((x, j) => (j === i ? v : x)))}
        />
      ),
      resetAction: resetSoftmax,
    },
    {
      section: "6. Attention Scores",
      title: "Attention output: a weighted blend of values",
      body: (
        <div className="space-y-2">
          <p>
            Apply that same softmax to every query&rsquo;s whole row of scores, and give the
            result a name: <Equation tex={"\\text{weight}_{ij}"} display={false} /> — how much of
            key <Equation tex="j" display={false} />&rsquo;s value to mix into query{" "}
            <Equation tex="i" display={false} />&rsquo;s{" "}
            <Equation tex={"\\text{attn\\_output}"} display={false} />.
          </p>
          <Equation tex={"\\text{weight}_{ij} = \\text{softmax}_j(\\text{score}_{ij})"} />
          <p>
            This is the actual quantity worth remembering as &ldquo;attention&rdquo;: it says how
            much attention token <Equation tex="i" display={false} /> pays to token{" "}
            <Equation tex="j" display={false} /> — the strength of attention between the two.
          </p>
          <p>
            The final <Equation tex={"\\text{attn\\_output}"} display={false} /> for a token is
            every token&rsquo;s Value vector, blended together using these weights as the mix:
          </p>
          <Equation tex={"\\text{attn\\_output}_i = \\sum_j \\text{weight}_{ij} \\; v_j"} />
          <p>
            That&rsquo;s <Equation tex={"\\text{attn\\_output}_i"} display={false} />: content
            gathered from every token, blended into one vector. What it does next is the next
            chapter&rsquo;s job.
          </p>
          <p>
            Below: the real per-token weights the last token in our sentence assigns to every
            token (including itself), from its actual attention row.
          </p>
        </div>
      ),
      visual: (
        <div className="space-y-1.5">
          {tokens.map((tok, j) => (
            <div key={j} className="flex items-center gap-2 text-sm">
              <span className="w-14 shrink-0 font-mono text-neutral-600 truncate">{tok}</span>
              <div className="flex-1 h-4 bg-neutral-200 rounded overflow-hidden">
                <div className="h-full bg-cyan-600" style={{ width: `${(lastAttnWeights[j] ?? 0) * 100}%` }} />
              </div>
              <span className="w-12 text-right text-neutral-500 tabular-nums">
                {((lastAttnWeights[j] ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      section: "6. Attention Scores",
      title: "Try it yourself: see real attention weights",
      body: (
        <p>
          Type your own text and inspect the full attention matrix: rows are the query token,
          columns are the key token, brighter means more attention.
        </p>
      ),
      visual: textInputControl,
      chart: result ? <AttentionHeatmap tokens={tokens} attn={result.layers[0].attnByHead[0]} /> : undefined,
      resetAction: resetText,
    },
    // -------------------------- 7. Causal Masking --------------------------
    {
      section: "7. Causal Masking",
      title: "Hide the future while training",
      body: (
        <p>
          Imagine studying for an exam by staring at the answer key the whole time — you&rsquo;d
          &ldquo;solve&rdquo; every question perfectly, but learn nothing useful for the real exam,
          where there&rsquo;s no answer key. A language model has the same problem: it generates
          text one token at a time, and whatever comes <em>after</em> the token it&rsquo;s
          currently producing doesn&rsquo;t exist yet. If attention were allowed to peek at those
          future tokens during training, it would learn a shortcut that&rsquo;s impossible to use
          for real.
        </p>
      ),
      visual: <CausalMaskDiagram />,
    },
    {
      section: "7. Causal Masking",
      title: "Only attend to the past",
      body: (
        <p>
          Causal masking closes that shortcut: token{" "}
          <Equation tex="i" display={false} /> may only attend to itself and to tokens before it —
          never to a token after it. Below: our real sentence&rsquo;s actual attention matrix, with
          exactly that rule applied.
        </p>
      ),
      visual: result ? (
        <AttentionHeatmap tokens={tokens} attn={result.layers[0].attnByHead[0]} maskAnnotation="hidden in training" />
      ) : undefined,
    },
    {
      section: "7. Causal Masking",
      title: "Try it yourself: spot the mask",
      body: (
        <p>
          Now the real thing: every cell above the diagonal in the heatmap below is exactly this
          rule in action — those cells would mean &ldquo;attend to a token that hasn&rsquo;t been
          generated yet,&rdquo; so they always stay blocked, no matter what text you type or which
          layer/head you pick later.
        </p>
      ),
      visual: textInputControl,
      chart: result ? <AttentionHeatmap tokens={tokens} attn={result.layers[0].attnByHead[0]} /> : undefined,
      resetAction: resetText,
    },
    // -------------------------- 8. Multi-Head Attention --------------------------
    {
      section: "8. Multi-Head Attention",
      title: "One attention pattern isn't enough",
      body: (
        <div className="space-y-2">
          <p>
            A single attention computation can only learn one notion of &ldquo;relevance&rdquo; at
            a time — one fixed way of deciding which words matter to which. But real language
            needs several different notions of relevance at once: which words simply sit near each
            other, which pronoun refers back to which noun, which words share a topic, and more.
            Asking one attention computation to capture all of that simultaneously asks too much of
            it.
          </p>
          <p>
            Multi-head attention&rsquo;s fix: instead of
            computing attention once, compute it several times in parallel, letting each
            &ldquo;head&rdquo; specialize in a different kind of relationship — illustrated (not
            real data) below.
          </p>
        </div>
      ),
      visual: <MultiHeadIntuitionDiagram />,
    },
    {
      section: "8. Multi-Head Attention",
      title: "Splitting into heads",
      body: (
        <div className="space-y-2">
          <p>
            Multi-head attention doesn&rsquo;t repeat the whole computation from scratch for each
            head — that would need brand-new, much bigger weight matrices. Instead, it reuses the
            same Q/K/V vectors you already have and simply slices each one into equal-sized chunks,
            one chunk per head. Each head then runs the exact same score → softmax → blend pipeline
            you already learned, but strictly on its own chunk, with no knowledge of what the other
            heads are doing.
          </p>
          <p>
            Once every head finishes, their chunk-sized outputs are glued back together
            (concatenated) into one full-size vector again, and one more linear layer mixes them
            together. The picture below shows this split for our 8-dimensional vectors across 2
            heads; underneath it, two real heads&rsquo; attention patterns on our sentence —
            different from each other, because they really are separate computations on separate
            slices.
          </p>
        </div>
      ),
      visual: <MultiHeadSplitDiagram />,
      chart: result ? (
        <div className="space-y-3">
          {result.layers[0].attnByHead.slice(0, 2).map((attn, h) => (
            <div key={h}>
              <div className="text-sm text-neutral-500 mb-1">Head {h + 1}</div>
              <AttentionHeatmap tokens={tokens} attn={attn} />
            </div>
          ))}
        </div>
      ) : undefined,
    },
    {
      section: "8. Multi-Head Attention",
      title: "The four possible splits",
      body: (
        <div className="space-y-2">
          <p>
            {D_MODEL} divides evenly only by 1, 2, 4, and 8 — those are the only splits possible,
            shown below.
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Always equal-sized:</strong> one simple, uniform slice per head — no head
              starts out with more capacity than another.
            </li>
            <li>
              <strong>Fewer, larger heads</strong> can each learn more complex patterns.
            </li>
            <li>
              <strong>More, smaller heads</strong> run more of them in parallel, each simpler but
              free to specialize differently.
            </li>
          </ul>
          <p className="text-sm text-neutral-500">
            Neither is simply &ldquo;better&rdquo; — real models fix a head count as a
            hyperparameter before training, not something decided per token.
          </p>
        </div>
      ),
      visual: <HeadSplitOptionsDiagram />,
    },
    {
      section: "8. Multi-Head Attention",
      title: "Try it yourself: change the number of heads",
      body: (
        <p>
          Drag the slider to change how many heads split the vector — every head&rsquo;s own
          attention pattern is shown below, all at once. Even with untrained (random) weights,
          each head&rsquo;s pattern differs from the others — proof that they really are separate
          computations on separate slices, not cosmetic copies.
        </p>
      ),
      visual: textInputControl,
      chart: result ? (
        <div className="space-y-3">
          {result.layers[0].attnByHead.map((attn, h) => (
            <div key={h}>
              <div className="text-sm text-neutral-500 mb-1">Head {h + 1}</div>
              <AttentionHeatmap tokens={tokens} attn={attn} />
            </div>
          ))}
        </div>
      ) : undefined,
      controls: (
        <Slider
          label="Number of heads"
          value={HEAD_OPTIONS.indexOf(numHeads)}
          min={0}
          max={HEAD_OPTIONS.length - 1}
          step={1}
          onChange={(i) => setNumHeads(HEAD_OPTIONS[i])}
          format={() => `${numHeads} (${D_MODEL / numHeads}-dim each)`}
        />
      ),
      resetAction: () => setNumHeads(2),
    },
    {
      section: "Wrap-up",
      title: "What you learned in this chapter",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Each token computes a Query, Key, and{" "}
              Value vector.</li>
            <li>Attention scores every query against every key, then
              blends values together in those proportions.</li>
            <li>Causal masking stops a token from attending to
              the future.</li>
            <li>Multi-head attention runs several of these
              in parallel, on separate slices of the vector.</li>
          </ul>
          <p>
            Or,{" "}
            <button
              type="button"
              className={chapterLinkBtn}
              onClick={() => onNavigateToChapter?.("block")}
            >
              proceed to The Transformer Block →
            </button>
          </p>
        </div>
      ),
      visual: <AttentionOverviewDiagram />,
    },
  ];

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => {
    current.onAdvance?.();
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
          <button
            onClick={goBack}
            disabled={isFirst}
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

      <SegmentedProgressBar
        sections={steps.map((s) => s.section)}
        currentStep={step}
        onSelectStep={setStep}
      />

      <div className="space-y-4">
        <h3 className="text-xl font-medium text-neutral-900">{current.title}</h3>
        <div className="text-base text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
          </div>
        )}
        {current.resetAction && (
          <button
            onClick={current.resetAction}
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            ↺ Undo / reset this step
          </button>
        )}

        <div className="space-y-3">
          {current.visual}
          {current.chart}
        </div>
      </div>
    </div>
  );
}
