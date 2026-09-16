/** Matches one "Speaker: "quote"" line. Captures the speaker and the
 * quoted line separately so each can be styled — see StoryLine below. */
const DIALOGUE_LINE = /^([^":]+):\s*"(.+)"$/;

const SPEAKER_COLOR: Record<string, string> = {
  Chloe: "text-cyan-700",
  Maya: "text-purple-700",
};

/** Inline "same-bubble line break" marker: a literal backslash-n (two
 * characters — write `\\n` in a story string's source) inside a quote,
 * as opposed to a real `\n` between story lines. A real `\n` still starts
 * a whole new turn/bubble; this marker instead breaks one turn's own
 * quote into multiple stacked lines inside a single bubble — the only way
 * to put a genuine multi-line bulleted list inside one speaker's box,
 * since the top-level split on real `\n` would otherwise cut the quote in
 * half before its closing `"` and fail DIALOGUE_LINE entirely. */
const SAME_BUBBLE_BREAK = "\\n";

/** A lightweight, non-illustrated "scene" for a Chapter's story half: just
 * dialogue, no picture-book art. Each `Speaker: "quote"` line (one per
 * `\n`) renders as its own small card so it reads as a conversation, not
 * more paragraphs; a line with no speaker renders as plain italic scene-
 * setting text. Dialogue carries the story beat (a question, a surprise, a
 * disagreement) — the precise technical answer stays in the Step's body
 * below, not in the quotes, so lines stay natural instead of reading like
 * a textbook definition with quotation marks glued on. A quote containing
 * `SAME_BUBBLE_BREAK` renders as multiple stacked lines inside that one
 * bubble instead of a single sentence — use this (sparingly) when a
 * single turn genuinely needs a short bulleted list of its own. */
export function StoryLine({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        const match = line.match(DIALOGUE_LINE);
        if (!match) {
          return (
            <p key={i} className="text-base text-neutral-800 italic">
              {line}
            </p>
          );
        }
        const [, speaker, quote] = match;
        const color = SPEAKER_COLOR[speaker.trim()] ?? "text-neutral-700";
        const subLines = quote.split(SAME_BUBBLE_BREAK);
        return (
          <div key={i} className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-base w-fit max-w-full">
            <span className={`font-semibold ${color}`}>{speaker}:</span>{" "}
            {subLines.length === 1 ? (
              <span className="text-neutral-800">&ldquo;{quote}&rdquo;</span>
            ) : (
              <span className="text-neutral-800 inline-block align-top">
                {subLines.map((sub, j) => (
                  <span key={j} className="block">
                    {j === 0 ? "“" : ""}
                    {sub}
                    {j === subLines.length - 1 ? "”" : ""}
                  </span>
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
