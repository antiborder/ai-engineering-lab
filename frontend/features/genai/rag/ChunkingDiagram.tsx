// Real sentences of the "Sourdough Bread" demo document
// (backend/app/genai/rag_corpus.py), split exactly the way
// backend/app/genai/rag.py's split_sentences() actually splits them (after
// ./!/? followed by whitespace) — not fabricated text, so the sentence
// count/overlap shown here matches what chunk_document() actually does on
// real content.
const DEMO_SENTENCES = [
  "Sourdough bread gets its rise from a wild yeast starter instead of commercial yeast.",
  "The starter is a mix of flour and water left to ferment over several days, capturing wild yeast and lactobacilli from the air and the flour itself.",
  "Feeding the starter daily with fresh flour and water keeps the yeast active.",
  "A well-fed starter should roughly double in size within four to six hours and smell pleasantly tangy.",
  "Baking sourdough requires patience: bulk fermentation can take four to twelve hours depending on room temperature, and a long cold proof in the refrigerator overnight develops more flavor and makes the dough easier to score before baking in a very hot oven, often inside a preheated Dutch oven.",
];

/** Same sliding-window chunking backend/app/genai/rag.py's chunk_document()
 * implements: a fixed-size window of sentences, advanced by (size -
 * overlap) each step. Shows the first two chunks over a real demo
 * document, color-coding every sentence by which chunk(s) it falls in, so
 * "overlap" is something you can see instead of just a number. */
export function ChunkingDiagram({ chunkSize, overlap }: { chunkSize: number; overlap: number }) {
  const size = Math.max(1, Math.min(chunkSize, DEMO_SENTENCES.length));
  const ov = Math.max(0, Math.min(overlap, size - 1));
  const step = Math.max(1, size - ov);

  const chunk1 = { start: 0, end: size };
  const chunk2Start = Math.min(step, DEMO_SENTENCES.length - 1);
  const chunk2 = { start: chunk2Start, end: Math.min(chunk2Start + size, DEMO_SENTENCES.length) };

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        {DEMO_SENTENCES.map((s, i) => {
          const inChunk1 = i >= chunk1.start && i < chunk1.end;
          const inChunk2 = i >= chunk2.start && i < chunk2.end;
          let cls = "bg-neutral-50 text-neutral-400 border-neutral-200";
          if (inChunk1 && inChunk2) cls = "bg-gradient-to-r from-cyan-50 to-purple-50 text-neutral-800 border-neutral-400";
          else if (inChunk1) cls = "bg-cyan-50 text-cyan-800 border-cyan-300";
          else if (inChunk2) cls = "bg-purple-50 text-purple-800 border-purple-300";
          return (
            <div key={i} className={`text-sm rounded-md border p-2 ${cls}`}>
              {s}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-cyan-50 border border-cyan-300 inline-block" /> chunk 1
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-purple-50 border border-purple-300 inline-block" /> chunk 2
        </span>
        {ov > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-cyan-50 to-purple-50 border border-neutral-400 inline-block" />
            overlap
          </span>
        )}
      </div>
    </div>
  );
}
