"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Term } from "@/components/Term";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { StructuredOutputFlowDiagram } from "./StructuredOutputFlowDiagram";
import { ConstrainedDecodingDiagram } from "./ConstrainedDecodingDiagram";

const SCHEMA_EXCERPT = `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" },
    "role": { "type": "string", "enum": ["admin", "member", "guest"] },
    "active": { "type": "boolean" }
  },
  "required": ["name", "age", "role", "active"]
}`;

const JSON_EXAMPLE = `{
  "name": "Alex Rivera",
  "age": 34,
  "active": true,
  "tags": ["new", "verified"],
  "manager": null
}`;

const ROLE_OPTIONS = ["admin", "member", "guest"] as const;

function RoleChips({ selected }: { selected: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-sm text-neutral-500 font-mono">role:</span>
      {ROLE_OPTIONS.map((r) => (
        <span
          key={r}
          className={`px-3 py-1.5 rounded-full text-base font-mono border ${
            r === selected
              ? "bg-cyan-600 border-cyan-600 text-white"
              : "bg-white border-neutral-200 text-neutral-400"
          }`}
        >
          {r === selected ? `✓ ${r}` : r}
        </span>
      ))}
    </div>
  );
}

const OUTPUT_EXAMPLE = {
  valid: `{
  "name": "Alex Rivera",
  "age": 34,
  "role": "member",
  "active": true
}`,
  broken: `{
  "name": "Alex Rivera",
  "age": 34,
  "role": { "unexpected": "wrong-shape" },
  "active": true
}`,
};

/** GenAI Systems Unit's third Chapter: turning a model's naturally
 * free-form text into a strict, parseable shape. Entirely
 * schematic/illustrative — no backend calls — matching every other GenAI
 * Systems Chapter's split between a fast guided walkthrough and a
 * separately-unlocked "Explore it yourself" sandbox (here, the real
 * backend-connected StructuredOutputLab, which validates real output
 * against a real, user-editable schema with `jsonschema`). */
export function StructuredOutputWalkthrough({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);

  const [role, setRole] = useState("member");
  const resetRole = () => setRole("member");

  const [outputOn, setOutputOn] = useState<"valid" | "broken">("valid");
  const resetOutput = () => setOutputOn("valid");

  const [decodingMode, setDecodingMode] = useState<"checked" | "blocked">("checked");
  const resetDecodingMode = () => setDecodingMode("checked");

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-base font-medium text-white";
  const chapterLinkBtn =
    "inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm font-semibold";
  const toggleBtn = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-base border ${
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

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers getting an LLM to produce output in a strict, checkable shape:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Pipeline</strong> — natural language plus a schema go in, a checked output comes out.</li>
            <li><strong>Writing a Schema</strong> — types, required fields, and enums.</li>
            <li><strong>Validation</strong> — catching output that doesn&rsquo;t match the schema.</li>
            <li><strong>Constrained Decoding</strong> — making invalid output impossible to generate at all.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "The big picture, before the details",
      body: (
        <p>
          Prompt Engineering was about writing better instructions. This chapter is about a
          narrower, more mechanical problem: getting a response back in a shape your code can
          actually parse — a fixed set of fields, with fixed types — instead of free-form
          paragraphs.
        </p>
      ),
      visual: <StructuredOutputFlowDiagram />,
    },
    // -------------------------- 1. The Pipeline --------------------------
    {
      section: "1. The Pipeline",
      title: "The Problem: Free-Form Text Isn't Reliable",
      body: (
        <p>
          A model naturally produces free-form text. Downstream code — a function call, a
          database row, a UI form — usually needs a strict, parseable shape instead. Asking
          nicely in the prompt (&ldquo;please reply as JSON with these fields&rdquo;) helps, but
          isn&rsquo;t reliable enough on its own — the exact formatting can still drift from call
          to call.
        </p>
      ),
      visual: <StructuredOutputFlowDiagram highlight={["task"]} />,
    },
    {
      section: "1. The Pipeline",
      title: "JSON Schema: A Contract for the Output's Shape",
      body: (
        <p>
          A <Term id="json-schema">JSON Schema</Term> is a specification, written as JSON itself,
          that describes the exact shape a piece of data must have. Sent alongside the task, it
          tells the model — and, downstream, a validator — exactly what fields, types, and
          structure the output must have.
        </p>
      ),
      visual: <StructuredOutputFlowDiagram highlight={["schema"]} />,
    },
    {
      section: "1. The Pipeline",
      title: "Where Does the Schema Actually Go?",
      body: (
        <p>
          Not inside the prompt text. Real APIs send the schema as its own request field —
          OpenAI&rsquo;s <code className="font-mono text-base">response_format</code>,
          Gemini&rsquo;s <code className="font-mono text-base">response_schema</code> — the same
          category as the <strong>configuration</strong> you already met in LLM API (temperature,
          max_tokens): something set alongside the prompt, not written into it. That&rsquo;s why
          the schema box below is green, the same color LLM API used for configuration —
          structured output isn&rsquo;t a prompt-engineering technique, it&rsquo;s a separate
          request parameter.
        </p>
      ),
      visual: <StructuredOutputFlowDiagram highlight={["schema"]} />,
    },
    {
      section: "1. The Pipeline",
      title: "JSON: A Plain-Text Format Built From Six Types",
      body: (
        <div className="space-y-3">
          <p>
            JSON is a plain-text format for representing data — human-readable, and reliable for
            code to parse, which is why LLM responses aim for it instead of free-form prose. It
            has exactly six types:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-base border-collapse">
              <thead>
                <tr className="text-left text-sm text-neutral-500">
                  <th className="pb-1.5 pr-3 font-medium">Type</th>
                  <th className="pb-1.5 font-medium">Example</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 text-neutral-700">object</td>
                  <td className="py-1.5 text-neutral-700">{'{ "role": "member" }'}</td>
                </tr>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 text-neutral-700">array</td>
                  <td className="py-1.5 text-neutral-700">[&quot;admin&quot;, &quot;member&quot;, &quot;guest&quot;]</td>
                </tr>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 text-neutral-700">string</td>
                  <td className="py-1.5 text-neutral-700">&quot;member&quot;</td>
                </tr>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 text-neutral-700">number</td>
                  <td className="py-1.5 text-neutral-700">34</td>
                </tr>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 text-neutral-700">boolean</td>
                  <td className="py-1.5 text-neutral-700">true</td>
                </tr>
                <tr className="border-t border-neutral-200">
                  <td className="py-1.5 pr-3 text-neutral-700">null</td>
                  <td className="py-1.5 text-neutral-700">null</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-base text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {JSON_EXAMPLE}
        </pre>
      ),
    },
    {
      section: "1. The Pipeline",
      title: "Schema vs. Content: Two Separate Jobs",
      body: (
        <p>
          The schema fixes each field&rsquo;s type or allowed values; the model still supplies
          the actual value.
        </p>
      ),
      visual: (
        <div className="overflow-x-auto">
          <table className="w-full text-base border-collapse">
            <thead>
              <tr className="text-left text-sm text-neutral-500">
                <th className="pb-1.5 pr-3 font-medium">Field</th>
                <th className="pb-1.5 pr-3 font-medium text-green-700">Schema says</th>
                <th className="pb-1.5 font-medium text-cyan-700">Model supplies</th>
              </tr>
            </thead>
            <tbody className="font-mono text-sm">
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-700">name</td>
                <td className="py-1.5 pr-3 text-neutral-500">string</td>
                <td className="py-1.5 text-neutral-800">&quot;Alex Rivera&quot;</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-700">age</td>
                <td className="py-1.5 pr-3 text-neutral-500">integer</td>
                <td className="py-1.5 text-neutral-800">34</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-700">role</td>
                <td className="py-1.5 pr-3 text-neutral-500">enum: admin/member/guest</td>
                <td className="py-1.5 text-neutral-800">&quot;member&quot;</td>
              </tr>
              <tr className="border-t border-neutral-200">
                <td className="py-1.5 pr-3 text-neutral-700">active</td>
                <td className="py-1.5 pr-3 text-neutral-500">boolean</td>
                <td className="py-1.5 text-neutral-800">true</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    // -------------------------- 2. Writing a Schema --------------------------
    {
      section: "2. Writing a Schema",
      title: "Types and Required Fields",
      body: (
        <p>
          A schema lists each field&rsquo;s <code className="font-mono text-base">type</code> —
          string, integer, boolean, object, array — and a{" "}
          <code className="font-mono text-base">required</code> list naming which fields must be
          present. Anything not listed as required is optional.
        </p>
      ),
      visual: (
        <pre className="whitespace-pre-wrap text-base text-neutral-700 bg-white border border-neutral-200 rounded-md p-3 font-mono">
          {SCHEMA_EXCERPT}
        </pre>
      ),
    },
    {
      section: "2. Writing a Schema",
      title: "Enums: Locking a Field to Exact Values",
      body: (
        <p>
          An <code className="font-mono text-base">enum</code> restricts a field to one of a fixed
          set of exact values — here, <code className="font-mono text-base">role</code> can only be{" "}
          <code className="font-mono text-base">admin</code>, <code className="font-mono text-base">member</code>,
          or <code className="font-mono text-base">guest</code>. Nothing else counts as valid, no
          matter how reasonable it sounds.
        </p>
      ),
      visual: <RoleChips selected="member" />,
    },
    {
      section: "2. Writing a Schema",
      title: "Try it yourself: pick a role",
      body: <p>Only three values are valid here. Pick one and watch the field update.</p>,
      controls: (
        <div className="flex gap-2">
          {(["admin", "member", "guest"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} className={toggleBtn(role === r)}>
              {r}
            </button>
          ))}
        </div>
      ),
      resetAction: resetRole,
      visual: <RoleChips selected={role} />,
    },
    // -------------------------- 3. Validation --------------------------
    {
      section: "3. Validation",
      title: "Validation: Checking Output Against the Schema",
      body: (
        <p>
          Validation is the step that walks the schema and the generated output side by side and
          reports exactly which field, if any, doesn&rsquo;t match — wrong type, missing required
          field, or a value outside an enum.
        </p>
      ),
      visual: <StructuredOutputFlowDiagram highlight={["output", "validation"]} />,
    },
    {
      section: "3. Validation",
      title: "Try it yourself: valid vs. broken output",
      body: (
        <p>
          Same schema — one output matches it, the other has a{" "}
          <code className="font-mono text-base">role</code> field that&rsquo;s the wrong type
          entirely.
        </p>
      ),
      controls: (
        <div className="flex gap-2">
          {(["valid", "broken"] as const).map((v) => (
            <button key={v} onClick={() => setOutputOn(v)} className={toggleBtn(outputOn === v)}>
              {v}
            </button>
          ))}
        </div>
      ),
      resetAction: resetOutput,
      visual: (
        <div className="space-y-2">
          <pre
            className={`whitespace-pre-wrap text-sm rounded-md p-3 font-mono border ${
              outputOn === "valid" ? "text-neutral-700 bg-white border-neutral-200" : "text-red-800 bg-red-50 border-red-300"
            }`}
          >
            {OUTPUT_EXAMPLE[outputOn]}
          </pre>
          <div
            className={`text-sm font-medium rounded-md px-2 py-1 inline-block ${
              outputOn === "valid"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                : "bg-red-50 text-red-700 border border-red-300"
            }`}
          >
            {outputOn === "valid" ? "✓ Valid against schema" : "✗ role: {'unexpected': 'wrong-shape'} is not of type 'string'"}
          </div>
        </div>
      ),
    },
    // -------------------------- 4. Constrained Decoding --------------------------
    {
      section: "4. Constrained Decoding",
      title: "The Gap: Checking Only After Generation",
      body: (
        <p>
          The pipeline so far checks output <em>after</em> the model has already generated it —
          which means an invalid response is still possible to produce, just caught late. Nothing
          stops the model from picking &ldquo;manager&rdquo; for a field whose schema only allows
          admin, member, or guest.
        </p>
      ),
      visual: <ConstrainedDecodingDiagram mode="checked" />,
    },
    {
      section: "4. Constrained Decoding",
      title: "Constrained Decoding: Making Invalid Tokens Impossible",
      body: (
        <p>
          <Term id="constrained-decoding">Constrained decoding</Term> restricts which tokens the
          model is allowed to produce at each step, so schema-invalid output can&rsquo;t be
          generated in the first place — not just caught afterward. Real 2026 APIs use this: OpenAI&rsquo;s
          strict JSON Schema mode, Anthropic&rsquo;s tool-use-based structured output, and
          Gemini&rsquo;s structured output all work this way.
        </p>
      ),
      visual: <ConstrainedDecodingDiagram mode="blocked" />,
    },
    {
      section: "4. Constrained Decoding",
      title: "How It Actually Works: Grammars, Not Prompts",
      body: (
        <p>
          Not by adding an instruction like &ldquo;don&rsquo;t say manager&rdquo; to the prompt —
          constrained decoding happens at the decoding level, below the prompt entirely. The
          schema is compiled into a grammar: a set of rules for which tokens are legal next,
          given where generation currently is in the JSON structure. At every single token, the
          API checks that grammar and forces the logit (the raw generation score) of every
          disallowed token to zero, before softmax turns scores into probabilities and one gets
          sampled. The model never gets a chance to pick &ldquo;manager&rdquo; — it was never a
          candidate to begin with.
        </p>
      ),
      visual: <ConstrainedDecodingDiagram mode="blocked" />,
    },
    {
      section: "4. Constrained Decoding",
      title: "Try it yourself: checked vs. blocked",
      body: (
        <p>
          Same next-token choice for the <code className="font-mono text-base">role</code> field —
          toggle between generation checking nothing and generation blocking invalid candidates
          outright.
        </p>
      ),
      controls: (
        <div className="flex gap-2">
          {(["checked", "blocked"] as const).map((m) => (
            <button key={m} onClick={() => setDecodingMode(m)} className={toggleBtn(decodingMode === m)}>
              {m}
            </button>
          ))}
        </div>
      ),
      resetAction: resetDecodingMode,
      visual: <ConstrainedDecodingDiagram mode={decodingMode} />,
    },
    // ---------------------------- 5. Wrap-up ------------------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Free-form text alone isn&rsquo;t reliable enough for code that needs a fixed shape.</li>
            <li>A <Term id="json-schema">JSON Schema</Term> specifies types, required fields, and enums for the output.</li>
            <li>The schema fixes the shape; the model still supplies the actual values.</li>
            <li>Validation checks generated output against the schema after the fact.</li>
            <li><Term id="constrained-decoding">Constrained decoding</Term> blocks schema-invalid tokens during generation itself, making invalid output structurally impossible rather than merely caught.</li>
          </ul>
        </div>
      ),
      visual: <StructuredOutputFlowDiagram />,
    },
    {
      section: "5. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything above is now unlocked below, talking to the real backend: edit the schema,
          generate output, and watch validation catch it when you deliberately break it.
          <br />
          Or,{" "}
          <Link href="/genai/rag" className={chapterLinkBtn}>
            proceed to RAG →
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
