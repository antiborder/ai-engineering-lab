/** Matches one "Speaker: "quote"" line. Captures the speaker and the
 * quoted line separately so each can be styled — see StoryLine below. */
const DIALOGUE_LINE = /^([^":]+):\s*"(.+)"$/;

const SPEAKER_COLOR: Record<string, string> = {
  Maya: "text-cyan-700",
  Priya: "text-purple-700",
};

/** A lightweight, non-illustrated "scene" for a Chapter's story half: just
 * dialogue, no picture-book art. Each `Speaker: "quote"` line (one per
 * `\n`) renders as its own small card so it reads as a conversation, not
 * more paragraphs; a line with no speaker renders as plain italic scene-
 * setting text. Dialogue carries the story beat (a question, a surprise, a
 * disagreement) — the precise technical answer stays in the Step's body
 * below, not in the quotes, so lines stay natural instead of reading like
 * a textbook definition with quotation marks glued on. */
export function StoryLine({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        const match = line.match(DIALOGUE_LINE);
        if (!match) {
          return (
            <p key={i} className="text-sm text-neutral-800 italic">
              {line}
            </p>
          );
        }
        const [, speaker, quote] = match;
        const color = SPEAKER_COLOR[speaker.trim()] ?? "text-neutral-700";
        return (
          <div key={i} className="bg-white border border-neutral-200 rounded-md px-3 py-2 text-sm w-fit max-w-full">
            <span className={`font-semibold ${color}`}>{speaker}:</span>{" "}
            <span className="text-neutral-800">&ldquo;{quote}&rdquo;</span>
          </div>
        );
      })}
    </div>
  );
}
