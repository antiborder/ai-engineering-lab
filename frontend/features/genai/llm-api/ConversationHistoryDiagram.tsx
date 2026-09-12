const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const GREEN = "#059669";
const NEUTRAL = "#a1a1aa";

// Illustrative per-turn sizes and pricing — not from the real (single-shot,
// no-history) mock API, since backend/app/api/genai.py's CompletionRequest
// has no `messages` field yet. Mirrors backend/app/providers/mock.py's
// mock-small pricing so the numbers stay consistent with the rest of this
// Chapter's cost math. Cache discount (10% of normal input price) matches
// the rough ballpark real providers (Anthropic, OpenAI, Gemini) use.
export const PER_TURN_USER_TOKENS = 15;
export const PER_TURN_ASSISTANT_TOKENS = 40;
export const CACHE_DISCOUNT = 0.1;
const IN_PRICE_PER_1K = 0.0001;
const OUT_PRICE_PER_1K = 0.0002;

export function historyTokens(turn: number): number {
  return (turn - 1) * (PER_TURN_USER_TOKENS + PER_TURN_ASSISTANT_TOKENS);
}
export function turnInputTokens(turn: number): number {
  return historyTokens(turn) + PER_TURN_USER_TOKENS;
}
export function turnCost(turn: number, cached: boolean): number {
  const history = historyTokens(turn);
  const inPrice = cached ? IN_PRICE_PER_1K * CACHE_DISCOUNT : IN_PRICE_PER_1K;
  const cachedCost = cached ? (history / 1000) * inPrice : (history / 1000) * IN_PRICE_PER_1K;
  const freshCost = (PER_TURN_USER_TOKENS / 1000) * IN_PRICE_PER_1K;
  const outCost = (PER_TURN_ASSISTANT_TOKENS / 1000) * OUT_PRICE_PER_1K;
  return cachedCost + freshCost + outCost;
}

/** Shows what actually gets sent as "input" on turn N of a chat: every
 * prior turn's user+assistant messages (the model has no memory of its
 * own — the app resends them every time), plus this turn's one new
 * message. `cached` recolors the resent history to show a real provider's
 * fix: bill the repeated prefix at a fraction of normal price instead of
 * full price every single turn. Bar segment widths are proportional to
 * token count, scaled against a 5-turn conversation so growth is visible
 * turn to turn. */
export function ConversationHistoryDiagram({ turn, cached = false }: { turn: number; cached?: boolean }) {
  const width = 340;
  const barY = 50;
  const barH = 34;
  const barX = 10;
  const barW = width - 2 * barX;
  const maxTokens = turnInputTokens(5);
  const scale = barW / maxTokens;

  const segments: { w: number; isNew: boolean }[] = [];
  for (let t = 1; t < turn; t++) {
    segments.push({ w: (PER_TURN_USER_TOKENS + PER_TURN_ASSISTANT_TOKENS) * scale, isNew: false });
  }
  segments.push({ w: PER_TURN_USER_TOKENS * scale, isNew: true });

  let x = barX;
  const rects = segments.map((s, i) => {
    const rect = (
      <rect
        key={i}
        x={x}
        y={barY}
        width={Math.max(s.w - 1.5, 1)}
        height={barH}
        rx={4}
        fill={s.isNew ? "rgba(8,145,178,0.18)" : cached ? "rgba(5,150,105,0.15)" : "rgba(124,58,237,0.15)"}
        stroke={s.isNew ? CYAN : cached ? GREEN : PURPLE}
        strokeWidth={1.5}
        strokeDasharray={!s.isNew && cached ? "3,2" : undefined}
      />
    );
    x += s.w;
    return rect;
  });

  const inputTokens = turnInputTokens(turn);
  const cost = turnCost(turn, cached);
  const height = 160;

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        <text x={barX} y={barY - 10} fontSize={14} fill="#525252">
          Turn {turn} input, resent in full every call:
        </text>
        {rects}
        <text x={barX} y={barY + barH + 16} fontSize={14} fill={NEUTRAL}>
          {turn > 1 ? `${cached ? "cached" : "resent, full price"} history` : "no history yet"}
        </text>
        <text x={barX + barW} y={barY + barH + 16} fontSize={14} textAnchor="end" fill={CYAN}>
          new message
        </text>

        <text x={barX} y={barY + barH + 42} fontSize={14} fontWeight={700} fill="#3f3f46">
          {inputTokens} input tokens
        </text>
        <text x={barX} y={barY + barH + 58} fontSize={14} fill="#3f3f46">
          ≈ ${cost.toFixed(6)} this turn ({cached ? "cached" : "no caching"})
        </text>
      </svg>
    </div>
  );
}
