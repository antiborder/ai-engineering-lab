"use client";

import { useState, type ReactNode } from "react";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { ToolCallFlowDiagram, type ToolCallStageId } from "./ToolCallFlowDiagram";
import { MCPWiringDiagram } from "./MCPWiringDiagram";
import { MCPLayerShiftDiagram } from "./MCPLayerShiftDiagram";
import { MCPSequenceDiagram } from "./MCPSequenceDiagram";
import type { ChapterId } from "./ToolCallingAgentsPlayground";

interface ToolExample {
  message: string;
  tool: "calculator" | "weather" | "search" | null;
  args: string | null;
  result: string | null;
}

// Real computed output from backend/app/genai/tools.py — not fabricated.
const TOOL_EXAMPLES: ToolExample[] = [
  { message: "what is 15% of 240", tool: "calculator", args: "expression: 15% of 240", result: "36.0" },
  { message: "what's the weather in Berlin", tool: "weather", args: "city: berlin", result: "Berlin: cloudy, 11°C" },
  {
    message: "tell me about mount everest",
    tool: "search",
    args: "query: tell me about mount everest",
    result: "[Mount Everest] Mount Everest, on the border of Nepal and Tibet, is Earth's highest mountain…",
  },
  { message: "hello, how are you?", tool: null, args: null, result: null },
];

const HIGHLIGHT_FOR_TOOL: Record<"calculator" | "weather" | "search", ToolCallStageId[]> = {
  calculator: ["tool-selection", "tool-execution", "tool-result"],
  weather: ["tool-selection", "tool-execution", "tool-result"],
  search: ["tool-selection", "tool-execution", "tool-result"],
};

/** GenAI Systems Unit's fifth Chapter (first of two in the Tool Calling &
 * Agents Unit). Entirely schematic/illustrative — no backend calls —
 * matching every other GenAI Systems Chapter's split between a fast
 * guided walkthrough and a separately-unlocked "Explore it yourself"
 * sandbox (here, the real backend-connected ToolCallingLab). */
export function ToolCallingWalkthrough({
  onComplete,
  onNavigateToChapter,
}: {
  onComplete?: () => void;
  onNavigateToChapter?: (chapter: ChapterId) => void;
}) {
  const [step, setStep] = useState(0);

  const [exampleIndex, setExampleIndex] = useState<number | null>(null);
  const resetExample = () => setExampleIndex(null);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";
  const chapterLinkBtn =
    "inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm font-semibold";
  const toggleBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-base border text-left ${
      active ? "bg-cyan-600 border-cyan-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400"
    }`;

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    controls?: ReactNode;
    resetAction?: () => void;
  }

  const example = exampleIndex !== null ? TOOL_EXAMPLES[exampleIndex] : null;

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers how a model uses an external tool to answer a question:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>Why Tools?</strong> — what a model can&rsquo;t do alone, and what a tool is.</li>
            <li><strong>The Round Trip</strong> — how one tool call actually happens, step by step.</li>
            <li><strong>Three Tools</strong> — calculator, weather, and search.</li>
            <li><strong>Choosing a Tool</strong> — how the model picks, for real and in this app.</li>
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
          Tool calling is one round trip: the model decides whether it needs a tool, the tool
          runs, and the model answers using the result.
        </p>
      ),
      visual: <ToolCallFlowDiagram />,
    },
    // -------------------------- 1. Why Tools? --------------------------
    {
      section: "1. Why Tools?",
      title: "LLMs Can't Do Everything Alone",
      body: (
        <p>
          A model is good at language, but it can&rsquo;t reliably do exact math, doesn&rsquo;t
          know live data, and can&rsquo;t see your private documents.
        </p>
      ),
      visual: (
        <div className="flex flex-col sm:flex-row gap-2 text-sm">
          <div className="flex-1 bg-white border border-emerald-300 rounded-md p-3">
            <div className="font-medium text-emerald-700 mb-1">Good at</div>
            <div className="text-neutral-500">Language, general knowledge</div>
          </div>
          <div className="flex-1 bg-white border border-red-300 rounded-md p-3">
            <div className="font-medium text-red-700 mb-1">Needs help with</div>
            <div className="text-neutral-500">Exact math, live data, your own documents</div>
          </div>
        </div>
      ),
    },
    {
      section: "1. Why Tools?",
      title: "A Tool Is a Function the Model Can Call",
      body: (
        <p>
          A tool is ordinary code — a calculator, a weather
          lookup, a document search — that the model calls when it needs an answer it
          can&rsquo;t produce on its own.
        </p>
      ),
      visual: (
        <div className="flex flex-col sm:flex-row items-stretch gap-2 text-sm">
          <div className="flex-1 bg-white border border-neutral-300 rounded-md p-3">
            <div className="font-medium text-neutral-700 mb-1">Model doesn&rsquo;t know</div>
            <div className="text-neutral-500">&ldquo;What&rsquo;s 15% of 240?&rdquo;</div>
          </div>
          <div className="flex items-center justify-center text-neutral-400 shrink-0">→</div>
          <div className="flex-1 bg-white border border-cyan-300 rounded-md p-3">
            <div className="font-medium text-cyan-700 mb-1">Tool computes it</div>
            <div className="text-neutral-500">Calculator: 36.0</div>
          </div>
          <div className="flex items-center justify-center text-neutral-400 shrink-0">→</div>
          <div className="flex-1 bg-white border border-emerald-300 rounded-md p-3">
            <div className="font-medium text-emerald-700 mb-1">Model uses the answer</div>
            <div className="text-neutral-500">&ldquo;15% of 240 is 36.&rdquo;</div>
          </div>
        </div>
      ),
    },
    // -------------------------- 2. The Round Trip --------------------------
    {
      section: "2. The Round Trip",
      title: "Tool Calling: One Exchange, Three Moves",
      body: (
        <p>
          Tool calling is this whole round trip — decide, run,
          answer — happening in a single exchange with the model.
        </p>
      ),
      visual: <ToolCallFlowDiagram />,
    },
    {
      section: "2. The Round Trip",
      title: "Step 1: The Model Decides",
      body: (
        <p>
          The model reads the message and decides whether a tool is needed, and which one.
        </p>
      ),
      visual: <ToolCallFlowDiagram highlight={["user", "llm-decide", "tool-selection"]} />,
    },
    {
      section: "2. The Round Trip",
      title: "Step 2: The Tool Runs",
      body: (
        <p>The chosen tool executes with the extracted arguments and produces a result.</p>
      ),
      visual: <ToolCallFlowDiagram highlight={["tool-execution", "tool-result"]} />,
    },
    {
      section: "2. The Round Trip",
      title: "Step 3: The Model Answers Using the Result",
      body: (
        <p>
          The tool&rsquo;s result is fed back to the model as new information, and the model
          writes the final answer.
        </p>
      ),
      visual: <ToolCallFlowDiagram highlight={["tool-result", "llm-answer", "answer"]} />,
    },
    {
      section: "2. The Round Trip",
      title: "No Match, No Tool: The Model Answers Directly",
      body: (
        <p>If nothing matches, the model skips straight to answering — a tool call is optional, not automatic.</p>
      ),
      visual: <ToolCallFlowDiagram skipTool />,
    },
    // -------------------------- 3. Three Tools --------------------------
    {
      section: "3. Three Tools",
      title: "Calculator: Exact Math, Not a Guess",
      body: (
        <p>Handles arithmetic and percentages exactly, instead of relying on the model&rsquo;s own math.</p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white font-mono">15% of 240</span>
          <span className="text-neutral-400">→</span>
          <span className="px-3 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800 font-mono">36.0</span>
        </div>
      ),
    },
    {
      section: "3. Three Tools",
      title: "Weather: A Live-Style Lookup",
      body: (
        <p>
          Returns a deterministic reading for a named city — standing in for tools that fetch
          real-time data a model can&rsquo;t know on its own.
        </p>
      ),
      visual: (
        <div className="flex items-center justify-center gap-3 text-sm">
          <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white font-mono">Berlin</span>
          <span className="text-neutral-400">→</span>
          <span className="px-3 py-1.5 rounded-full border border-cyan-300 bg-cyan-50 text-cyan-800 font-mono">
            Berlin: cloudy, 11°C
          </span>
        </div>
      ),
    },
    {
      section: "3. Three Tools",
      title: "Search: Reuses RAG's Real Retrieval",
      body: (
        <p>
          The same TF-IDF search from the RAG chapter, searching this app&rsquo;s document
          corpus for the most relevant chunk.
        </p>
      ),
      visual: (
        <div className="space-y-1.5 text-sm">
          <div className="text-center">
            <span className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white font-mono">
              tell me about mount everest
            </span>
          </div>
          <div className="flex justify-center text-neutral-300">↓</div>
          <div className="bg-cyan-50 border border-cyan-300 rounded-md p-2.5 text-cyan-900">
            [Mount Everest] Mount Everest, on the border of Nepal and Tibet, is Earth&rsquo;s
            highest mountain above sea level at 8,849 meters…
          </div>
        </div>
      ),
    },
    // -------------------------- 4. Choosing a Tool --------------------------
    {
      section: "4. Choosing a Tool",
      title: "Real APIs: The Model Outputs a Structured Call",
      body: (
        <p>
          Each tool is registered with a JSON Schema of its arguments — the same idea from
          Structured Output — and the model&rsquo;s output is a structured call matching it.
        </p>
      ),
      visual: (
        <div className="space-y-1.5 text-sm">
          <div className="bg-white border border-green-300 rounded-md p-2 font-mono text-neutral-700">
            weather(city: string)
          </div>
          <div className="flex justify-center text-neutral-300">↓</div>
          <div className="bg-cyan-50 border border-cyan-300 rounded-md p-2 font-mono text-cyan-900">
            {"{ tool: \"weather\", args: { city: \"Berlin\" } }"}
          </div>
        </div>
      ),
    },
    {
      section: "4. Choosing a Tool",
      title: "This App: Patterns Stand In for the Model's Choice",
      body: (
        <p>
          Since the mock model can&rsquo;t reason, tool selection here is rule-based — matched
          by pattern — a disclosed simplification, not real function-calling.
        </p>
      ),
      visual: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-1.5 pr-3 font-medium">Message contains</th>
                <th className="pb-1.5 font-medium">Tool</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 font-mono text-neutral-700">a math expression, or &ldquo;N% of M&rdquo;</td>
                <td className="py-1.5 text-cyan-700 font-medium">calculator</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 font-mono text-neutral-700">&ldquo;weather in/for &lt;city&gt;&rdquo;</td>
                <td className="py-1.5 text-cyan-700 font-medium">weather</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 font-mono text-neutral-700">&ldquo;search&rdquo;, &ldquo;find&rdquo;, &ldquo;what is&rdquo;, &ldquo;tell me about&rdquo;…</td>
                <td className="py-1.5 text-cyan-700 font-medium">search</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 font-mono text-neutral-500">none of the above</td>
                <td className="py-1.5 text-neutral-500 font-medium">(no tool)</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      section: "4. Choosing a Tool",
      title: "The Problem: Every App, Every Tool, Custom Code",
      body: (
        <p>
          Say 3 apps — a chat app, a coding assistant, a spreadsheet tool — each want access to
          a GitHub tool and a Calendar tool. Without a shared standard, that&rsquo;s 6 separate,
          custom-written integrations — one per (app, tool) pair.
        </p>
      ),
      visual: <MCPWiringDiagram apps={["Chat App", "Coding Assistant", "Spreadsheet"]} tools={["GitHub", "Calendar", "Docs"]} mode="direct" />,
    },
    {
      section: "4. Choosing a Tool",
      title: "With MCP, the Adapter Code Moves to the Server",
      body: (
        <div className="space-y-2">
          <p>
            Without MCP, your app has to translate each tool call into
            that service&rsquo;s actual API request itself. With MCP, that translation step
            moves inside the MCP server instead. What this buys you:
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>You don&rsquo;t write GitHub&rsquo;s (or any service&rsquo;s) request format, auth headers, or response parsing yourself.</li>
            <li>The same generic MCP Client works for every service — no per-service integration code in your app.</li>
            <li>If GitHub changes its API, only the MCP Server needs to update — your app doesn&rsquo;t.</li>
            <li>Adding a new service means connecting to its MCP server, not writing new integration code.</li>
          </ul>
        </div>
      ),
      visual: <MCPLayerShiftDiagram />,
    },
    {
      section: "4. Choosing a Tool",
      title: "Tool Calling vs. MCP: Two Different Jobs",
      body: (
        <p>
          Tool calling and MCP aren&rsquo;t alternatives — they answer different questions.
          Tool calling is still exactly what earlier steps in this chapter described; MCP just
          handles the plumbing underneath it.
        </p>
      ),
      visual: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="pb-1.5 pr-3 font-medium"></th>
                <th className="pb-1.5 pr-3 font-medium">Tool calling</th>
                <th className="pb-1.5 font-medium">MCP</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 font-medium text-neutral-600">Answers</td>
                <td className="py-1.5 pr-3 text-neutral-700">Should I use a tool? Which one? What arguments?</td>
                <td className="py-1.5 text-neutral-700">How do I reach that tool, and what tools even exist?</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 font-medium text-neutral-600">Decided by</td>
                <td className="py-1.5 pr-3 text-neutral-700">the model</td>
                <td className="py-1.5 text-neutral-700">the app&rsquo;s plumbing, following the protocol</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 font-medium text-neutral-600">In this app</td>
                <td className="py-1.5 pr-3 text-neutral-700">pattern-matching (previous step)</td>
                <td className="py-1.5 text-neutral-500">not used — see next step</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      section: "4. Choosing a Tool",
      title: "MCP in Action: One Tool Call, Step by Step",
      body: (
        <p>
          Once the model has decided it needs the calendar, your app — not the model itself —
          asks the MCP server what&rsquo;s available, then calls the tool through it.
        </p>
      ),
      visual: <MCPSequenceDiagram />,
    },
    {
      section: "4. Choosing a Tool",
      title: "This App: Tools Hardcoded, No MCP",
      body: (
        <p>
          This app skips the MCP server entirely — its 3 tools are wired directly into the
          backend. Fine at this scale; not how systems with dozens of tools are actually built.
        </p>
      ),
      visual: <MCPWiringDiagram apps={["This App"]} tools={["Calculator", "Weather", "Search"]} mode="direct" />,
    },
    {
      section: "4. Choosing a Tool",
      title: "Try it yourself: which tool gets picked?",
      body: <p>Click a message and see which tool the pattern-matcher selects.</p>,
      controls: (
        <div className="grid gap-2 w-full max-w-sm">
          {TOOL_EXAMPLES.map((ex, i) => (
            <button key={ex.message} onClick={() => setExampleIndex(i)} className={toggleBtn(exampleIndex === i)}>
              {ex.message}
            </button>
          ))}
        </div>
      ),
      resetAction: resetExample,
      visual: (
        <div className="space-y-2">
          <ToolCallFlowDiagram
            highlight={example?.tool ? HIGHLIGHT_FOR_TOOL[example.tool] : undefined}
            skipTool={example !== null && example.tool === null}
          />
          {example && (
            <div className="bg-white border border-neutral-200 rounded-md p-3 space-y-1 text-sm">
              {example.tool ? (
                <>
                  <div className="text-neutral-600">
                    Tool: <span className="text-cyan-700 font-mono">{example.tool}</span>
                  </div>
                  <div className="text-neutral-600">
                    Arguments: <span className="font-mono text-neutral-400">{example.args}</span>
                  </div>
                  <div className="text-neutral-600">
                    Result: <span className="font-mono text-neutral-400">{example.result}</span>
                  </div>
                </>
              ) : (
                <div className="text-neutral-500">No tool was needed for this message.</div>
              )}
            </div>
          )}
        </div>
      ),
    },
    // ---------------------------- 5. Wrap-up ------------------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Models can&rsquo;t reliably do exact math, don&rsquo;t know live data, and can&rsquo;t see your documents.</li>
            <li>Tool calling is one round trip: decide, run the tool, answer using the result.</li>
            <li>If no tool matches, the model skips straight to answering.</li>
            <li>This app has three tools: calculator, weather, and search (which reuses RAG&rsquo;s retrieval).</li>
            <li>Real APIs pick a tool via a structured, schema-matched call; this app pattern-matches instead, as a disclosed simplification.</li>
          </ul>
        </div>
      ),
      visual: <ToolCallFlowDiagram />,
    },
    {
      section: "5. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything above is now unlocked below, talking to the real backend: send your own
          messages and see which tool gets picked.
          <br />
          Or,{" "}
          <button type="button" className={chapterLinkBtn} onClick={() => onNavigateToChapter?.("agents")}>
            proceed to the Agents chapter →
          </button>
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
