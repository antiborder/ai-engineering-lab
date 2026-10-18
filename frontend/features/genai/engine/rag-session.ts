import { mockComplete, newRequestId } from "@/lib/mock-provider";
import { chunkDocument, rerank, retrieve, TfidfIndex, type Document, type RetrievedChunk } from "./rag";
import { DEMO_DOCUMENTS } from "./rag-corpus";

const RERANK_POOL_MULTIPLIER = 3;
const STORAGE_KEY = "ai-playground:rag-documents";

export interface QueryResult {
  retrieved: RetrievedChunk[];
  context: string;
  answer: string;
  model: string;
  latency_ms: number;
  estimated_cost: number;
}

export interface QueryParams {
  query: string;
  chunk_size: number;
  overlap: number;
  top_k: number;
  similarity_threshold: number;
  use_reranking: boolean;
  model: string;
}

function demoDocuments(): Document[] {
  return DEMO_DOCUMENTS.map(([title, text]) => ({ id: newRequestId(), title, text }));
}

/** Holds the document corpus the RAG lab (and the search tool) operates
 * on. One instance per browser tab, so every visitor gets their own
 * corpus. The corpus is mirrored to localStorage so documents a visitor
 * adds survive a reload; storage can be unavailable (private windows,
 * blocked site data), in which case it simply lives in memory. */
export class RagSession {
  private documents: Document[];

  constructor() {
    this.documents = this.load() ?? demoDocuments();
  }

  private load(): Document[] | null {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Document[]) : null;
    } catch {
      return null;
    }
  }

  private save(): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(this.documents));
    } catch {
      // storage unavailable — keep the in-memory copy only
    }
  }

  listDocuments(): Document[] {
    return this.documents;
  }

  addDocument(title: string, text: string): Document {
    const doc = { id: newRequestId(), title, text };
    this.documents = [...this.documents, doc];
    this.save();
    return doc;
  }

  removeDocument(docId: string): void {
    this.documents = this.documents.filter((d) => d.id !== docId);
    this.save();
  }

  resetToDemo(): void {
    this.documents = demoDocuments();
    this.save();
  }

  async query(params: QueryParams): Promise<QueryResult> {
    const chunks = this.documents.flatMap((doc) => chunkDocument(doc, params.chunk_size, params.overlap));
    const index = new TfidfIndex(chunks);

    const poolSize = params.use_reranking ? params.top_k * RERANK_POOL_MULTIPLIER : params.top_k;
    const pool = retrieve(index, params.query, poolSize, params.similarity_threshold);
    const results = (params.use_reranking ? rerank(params.query, pool) : pool).slice(0, params.top_k);

    const context = results.map((r) => `[${r.chunk.doc_title} #${r.chunk.index}] ${r.chunk.text}`).join("\n\n");
    const prompt =
      `Context:\n${context}\n\nQuestion: ${params.query}\n\n` +
      "Answer the question using only the context above.";
    const completion = await mockComplete(params.model, prompt, "You are a helpful RAG assistant.");

    return {
      retrieved: results,
      context,
      answer: completion.text,
      model: completion.model,
      latency_ms: completion.latency_ms,
      estimated_cost: completion.estimated_cost,
    };
  }
}

let session: RagSession | null = null;

export function getRagSession(): RagSession {
  session ??= new RagSession();
  return session;
}
