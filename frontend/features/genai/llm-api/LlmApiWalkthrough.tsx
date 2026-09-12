"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Equation } from "@/components/Equation";
import { Term } from "@/components/Term";
import { StatCard } from "@/components/StatCard";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { TokenChips } from "../../fundamentals/transformers/TokenChips";
import { RequestFlowDiagram } from "./RequestFlowDiagram";
import { ConversationHistoryDiagram } from "./ConversationHistoryDiagram";

const SAMPLE_PROMPT = "Explain what a vector database is in two sentences.";
const SAMPLE_INPUT_TOKENS = SAMPLE_PROMPT.split(/\s+/).filter(Boolean).length;

// Same fabricated-but-stable pricing as backend/app/providers/mock.py's
// _MOCK_PRICING_PER_1K_TOKENS — kept in sync by hand since this Chapter is
// fully client-side/illustrative, no backend calls during the walkthrough
// itself (only "Explore it yourself" talks to the real API).
const PRICING: Record<"mock-small" | "mock-large", { in: number; out: number }> = {
  "mock-small": { in: 0.0001, out: 0.0002 },
  "mock-large": { in: 0.001, out: 0.002 },
};
const EXAMPLE_INPUT = 50;
const EXAMPLE_OUTPUT = 80;

function cost(model: "mock-small" | "mock-large", inputTokens: number, outputTokens: number): number {
  const p = PRICING[model];
  return (inputTokens / 1000) * p.in + (outputTokens / 1000) * p.out;
}

/** GenAI Systems Unit's first Chapter: the shape of a single LLM API
 * call — model, system/user prompts, tokens, latency, cost, determinism.
 * Entirely schematic/illustrative — no backend calls — matching every
 * Fundamentals Chapter's split between a fast guided walkthrough and a
 * separately-unlocked "Explore it yourself" sandbox (here, the real
 * backend-connected LlmApiLab). See backend/app/api/genai.py and
 * backend/app/providers/mock.py for the real request/response shape and
 * mock pricing this Chapter describes. */
export function LlmApiWalkthrough({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);

  const [costModel, setCostModel] = useState<"mock-small" | "mock-large">("mock-small");
  const resetCostModel = () => setCostModel("mock-small");

  const [turn, setTurn] = useState(1);
  const resetTurn = () => setTurn(1);
  const [cacheOn, setCacheOn] = useState(false);
  const resetCache = () => setCacheOn(false);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";
  const chapterLinkBtn =
    "inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm font-semibold";

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers the shape of a single LLM API call, end to end:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Calling a Model</strong> — the request: system prompt, user prompt, choosing a model.</li>
            <li><strong>Configuration</strong> — temperature, max_tokens, and reasoning effort.</li>
            <li><strong>Tokens</strong> — counting what goes in and what comes out.</li>
            <li><strong>Latency</strong> — how long a call takes.</li>
            <li><strong>Cost</strong> — how tokens turn into a price.</li>
            <li><strong>Determinism</strong> — whether the same call gives the same answer twice.</li>
            <li><strong>Conversations &amp; Memory</strong> — why the app resends the whole history, and how caching helps.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The big picture",
      body: (
        <p>
          Fundamentals showed you what happens inside a Transformer. This chapter shows what it
          looks like from the outside — a simple request in, a response (with its tokens,
          latency, and cost) out.
        </p>
      ),
      visual: <RequestFlowDiagram />,
    },
    // -------------------------- 1. Calling a Model --------------------------
    {
      section: "1. Calling a Model",
      title: "From training to a simple request",
      body: (
        <p>
          Every piece you built in Fundamentals — embeddings, attention, blocks, generation — is
          still in there. An LLM API just wraps all of it behind one call: send text in, get text
          back.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["model"]} />,
    },
    {
      section: "1. Calling a Model",
      title: "Part one of the request: the system prompt",
      body: (
        <p>
          The <Term id="system-prompt">system prompt</Term> sets the model&rsquo;s role for the
          whole call — &ldquo;you are a helpful assistant,&rdquo; for example. It&rsquo;s optional,
          and it isn&rsquo;t the actual question.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["system"]} />,
    },
    {
      section: "1. Calling a Model",
      title: "Part two: the user prompt",
      body: (
        <p>
          The user prompt is the actual question or task for this one call — what you&rsquo;re
          asking right now. Together, system + user prompt are everything the model sees.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["user"]} />,
    },
    {
      section: "1. Calling a Model",
      title: "Choosing a model",
      body: (
        <p>
          This app offers two models to call. They differ the way you&rsquo;d expect: bigger
          usually answers better, but costs more and takes longer. Exact numbers are next.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="mock-small" value="faster, cheaper" />
          <StatCard label="mock-large" value="slower, pricier" />
        </div>
      ),
    },
    // -------------------------- 2. Configuration --------------------------
    {
      section: "2. Configuration",
      title: "A request has settings, too",
      body: (
        <p>
          Beyond system + user prompt and model choice, a real request carries dials that shape
          the response: how random it is, how long it&rsquo;s allowed to be, and — for some
          models — how much the model &ldquo;thinks&rdquo; before answering.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["config"]} />,
    },
    {
      section: "2. Configuration",
      title: "Temperature: how random the output is",
      body: (
        <p>
          You already met <Term id="temperature">temperature</Term> in Tiny LLM — it&rsquo;s the
          exact same dial, just now something you set on every request instead of a slider in a
          sandbox.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["config"]} />,
    },
    {
      section: "2. Configuration",
      title: "max_tokens: a cap on the response",
      body: (
        <p>
          A limit on how many output tokens the model is allowed to generate. It protects you
          from a runaway response — and its cost and latency — by cutting the answer off once the
          cap is hit, finished or not.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["config", "response"]} />,
    },
    {
      section: "2. Configuration",
      title: "Reasoning effort: paying for hidden thinking",
      body: (
        <p>
          Some models can spend extra, usually-invisible &ldquo;thinking&rdquo; tokens before
          answering — <Term id="reasoning-effort">reasoning effort</Term> controls how much.
          Higher effort can mean a better answer, but those thinking tokens are still billed as
          output.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["config", "response"]} />,
    },
    // -------------------------- 3. Tokens --------------------------
    {
      section: "3. Tokens",
      title: "Counting the request: input tokens",
      body: (
        <p>
          Same idea as Fundamentals&rsquo; tokens — but now they&rsquo;re billed. This app counts
          input tokens by splitting on spaces (a simplification; real tokenizers are pickier),
          giving <strong>{SAMPLE_INPUT_TOKENS} tokens</strong> for this example prompt:
        </p>
      ),
      visual: <TokenChips tokens={SAMPLE_PROMPT.split(/\s+/).filter(Boolean)} />,
    },
    {
      section: "3. Tokens",
      title: "Counting the response: output tokens",
      body: (
        <p>
          The response costs tokens too — and its length isn&rsquo;t fixed. In this app it varies
          call to call, anywhere from about 20 to 120 tokens, depending on what the model
          generates.
        </p>
      ),
      visual: (
        <div className="flex items-center gap-3">
          <StatCard label="Shortest" value="~20 tokens" />
          <StatCard label="Longest" value="~120 tokens" />
        </div>
      ),
    },
    // -------------------------- 4. Latency --------------------------
    {
      section: "4. Latency",
      title: "How long it takes: latency",
      body: (
        <p>
          <strong>Latency</strong> is the time from sending the request to getting the full
          response back — longer prompts and longer responses both take more time.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["model", "response"]} />,
    },
    // -------------------------- 5. Cost --------------------------
    {
      section: "5. Cost",
      title: "Every token has a price",
      body: (
        <p>
          Cost is calculated from the tokens you just met — input and output are priced{" "}
          <em>separately</em>, both per 1,000 tokens.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["response"]} />,
    },
    {
      section: "5. Cost",
      title: "The cost formula",
      body: (
        <div className="space-y-2">
          <p>Multiply each token count by its own price per 1,000, then add:</p>
          <Equation
            tex={
              "\\text{Cost} = \\frac{\\text{input tokens}}{1000}\\times\\text{price}_{\\text{in}} + \\frac{\\text{output tokens}}{1000}\\times\\text{price}_{\\text{out}}"
            }
          />
          <p>
            For a {EXAMPLE_INPUT}-input / {EXAMPLE_OUTPUT}-output-token call on mock-small:
          </p>
        </div>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="input: 50 tokens × $0.0001/1k" value={`$${((EXAMPLE_INPUT / 1000) * PRICING["mock-small"].in).toFixed(6)}`} />
          <StatCard label="output: 80 tokens × $0.0002/1k" value={`$${((EXAMPLE_OUTPUT / 1000) * PRICING["mock-small"].out).toFixed(6)}`} />
        </div>
      ),
    },
    {
      section: "5. Cost",
      title: "Try it yourself: mock-small vs. mock-large",
      body: (
        <p>
          Same {EXAMPLE_INPUT}-input / {EXAMPLE_OUTPUT}-output-token call — switch the model and
          watch the cost move.
        </p>
      ),
      controls: (
        <div className="flex gap-2">
          {(["mock-small", "mock-large"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCostModel(m)}
              className={`px-3 py-1.5 rounded-md text-base border ${
                costModel === m
                  ? "bg-cyan-600 border-cyan-600 text-white"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      ),
      resetAction: resetCostModel,
      visual: (
        <StatCard
          label={`${costModel}, ${EXAMPLE_INPUT} in / ${EXAMPLE_OUTPUT} out`}
          value={`$${cost(costModel, EXAMPLE_INPUT, EXAMPLE_OUTPUT).toFixed(6)}`}
          tone={costModel === "mock-large" ? "warn" : "good"}
        />
      ),
    },
    // -------------------------- 6. Determinism --------------------------
    {
      section: "6. Determinism",
      title: "Same input, same output — for now",
      body: (
        <p>
          This app&rsquo;s mock model is deterministic: the exact same model + system + user
          prompt always produces the exact same response, tokens, and cost, every single time you
          call it.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["model"]} />,
    },
    {
      section: "6. Determinism",
      title: "Real APIs usually aren't",
      body: (
        <p>
          A real model typically samples its next token, the same idea as Tiny LLM&rsquo;s{" "}
          <Term id="temperature">temperature</Term> — so calling it twice, even with identical
          inputs, can give back two different answers.
        </p>
      ),
      visual: <RequestFlowDiagram highlight={["model", "response"]} />,
    },
    {
      section: "6. Determinism",
      title: "Every call gets a receipt",
      body: (
        <p>
          Alongside the text, every response carries a request ID and a timestamp — a paper trail
          that later modules (Evaluation, LLMOps) build on to track what a system actually did.
        </p>
      ),
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="request_id" value="a1b2c3d4…" />
          <StatCard label="timestamp" value="2026-08-24T…" />
        </div>
      ),
    },
    // -------------------------- 7. Conversations & Memory --------------------------
    {
      section: "7. Conversations & Memory",
      title: "Does the model remember the last message?",
      body: (
        <p>
          No. Every call in this chapter has been standalone — the model itself keeps nothing
          between one call and the next. Two calls, even back to back, share no memory at all.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3">
          <StatCard label="Call 1" value="Model" />
          <span className="text-2xl text-neutral-300">≠</span>
          <StatCard label="Call 2" value="Model" />
        </div>
      ),
    },
    {
      section: "7. Conversations & Memory",
      title: "So the app resends the whole history",
      body: (
        <p>
          A chat only <em>feels</em> continuous because the app does the remembering: every new
          call&rsquo;s input is the entire conversation so far, plus your one new message, sent
          again from scratch.
        </p>
      ),
      visual: <ConversationHistoryDiagram turn={3} />,
    },
    {
      section: "7. Conversations & Memory",
      title: "Try it yourself: watch tokens grow with every turn",
      body: (
        <p>
          Drag the slider through a 5-turn conversation and watch the resent history — and the
          cost — grow with it.
        </p>
      ),
      controls: (
        <div className="w-full max-w-[300px]">
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Turn</span>
              <span className="text-neutral-800 tabular-nums">{turn}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={turn}
              onChange={(e) => setTurn(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
        </div>
      ),
      resetAction: resetTurn,
      visual: <ConversationHistoryDiagram turn={turn} />,
    },
    {
      section: "7. Conversations & Memory",
      title: "The real-world fix: caching repeated prefixes",
      body: (
        <p>
          Real providers notice when a request&rsquo;s beginning is byte-for-byte the same as one
          they just processed — the growing history, almost always — and bill those{" "}
          <Term id="cached-tokens">cached tokens</Term> at a fraction of the normal input price,
          instead of full price every single turn.
        </p>
      ),
      visual: <ConversationHistoryDiagram turn={3} cached />,
    },
    {
      section: "7. Conversations & Memory",
      title: "Try it yourself: cached vs. fresh",
      body: (
        <p>
          Same growing conversation — toggle caching and compare the cost at each turn.
        </p>
      ),
      controls: (
        <div className="w-full max-w-[300px] space-y-3">
          <label className="block text-base">
            <div className="flex justify-between text-neutral-600 mb-1">
              <span>Turn</span>
              <span className="text-neutral-800 tabular-nums">{turn}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={turn}
              onChange={(e) => setTurn(Number(e.target.value))}
              className="w-full accent-cyan-600"
            />
          </label>
          <button
            onClick={() => setCacheOn((c) => !c)}
            className={`px-3 py-1.5 rounded-md text-base border ${
              cacheOn
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
            }`}
          >
            Caching: {cacheOn ? "on" : "off"}
          </button>
        </div>
      ),
      resetAction: () => {
        resetTurn();
        resetCache();
      },
      visual: <ConversationHistoryDiagram turn={turn} cached={cacheOn} />,
    },
    // ---------------------------- 8. Wrap-up ------------------------------
    {
      section: "8. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A call has a <Term id="system-prompt">system prompt</Term> (role/instructions) and a user prompt (the actual question).</li>
            <li>Requests also carry configuration: <Term id="temperature">temperature</Term>, max output length, and — on some models — <Term id="reasoning-effort">reasoning effort</Term>.</li>
            <li>Both the request and the response are measured in <Term id="token">tokens</Term>.</li>
            <li>Latency is time-to-response; cost is input tokens and output tokens, priced separately, per 1,000.</li>
            <li>This app&rsquo;s mock model is deterministic; real models usually sample, so output varies.</li>
            <li>The model has no memory — every turn resends the whole conversation, so cost grows with it, unless <Term id="cached-tokens">cached tokens</Term> keep the repeated part cheap.</li>
            <li>Every response carries a request ID and timestamp for tracing later.</li>
          </ul>
        </div>
      ),
      visual: <RequestFlowDiagram />,
    },
    {
      section: "8. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything above is now unlocked below, talking to the real backend: write your own
          prompts, switch models, and watch tokens, latency, and cost update live.
          <br />
          Or,{" "}
          <Link href="/genai/prompt-engineering" className={chapterLinkBtn}>
            proceed to Prompt Engineering →
          </Link>
        </p>
      ),
      visual: undefined,
    },
  ];

  const total = steps.length;
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

        <div className="space-y-3">{current.visual}</div>
      </div>
    </div>
  );
}
