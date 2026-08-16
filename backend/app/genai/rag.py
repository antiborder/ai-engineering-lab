import re
from dataclasses import dataclass

import numpy as np

_WORD_RE = re.compile(r"[a-z0-9']+")


def tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


@dataclass
class Document:
    id: str
    title: str
    text: str


@dataclass
class Chunk:
    doc_id: str
    doc_title: str
    index: int
    text: str


def chunk_document(doc: Document, chunk_size: int, overlap: int) -> list[Chunk]:
    """Word-count chunking with configurable size/overlap (spec section 13).
    Overlap is clamped below chunk_size so the sliding window always moves
    forward — an overlap >= chunk_size would loop forever."""
    words = doc.text.split()
    chunk_size = max(1, chunk_size)
    overlap = max(0, min(overlap, chunk_size - 1))
    step = chunk_size - overlap

    chunks: list[Chunk] = []
    i = 0
    idx = 0
    while i < len(words):
        piece = words[i : i + chunk_size]
        if not piece:
            break
        chunks.append(Chunk(doc_id=doc.id, doc_title=doc.title, index=idx, text=" ".join(piece)))
        idx += 1
        if i + chunk_size >= len(words):
            break
        i += step
    return chunks


class TfidfIndex:
    """A real (if simple) TF-IDF vector space model — bag-of-words term
    frequency weighted by inverse document frequency, L2-normalized so dot
    product equals cosine similarity. No embedding API calls needed for
    Phase 1's mock-provider mode, and retrieval genuinely reflects word
    overlap between query and chunk, unlike a fabricated similarity score.
    """

    def __init__(self, chunks: list[Chunk]):
        self.chunks = chunks
        token_lists = [tokenize(c.text) for c in chunks]
        vocab = sorted({tok for toks in token_lists for tok in toks})
        self.vocab_index = {tok: i for i, tok in enumerate(vocab)}

        n_docs = max(1, len(chunks))
        tf = np.zeros((len(chunks), len(vocab)))
        for row, toks in enumerate(token_lists):
            for tok in toks:
                tf[row, self.vocab_index[tok]] += 1

        doc_freq = (tf > 0).sum(axis=0)
        self.idf = np.log((n_docs + 1) / (doc_freq + 1)) + 1
        weighted = tf * self.idf
        norms = np.linalg.norm(weighted, axis=1, keepdims=True)
        norms[norms == 0] = 1
        self.matrix = weighted / norms

    def embed_query(self, query: str) -> np.ndarray:
        vec = np.zeros(len(self.vocab_index))
        for tok in tokenize(query):
            if tok in self.vocab_index:
                vec[self.vocab_index[tok]] += 1
        vec = vec * self.idf
        norm = np.linalg.norm(vec)
        return vec / norm if norm > 0 else vec


@dataclass
class RetrievedChunk:
    chunk: Chunk
    score: float
    rerank_score: float | None = None


def retrieve(index: TfidfIndex, query: str, pool_size: int, similarity_threshold: float) -> list[RetrievedChunk]:
    if len(index.chunks) == 0:
        return []
    query_vec = index.embed_query(query)
    scores = index.matrix @ query_vec
    ranked_idx = np.argsort(-scores)
    results = []
    for i in ranked_idx:
        score = float(scores[i])
        if score < similarity_threshold:
            continue
        results.append(RetrievedChunk(chunk=index.chunks[i], score=score))
        if len(results) >= pool_size:
            break
    return results


def rerank(query: str, results: list[RetrievedChunk]) -> list[RetrievedChunk]:
    """A deliberately simple mock reranker: blends the vector similarity
    score with exact query-word overlap. Real rerankers use a cross-encoder
    that jointly scores (query, chunk) pairs; this is a stand-in that can
    still visibly reorder results, which is the pedagogical point (spec
    section 13: "allow manipulation of ... reranking")."""
    query_tokens = set(tokenize(query))
    reranked = []
    for r in results:
        chunk_tokens = set(tokenize(r.chunk.text))
        overlap = len(query_tokens & chunk_tokens) / max(1, len(query_tokens))
        rerank_score = 0.5 * r.score + 0.5 * overlap
        reranked.append(RetrievedChunk(chunk=r.chunk, score=r.score, rerank_score=rerank_score))
    reranked.sort(key=lambda r: -(r.rerank_score or 0))
    return reranked
