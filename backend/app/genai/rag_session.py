import uuid
from dataclasses import dataclass
from functools import lru_cache

from app.genai.rag import Document, TfidfIndex, chunk_document, rerank, retrieve
from app.genai.rag_corpus import DEMO_DOCUMENTS
from app.providers.factory import get_provider

RERANK_POOL_MULTIPLIER = 3


@dataclass
class QueryResult:
    query: str
    retrieved: list  # list[RetrievedChunk], pre-rerank pool trimmed to top_k
    reranked: bool
    context: str
    answer: str
    model: str
    latency_ms: float
    estimated_cost: float


class RagSession:
    """Holds the document corpus this local dev server's RAG lab operates
    on. Single global instance, same rationale as TinyLlmSession: Phase 1
    is single-user local dev, and the frontend presents exactly one corpus
    at a time."""

    def __init__(self):
        self.documents: list[Document] = [
            Document(id=str(uuid.uuid4()), title=title, text=text) for title, text in DEMO_DOCUMENTS
        ]

    def list_documents(self) -> list[Document]:
        return self.documents

    def add_document(self, title: str, text: str) -> Document:
        doc = Document(id=str(uuid.uuid4()), title=title, text=text)
        self.documents.append(doc)
        return doc

    def remove_document(self, doc_id: str) -> None:
        self.documents = [d for d in self.documents if d.id != doc_id]

    def reset_to_demo(self) -> None:
        self.documents = [
            Document(id=str(uuid.uuid4()), title=title, text=text) for title, text in DEMO_DOCUMENTS
        ]

    def query(
        self,
        query: str,
        chunk_size: int,
        overlap: int,
        top_k: int,
        similarity_threshold: float,
        use_reranking: bool,
        model: str,
    ) -> QueryResult:
        chunks = [c for doc in self.documents for c in chunk_document(doc, chunk_size, overlap)]
        index = TfidfIndex(chunks)

        pool_size = top_k * RERANK_POOL_MULTIPLIER if use_reranking else top_k
        pool = retrieve(index, query, pool_size, similarity_threshold)
        results = rerank(query, pool)[:top_k] if use_reranking else pool[:top_k]

        context = "\n\n".join(f"[{r.chunk.doc_title} #{r.chunk.index}] {r.chunk.text}" for r in results)
        prompt = (
            f"Context:\n{context}\n\nQuestion: {query}\n\n"
            "Answer the question using only the context above."
        )
        provider = get_provider()
        completion = provider.complete(model, prompt, system="You are a helpful RAG assistant.")

        return QueryResult(
            query=query,
            retrieved=results,
            reranked=use_reranking,
            context=context,
            answer=completion.text,
            model=completion.model,
            latency_ms=completion.latency_ms,
            estimated_cost=completion.estimated_cost,
        )


@lru_cache
def get_rag_session() -> RagSession:
    return RagSession()
