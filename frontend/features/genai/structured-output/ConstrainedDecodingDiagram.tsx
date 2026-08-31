interface Candidate {
  token: string;
  prob: number;
  allowed: boolean;
}

// Illustrative next-token candidates for filling in a `"role"` field whose
// schema is `enum: ["admin", "member", "guest"]` — not real model logits.
const CHECKED: Candidate[] = [
  { token: "admin", prob: 0.42, allowed: true },
  { token: "member", prob: 0.31, allowed: true },
  { token: "guest", prob: 0.18, allowed: true },
  { token: "manager", prob: 0.06, allowed: false },
  { token: "supervisor", prob: 0.03, allowed: false },
];

// Constrained decoding: disallowed candidates get zero probability before
// one is even picked, and the allowed candidates' probabilities are
// renormalized to still sum to 1 — schematic, not a real logits computation.
const ALLOWED_TOTAL = CHECKED.filter((c) => c.allowed).reduce((s, c) => s + c.prob, 0);
const BLOCKED: Candidate[] = CHECKED.map((c) => ({ ...c, prob: c.allowed ? c.prob / ALLOWED_TOTAL : 0 }));

/** Same next-token-probability-bars idea as NextTokenBars (Fundamentals) and
 * TemperatureDemo (Tiny LLM), reused here to contrast two ways of enforcing
 * a schema: `mode="checked"` shows every candidate as pickable (an
 * out-of-enum value is still possible, just caught by validation
 * afterward); `mode="blocked"` shows disallowed candidates zeroed out
 * before generation, so they were never pickable at all. */
export function ConstrainedDecodingDiagram({ mode }: { mode: "checked" | "blocked" }) {
  const data = mode === "checked" ? CHECKED : BLOCKED;
  const maxProb = Math.max(...data.map((d) => d.prob), 0.001);

  return (
    <div className="space-y-2">
      <div className="text-xs text-neutral-500">
        Next token for <code className="font-mono text-neutral-700">&quot;role&quot;</code> — schema says{" "}
        <code className="font-mono text-neutral-700">enum: [admin, member, guest]</code>
      </div>
      <div className="space-y-1.5">
        {data.map((c) => {
          const blocked = mode === "blocked" && !c.allowed;
          return (
            <div key={c.token} className="flex items-center gap-2 text-xs">
              <span
                className={`w-24 shrink-0 font-mono truncate ${blocked ? "text-neutral-400 line-through" : "text-neutral-700"}`}
              >
                {c.token}
              </span>
              <div className="flex-1 h-4 bg-neutral-200 rounded overflow-hidden">
                <div
                  className={`h-full ${c.allowed ? "bg-cyan-600" : blocked ? "bg-neutral-300" : "bg-red-400"}`}
                  style={{ width: `${(c.prob / maxProb) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right text-neutral-500 tabular-nums">
                {blocked ? "blocked" : `${(c.prob * 100).toFixed(0)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
