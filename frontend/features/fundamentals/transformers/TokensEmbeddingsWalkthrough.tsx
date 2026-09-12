"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Equation } from "@/components/Equation";
import { Term } from "@/components/Term";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { tokenize } from "./tokenize";
import { forward, initWeights, positionalEncoding, tokenEmbedding, type TransformerConfig } from "./transformer";
import { TokenChips } from "./TokenChips";
import { EmbeddingVector } from "./EmbeddingVector";
import { PositionalEncodingHeatmap } from "./PositionalEncodingHeatmap";
import { FunctionPlot } from "@/components/FunctionPlot";
import { ClockDiagram } from "./ClockDiagram";
import { UnitCircleDiagram } from "./UnitCircleDiagram";
import { ArchitectureOverviewDiagram } from "./ArchitectureOverviewDiagram";
import { CatOnMatIllustration } from "./CatOnMatIllustration";
import { Slider } from "../classical-ml/Slider";
import type { ChapterId } from "./TransformerLab";

const D_MODEL = 8;
const DEFAULT_TEXT = "the cat sat on the mat";
const SEED = 7;

/** Chapter 1 of the Transformers Unit: plain text all the way to a
 * token's final embedding (token + position). Splitting the original
 * 59-step walkthrough into 4 independently-mounted Chapters (mirroring
 * ClassicalMlPlayground) so each Chapter stays a manageable size; each
 * Chapter keeps its own copy of only the sandbox state its own Steps need. */
export function TokensEmbeddingsWalkthrough({
  onComplete,
  onNavigateToChapter,
}: {
  onComplete?: () => void;
  onNavigateToChapter?: (chapter: ChapterId) => void;
}) {
  const [step, setStep] = useState(0);

  const [text, setText] = useState(DEFAULT_TEXT);
  const tokens = useMemo(() => tokenize(text), [text]);
  const config: TransformerConfig = useMemo(
    () => ({ dModel: D_MODEL, numHeads: 2, numLayers: 1, seed: SEED }),
    []
  );
  const weights = useMemo(() => initWeights(config), [config]);
  const result = useMemo(
    () => (tokens.length > 0 ? forward(tokens, weights, config) : null),
    [tokens, weights, config]
  );

  const [tokenIndex, setTokenIndex] = useState(0);
  const clampedTokenIndex = Math.min(tokenIndex, Math.max(0, tokens.length - 1));

  const resetText = () => setText(DEFAULT_TEXT);

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
  const firstEmbedding = useMemo(() => tokenEmbedding(firstToken, D_MODEL), [firstToken]);
  const firstPositional = useMemo(() => positionalEncoding(clampedTokenIndex, D_MODEL), [clampedTokenIndex]);
  const firstFinalEmbedding = result?.embeddings[clampedTokenIndex] ?? firstEmbedding;

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "What you'll learn in this Unit",
      body: (
        <div className="space-y-2">
          <p>
            This Unit builds one whole mechanism, end to end, one chapter at a time — nothing
            skipped, nothing added beyond what these four chapters cover:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li>
              <button type="button" className={chapterLinkBtn} onClick={() => setStep(1)}>
                Tokens &amp; Embeddings
              </button>{" "}
              (this chapter) — turn plain text into vectors a model can compute with.
            </li>
            <li>
              <button type="button" className={chapterLinkBtn} onClick={() => onNavigateToChapter?.("attention")}>
                Attention
              </button>{" "}
              — let every token gather information from every other token.
            </li>
            <li>
              <button type="button" className={chapterLinkBtn} onClick={() => onNavigateToChapter?.("block")}>
                The Transformer Block
              </button>{" "}
              — update a token&rsquo;s vector with that information, wrapped in residual connections
              and layer normalization, and stack several of these blocks.
            </li>
            <li>
              <button type="button" className={chapterLinkBtn} onClick={() => onNavigateToChapter?.("generating")}>
                Generating Text
              </button>{" "}
              — turn the final vector into a predicted word, then repeat that, one word at a time, to
              write a sentence.
            </li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The big picture, before any of the pieces",
      body: (
        <div className="space-y-2">
          <p>
            Here&rsquo;s the shape all four chapters add up to, shown once up front so later
            chapters have a picture to hang their details on — nothing below needs to make full
            sense yet:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Text becomes token + position vectors.</li>
            <li>
              Those flow through one or more Transformer Blocks: self-attention, then a small
              feed-forward network — each wrapped in a residual connection and normalization.
            </li>
            <li>The last vector becomes a probability for what word comes next.</li>
          </ul>
          <p>
            This app implements a single stack like this one — the shape GPT-style models use —
            not the separate encoder-plus-decoder pair from the original Transformer paper: only
            one attention per block, and it can only look backward (that &ldquo;masked&rdquo; part
            is covered in the Attention chapter).
          </p>
        </div>
      ),
      visual: <ArchitectureOverviewDiagram />,
    },
    {
      section: "Welcome",
      title: "What you learn from this Tokens & Embeddings chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers turning text into vectors a model can compute with:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Tokenization</strong> — splitting a sentence into tokens.</li>
            <li><strong>Embeddings</strong> — turning each token into a vector.</li>
            <li><strong>Positional Encoding</strong> — adding word order back in with sine and cosine waves.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The big picture, before the details",
      body: (
        <div className="space-y-2">
          <p>
            This chapter has plenty of new vocabulary, but the machinery underneath is familiar —
            an embedding is just the x₁/x₂-style input vector from earlier chapters, only longer.
            You&rsquo;ll split a sentence into <Term id="token">tokens</Term>, turn each token
            into an <Term id="embedding">embedding</Term> vector, then fix a real gap — vectors
            alone say nothing about word order — with a{" "}
            <Term id="positional-encoding">positional encoding</Term>.
          </p>
          <p>
            By the end, every token has one vector that carries both its identity and its
            position. From there, later chapters compute <Term id="query">Query</Term>/
            <Term id="key">Key</Term>/<Term id="value">Value</Term> vectors, score and blend
            tokens together with <Term id="softmax">attention</Term>, repeat that with several
            heads at once, wrap it all in residual connections and layer normalization, run it
            through a small feed-forward network, stack several of these blocks, and finally
            predict the next word — then do the whole thing again to generate a second word, and a
            third.
          </p>
        </div>
      ),
      visual: <TokenChips tokens={tokenize(DEFAULT_TEXT)} />,
    },
    // -------------------------- 1. Tokenization --------------------------
    {
      section: "1. Tokenization",
      title: "Where we start: plain text",
      body: (
        <p>
          Everything a language model does starts from ordinary text. Our example sentence for
          this whole chapter: &ldquo;{DEFAULT_TEXT}&rdquo;. The goal, by the end, is to predict
          what word comes next.
        </p>
      ),
      visual: (
        <div className="flex flex-col gap-3">
          <CatOnMatIllustration />
          <TokenChips tokens={tokenize(DEFAULT_TEXT)} />
        </div>
      ),
    },
    {
      section: "1. Tokenization",
      title: "Splitting text into tokens",
      body: (
        <p>
          A <Term id="token">token</Term> is a chunk of text a model treats as one unit — here,
          roughly one word or punctuation mark. &ldquo;{DEFAULT_TEXT}&rdquo; becomes{" "}
          {tokenize(DEFAULT_TEXT).length} separate tokens, shown below as chips.
        </p>
      ),
      visual: <TokenChips tokens={tokenize(DEFAULT_TEXT)} />,
    },
    {
      section: "1. Tokenization",
      title: "Try it yourself: tokenize your own text",
      body: (
        <div className="space-y-2">
          <p>
            Type anything below and watch it tokenize live — this text carries through every step
            from here on.
          </p>
          <p>
            Try punctuation, like &ldquo;hello, world.&rdquo;: it splits into its own chip, just
            like a word.
          </p>
          <p>Simplified vs. production tokenizers, but the pipeline downstream works the same.</p>
        </div>
      ),
      visual: textInputControl,
      resetAction: resetText,
    },
    // -------------------------- 2. Embeddings --------------------------
    {
      section: "2. Embeddings",
      title: "From token to numbers: embeddings",
      body: (
        <p>
          A model can&rsquo;t compute with the string &ldquo;cat&rdquo; — it needs numbers. An{" "}
          <Term id="embedding">embedding</Term> is just that: a list of numbers standing in for a
          token, exactly like the x₁/x₂ inputs from earlier chapters, just with more of them. Each
          number&rsquo;s spot in that list is called a <Term id="dimension">dimension</Term> — our
          embeddings here have {D_MODEL} numbers, so we say they have {D_MODEL} dimensions; &ldquo;the
          3rd dimension&rdquo; just means &ldquo;the 3rd number in the list&rdquo;. Here&rsquo;s the
          token &ldquo;{firstToken}&rdquo;&rsquo;s embedding — the numbers themselves are printed
          below each cell; the color is only there to make the pattern easier to scan at a glance
          (orange = negative, cyan = positive):
        </p>
      ),
      visual: <EmbeddingVector values={firstEmbedding} label={firstToken} scale={0.6} />,
      onAdvance: () => setTokenIndex(0),
    },
    {
      section: "2. Embeddings",
      title: "Same token, same vector",
      body: (
        <p>
          &ldquo;the&rdquo; appears twice in our sentence. Compare its embedding both times — they
          match exactly. Every occurrence of a given token always maps to the same vector.
        </p>
      ),
      visual: (
        <div className="flex flex-col gap-2">
          <EmbeddingVector values={tokenEmbedding("the", D_MODEL)} label="the (1st)" scale={0.6} />
          <EmbeddingVector values={tokenEmbedding("the", D_MODEL)} label="the (2nd)" scale={0.6} />
        </div>
      ),
    },
    {
      section: "2. Embeddings",
      title: "These vectors aren't trained yet",
      body: (
        <p>
          Right now each token&rsquo;s vector is just a fixed, pseudo-random pattern derived from
          its spelling — &ldquo;cat&rdquo; and &ldquo;kitten&rdquo; have no reason to look similar
          here. In a <em>trained</em> model, embeddings shift during training so words with similar
          meaning end up with similar vectors. That training happens for real in the Tiny LLM
          section next.
        </p>
      ),
      visual: <EmbeddingVector values={firstEmbedding} label={firstToken} scale={0.6} />,
    },
    {
      section: "2. Embeddings",
      title: "Try it yourself: inspect any token's embedding",
      body: <p>Type your own text, then drag the slider to look at any token&rsquo;s embedding.</p>,
      visual: textInputControl,
      chart: (
        <EmbeddingVector values={tokenEmbedding(firstToken, D_MODEL)} label={firstToken} scale={0.6} />
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
    // -------------------------- 3. Positional Encoding --------------------------
    {
      section: "3. Positional Encoding",
      title: "A problem: order gets lost",
      body: (
        <p>
          Very soon, every token is going to gather information by looking at every other token in
          the sentence — but that process, on its own, has no sense of <em>where</em> a token sits.
          Without help, &ldquo;the cat sat&rdquo; and &ldquo;sat the cat&rdquo; would look identical
          to it. We need to bake position into the numbers themselves before that happens.
        </p>
      ),
      visual: <TokenChips tokens={tokens} highlight={clampedTokenIndex} />,
    },
    {
      section: "3. Positional Encoding",
      title: "So, how do we give tokens position info?",
      body: (
        <p>
          The simplest idea: just use the position number itself — 0 for the first word, 1 for the
          second, 2 for the third, and so on — and mix it into the token&rsquo;s embedding
          somehow. Before jumping to a fix, it&rsquo;s worth being precise about what we actually
          need that position code to do.
        </p>
      ),
      visual: <TokenChips tokens={tokens} highlight={clampedTokenIndex} />,
    },
    {
      section: "3. Positional Encoding",
      title: "Three conditions for a good position code",
      body: (
        <div className="space-y-2">
          <p>Whatever we use to represent a position, we want it to:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li>
              <strong>Stay in a bounded range.</strong> Sentences can get long — position 500 is
              possible. If the code just kept growing, it would eventually swamp the token&rsquo;s
              own embedding values, which stay small.
            </li>
            <li>
              <strong>Be a full vector, not one number.</strong> The token embedding has{" "}
              {D_MODEL} numbers, and we want to add position onto <em>all</em> of them — a single
              number could only be added to one slot, leaving the rest untouched by position.
            </li>
            <li>
              <strong>Make relative distance easy to read.</strong> &ldquo;3 words apart&rdquo;
              should look the same to the model no matter <em>where</em> in the sentence it
              happens — ideally something simple linear layers (the same kind of weighted sum
              you already know) can pick up on directly, without extra machinery.
            </li>
          </ol>
          <p>
            Plain integers fail the first two immediately: they&rsquo;re unbounded, and they&rsquo;re
            a single number, not a vector. We need something else.
          </p>
        </div>
      ),
      visual: <TokenChips tokens={tokens} highlight={clampedTokenIndex} />,
    },
    {
      section: "3. Positional Encoding",
      title: "A shape from math class: the sine wave",
      body: (
        <p>
          The fix is going to be built out of a curve you&rsquo;ve already seen in math class:{" "}
          <Equation tex={"\\sin(x)"} display={false} />. Nothing new here — plug in a number{" "}
          <Equation tex="x" display={false} />, get back a number between{" "}
          <Equation tex="-1" display={false} /> and <Equation tex="1" display={false} /> that rises
          and falls smoothly. That&rsquo;s all a &ldquo;wave&rdquo; means in this section: this
          exact curve.
        </p>
      ),
      visual: <FunctionPlot fn={Math.sin} xMin={0} xMax={20} xLabel="x" yLabel="sin(x)" />,
    },
    {
      section: "3. Positional Encoding",
      title: "Same wave, now over word positions",
      body: (
        <p>
          Instead of a generic <Equation tex="x" display={false} />, plug in the word&rsquo;s
          position in the sentence — 0 for the first word, 1 for the second, and so on. Each
          position now has its own number, read straight off the curve at that point:
        </p>
      ),
      visual: <FunctionPlot fn={Math.sin} xMin={0} xMax={20} xLabel="word position" yLabel="sin(position)" />,
      chart: (
        <div className="flex flex-wrap gap-3 text-sm font-mono">
          {[0, 1, 2, 3, 4, 5, 6].map((pos) => (
            <div key={pos} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-center">
              <div className="text-neutral-400">pos {pos}</div>
              <div className="text-neutral-800 tabular-nums">{Math.sin(pos).toFixed(2)}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      section: "3. Positional Encoding",
      title: "One wave isn't enough",
      body: (
        <p>
          This wave is exactly periodic: <Equation tex={"\\sin(pos) = \\sin(pos + 2\\pi)"} />, with
          period <Equation tex={"2\\pi \\approx 6.28"} display={false} />. So position{" "}
          <Equation tex="p" display={false} /> and position{" "}
          <Equation tex={"p + 2\\pi"} display={false} /> give back the literal same number — in a
          long enough sentence, a single wave alone can&rsquo;t tell far-apart positions apart. We
          need more than one.
        </p>
      ),
      visual: <FunctionPlot fn={Math.sin} xMin={0} xMax={20} xLabel="word position" yLabel="sin(position)" />,
    },
    {
      section: "3. Positional Encoding",
      title: "Fast and slow waves, like a clock",
      body: (
        <p>
          A clock face reads out several numbers at once — the hour hand&rsquo;s angle, the minute
          hand&rsquo;s angle, the second hand&rsquo;s angle — each moving at its own speed. The
          fast second hand pins down exactly where you are <em>within a minute</em>; the slow hour
          hand tells you roughly where you are <em>within a day</em>. Read together, all three pin
          down one exact moment. Positional encoding uses the same trick: several waves, each at
          its own speed. Compare a fast wave against a much slower one over the same 20 positions:
        </p>
      ),
      visual: <ClockDiagram />,
      chart: (
        <div className="space-y-2">
          <FunctionPlot fn={Math.sin} xMin={0} xMax={20} xLabel="word position" yLabel="fast wave" color="#ea580c" />
          <FunctionPlot fn={(pos: number) => Math.sin(pos / 10)} xMin={0} xMax={20} xLabel="word position" yLabel="slow wave" color="#7c3aed" />
        </div>
      ),
    },
    {
      section: "3. Positional Encoding",
      title: "Encoding position as waves at different speeds",
      body: (
        <div className="space-y-2">
          <p>
            Rather than one wave, positional encoding builds a whole family of them — one per
            speed. We label the speeds with a number <Equation tex="i" display={false} /> = 0, 1,
            2, 3, &hellip;, and speed <Equation tex="i" display={false} /> uses this wave:
          </p>
          <Equation tex={"\\text{wave}_i(pos) = \\sin\\!\\Big(\\frac{pos}{10000^{2i/d}}\\Big)"} />
          <p>
            where <Equation tex="d" display={false} /> is the total number of dimensions ({D_MODEL}{" "}
            here). A larger <Equation tex="i" display={false} /> means a much bigger divisor, so
            the wave moves more slowly:
          </p>
        </div>
      ),
      visual: (
        <div className="flex flex-wrap gap-3 text-sm font-mono">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-center">
              <div className="text-neutral-400">i = {i}</div>
              <div className="text-neutral-800 tabular-nums">÷ {(10000 ** ((2 * i) / D_MODEL)).toFixed(0)}</div>
              <div className="text-neutral-500">{i === 0 ? "fast wave" : i === 1 ? "slow wave" : i === 2 ? "even slower" : "slowest"}</div>
            </div>
          ))}
        </div>
      ),
      chart: (
        <p className="text-base text-neutral-600">
          <Equation tex="i" display={false} /> only goes up to 3 here — four speeds in total, since
          our embeddings have {D_MODEL} dimensions and, as the next two steps show, each speed is
          about to fill <em>two</em> of them, not just one.
        </p>
      ),
    },
    {
      section: "3. Positional Encoding",
      title: "One number per speed still isn't enough",
      body: (
        <p>
          Sine alone is ambiguous: at 30° and at 150°, sin gives back the exact same number, 0.50 —
          two different angles, one value, no way to tell them apart. This happens at every speed{" "}
          <Equation tex="i" display={false} />, not just one. Cosine at those same two angles gives{" "}
          <em>0.87</em> and <em>−0.87</em> — completely different. Together, (sin, cos) is just a
          point&rsquo;s (height, sideways position) as it moves around a circle, and that pair
          always pins down one unique angle.
        </p>
      ),
      visual: <UnitCircleDiagram angles={[30, 150]} />,
      chart: (
        <div className="flex flex-wrap gap-3 text-sm font-mono">
          <div className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-center">
            <div className="text-orange-600">30°</div>
            <div className="text-neutral-800 tabular-nums">sin 0.50</div>
            <div className="text-neutral-800 tabular-nums">cos 0.87</div>
          </div>
          <div className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-center">
            <div className="text-violet-600">150°</div>
            <div className="text-neutral-800 tabular-nums">sin 0.50</div>
            <div className="text-neutral-800 tabular-nums">cos -0.87</div>
          </div>
        </div>
      ),
    },
    {
      section: "3. Positional Encoding",
      title: "The formula",
      body: (
        <p>
          So: give every speed <Equation tex="i" display={false} /> two dimensions instead of one —
          a sine and its cosine twin. That&rsquo;s exactly what the real formula does:
          <Equation tex={"PE_{(pos,\\,2i)} = \\sin\\!\\Big(\\frac{pos}{10000^{2i/d}}\\Big)"} />
          <Equation tex={"PE_{(pos,\\,2i+1)} = \\cos\\!\\Big(\\frac{pos}{10000^{2i/d}}\\Big)"} />
          <Equation tex="pos" display={false} /> is the word&rsquo;s position. Dimension{" "}
          <Equation tex="2i" display={false} /> holds speed <Equation tex="i" display={false} />
          &rsquo;s sine; dimension <Equation tex="2i+1" display={false} /> holds that same speed&rsquo;s
          cosine twin, right next to it. Four speeds, two dimensions each, gives all{" "}
          {D_MODEL} dimensions.
        </p>
      ),
      visual: <ClockDiagram />,
    },
    {
      section: "3. Positional Encoding",
      title: "All three conditions, satisfied",
      body: (
        <div className="space-y-2">
          <p>Checking back against the list from earlier:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li><strong>Bounded:</strong> sin and cos never leave <Equation tex="[-1, 1]" display={false} />, no matter how long the sentence gets.</li>
            <li><strong>Full vector:</strong> four speeds × two dimensions each fills the whole embedding, one number per dimension.</li>
            <li>
              <strong>Relative distance:</strong> this one&rsquo;s a genuinely neat bonus property —
              moving from any position to another one <Equation tex="k" display={false} /> words
              later turns out to be the exact same rotation of the (sin, cos) pair, no matter where
              you started. We won&rsquo;t prove it here, but it&rsquo;s exactly why this scheme —
              not just any bounded, full-vector code — was the one chosen.
            </li>
          </ul>
        </div>
      ),
      visual: <ClockDiagram />,
    },
    {
      section: "3. Positional Encoding",
      title: "All the waves together: the heatmap",
      body: (
        <p>
          Focus on just <em>one column</em> in the picture below: reading it top to bottom gives
          you that one position&rsquo;s entire positional-encoding vector — one number per
          dimension, exactly like the embedding strips from earlier, just drawn standing up
          instead of lying flat. The whole picture is simply every position&rsquo;s column, side
          by side. Row = one wave (one dimension); color = that wave&rsquo;s value in that column&rsquo;s
          position — orange for negative, cyan for positive. Top rows flip color quickly (fast
          waves, like the second hand); bottom rows barely change (slow waves, like the hour hand).
        </p>
      ),
      visual: <PositionalEncodingHeatmap maxPos={12} dModel={D_MODEL} />,
    },
    {
      section: "3. Positional Encoding",
      title: "Final embedding = token + position",
      body: (
        <p>
          The number a token&rsquo;s position actually contributes is just added, element by
          element, onto its token embedding. Everything downstream sees only this sum — token
          identity and position, blended into one vector.
        </p>
      ),
      visual: (
        <div className="space-y-2">
          <EmbeddingVector values={firstEmbedding} label="token" scale={0.6} />
          <EmbeddingVector values={firstPositional} label="+ position" scale={1} />
          <EmbeddingVector values={firstFinalEmbedding} label="= final" scale={1.4} />
        </div>
      ),
    },
    {
      section: "Wrap-up",
      title: "What you learned in this chapter",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Text is split into <Term id="token">tokens</Term>.</li>
            <li>Each token maps to a fixed <Term id="embedding">embedding</Term> vector.</li>
            <li>
              A <Term id="positional-encoding">positional encoding</Term> — built from sine and
              cosine waves at different speeds — is added on top, so the final vector carries both
              identity and position.
            </li>
          </ul>
          <p>
            Or,{" "}
            <button
              type="button"
              className={chapterLinkBtn}
              onClick={() => onNavigateToChapter?.("attention")}
            >
              proceed to Attention →
            </button>
          </p>
        </div>
      ),
      visual: <TokenChips tokens={tokenize(DEFAULT_TEXT)} />,
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
