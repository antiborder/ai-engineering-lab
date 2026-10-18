const WORD_RE = /[a-z0-9']+/g;
const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+/;

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(WORD_RE) ?? [];
}

/** Naive regex sentence splitter: break after ./!/? followed by
 * whitespace. Doesn't handle abbreviations, decimals, etc. correctly, but
 * this app's demo corpus doesn't contain any — same "good enough for
 * teaching, not production-grade" spirit as tokenize() above. */
export function splitSentences(text: string): string[] {
  return text
    .trim()
    .split(SENTENCE_SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface Document {
  id: string;
  title: string;
  text: string;
}

export interface Chunk {
  doc_id: string;
  doc_title: string;
  index: number;
  text: string;
}

/** Sentence-count chunking with configurable size/overlap (spec section
 * 13) — chunkSize/overlap count whole sentences, not words, matching how
 * real-world chunkers usually respect sentence boundaries instead of
 * cutting mid-sentence. Overlap is clamped below chunkSize so the
 * sliding window always moves forward — an overlap >= chunkSize would
 * loop forever. */
export function chunkDocument(doc: Document, chunkSize: number, overlap: number): Chunk[] {
  const sentences = splitSentences(doc.text);
  const size = Math.max(1, chunkSize);
  const clampedOverlap = Math.max(0, Math.min(overlap, size - 1));
  const step = size - clampedOverlap;

  const chunks: Chunk[] = [];
  for (let i = 0, idx = 0; i < sentences.length; i += step, idx++) {
    const piece = sentences.slice(i, i + size);
    chunks.push({ doc_id: doc.id, doc_title: doc.title, index: idx, text: piece.join(" ") });
    if (i + size >= sentences.length) break;
  }
  return chunks;
}

function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

/** A real (if simple) TF-IDF vector space model — bag-of-words term
 * frequency weighted by inverse document frequency, L2-normalized so dot
 * product equals cosine similarity. No embedding API calls needed, and
 * retrieval genuinely reflects word overlap between query and chunk,
 * unlike a fabricated similarity score. */
export class TfidfIndex {
  readonly chunks: Chunk[];
  private readonly vocabIndex: Map<string, number>;
  private readonly idf: number[];
  private readonly matrix: number[][];

  constructor(chunks: Chunk[]) {
    this.chunks = chunks;
    const tokenLists = chunks.map((c) => tokenize(c.text));
    const vocab = [...new Set(tokenLists.flat())].sort();
    this.vocabIndex = new Map(vocab.map((tok, i) => [tok, i]));

    const nDocs = Math.max(1, chunks.length);
    const tf = tokenLists.map((toks) => {
      const row = new Array<number>(vocab.length).fill(0);
      for (const tok of toks) row[this.vocabIndex.get(tok)!] += 1;
      return row;
    });

    this.idf = vocab.map((_, col) => {
      const docFreq = tf.reduce((n, row) => n + (row[col] > 0 ? 1 : 0), 0);
      return Math.log((nDocs + 1) / (docFreq + 1)) + 1;
    });
    this.matrix = tf.map((row) => l2Normalize(row.map((v, col) => v * this.idf[col])));
  }

  embedQuery(query: string): number[] {
    const vec = new Array<number>(this.vocabIndex.size).fill(0);
    for (const tok of tokenize(query)) {
      const col = this.vocabIndex.get(tok);
      if (col !== undefined) vec[col] += 1;
    }
    return l2Normalize(vec.map((v, col) => v * this.idf[col]));
  }

  scores(query: string): number[] {
    const q = this.embedQuery(query);
    return this.matrix.map((row) => row.reduce((sum, v, col) => sum + v * q[col], 0));
  }
}

export interface RetrievedChunk {
  chunk: Chunk;
  score: number;
  rerank_score: number | null;
}

export function retrieve(
  index: TfidfIndex,
  query: string,
  poolSize: number,
  similarityThreshold: number
): RetrievedChunk[] {
  if (index.chunks.length === 0) return [];
  const scores = index.scores(query);
  const ranked = scores.map((_, i) => i).sort((a, b) => scores[b] - scores[a]);
  const results: RetrievedChunk[] = [];
  for (const i of ranked) {
    if (scores[i] < similarityThreshold) continue;
    results.push({ chunk: index.chunks[i], score: scores[i], rerank_score: null });
    if (results.length >= poolSize) break;
  }
  return results;
}

/** A deliberately simple mock reranker: blends the vector similarity
 * score with exact query-word overlap. Real rerankers use a cross-encoder
 * that jointly scores (query, chunk) pairs; this is a stand-in that can
 * still visibly reorder results, which is the pedagogical point (spec
 * section 13: "allow manipulation of ... reranking"). */
export function rerank(query: string, results: RetrievedChunk[]): RetrievedChunk[] {
  const queryTokens = new Set(tokenize(query));
  return results
    .map((r) => {
      const chunkTokens = new Set(tokenize(r.chunk.text));
      const shared = [...queryTokens].filter((t) => chunkTokens.has(t)).length;
      const overlap = shared / Math.max(1, queryTokens.size);
      return { ...r, rerank_score: 0.5 * r.score + 0.5 * overlap };
    })
    .sort((a, b) => (b.rerank_score ?? 0) - (a.rerank_score ?? 0));
}
