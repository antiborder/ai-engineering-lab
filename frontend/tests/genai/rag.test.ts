import { describe, expect, it } from "vitest";
import { chunkDocument, rerank, retrieve, splitSentences, TfidfIndex, type Chunk } from "@/features/genai/engine/rag";
import { RagSession } from "@/features/genai/engine/rag-session";

const tenSentences = Array.from({ length: 10 }, (_, i) => `Sentence number ${i}.`).join(" ");

describe("chunkDocument", () => {
  it("respects size and overlap", () => {
    const chunks = chunkDocument({ id: "1", title: "t", text: tenSentences }, 3, 1);
    expect(chunks.every((c) => splitSentences(c.text).length <= 3)).toBe(true);
    // step = chunkSize - overlap = 2, so consecutive chunks share 1 sentence
    expect(splitSentences(chunks[0].text).slice(-1)).toEqual(splitSentences(chunks[1].text).slice(0, 1));
  });

  it("clamps overlap >= chunkSize instead of looping forever", () => {
    const chunks = chunkDocument({ id: "1", title: "t", text: tenSentences }, 3, 10);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.length).toBeLessThan(100);
  });
});

describe("TF-IDF retrieval", () => {
  it("ranks the topically relevant chunk highest", () => {
    const docs = [
      { id: "a", title: "Bread", text: "Sourdough bread needs a wild yeast starter and flour." },
      { id: "b", title: "Space", text: "Rockets use liquid oxygen and kerosene as propellant." },
      { id: "c", title: "Cats", text: "Cats hunt using stalking and pouncing behavior." },
    ];
    const index = new TfidfIndex(docs.flatMap((d) => chunkDocument(d, 50, 0)));
    expect(retrieve(index, "sourdough starter yeast", 3, 0)[0].chunk.doc_title).toBe("Bread");
  });

  it("produces cosine scores between 0 and 1", () => {
    const index = new TfidfIndex(chunkDocument({ id: "a", title: "A", text: "cats hunt mice." }, 1, 0));
    const [r] = retrieve(index, "cats hunt mice", 1, 0);
    expect(r.score).toBeCloseTo(1, 6);
  });
});

describe("rerank", () => {
  it("adds a rerank score", () => {
    const chunks: Chunk[] = [
      { doc_id: "a", doc_title: "A", index: 0, text: "cats hunt mice at night" },
      { doc_id: "b", doc_title: "B", index: 0, text: "dogs bark loudly outside" },
    ];
    const reranked = rerank("cats hunt", retrieve(new TfidfIndex(chunks), "cats hunt", 2, 0));
    expect(reranked[0].chunk.doc_title).toBe("A");
    expect(reranked[0].rerank_score).not.toBeNull();
  });
});

describe("RagSession", () => {
  it("answers from the relevant context", async () => {
    const result = await new RagSession().query({
      query: "how do I brew coffee",
      chunk_size: 60,
      overlap: 10,
      top_k: 2,
      similarity_threshold: 0,
      use_reranking: false,
      model: "mock-small",
    });
    expect(result.retrieved).toHaveLength(2);
    expect(result.retrieved[0].chunk.doc_title).toBe("Coffee Brewing");
    expect(result.answer).toBeTruthy();
  });

  it("adds and removes documents", () => {
    const session = new RagSession();
    const initial = session.listDocuments().length;
    const doc = session.addDocument("Custom", "Some custom text about kayaking.");
    expect(session.listDocuments()).toHaveLength(initial + 1);
    session.removeDocument(doc.id);
    expect(session.listDocuments()).toHaveLength(initial);
  });
});
