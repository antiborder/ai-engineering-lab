from app.genai.rag import Chunk, Document, TfidfIndex, chunk_document, rerank, retrieve
from app.genai.rag_session import RagSession


def test_chunk_document_respects_size_and_overlap():
    doc = Document(id="1", title="t", text=" ".join(f"word{i}" for i in range(20)))
    chunks = chunk_document(doc, chunk_size=5, overlap=2)
    assert all(len(c.text.split()) <= 5 for c in chunks)
    # step = chunk_size - overlap = 3, so consecutive chunks share 2 words
    assert chunks[0].text.split()[-2:] == chunks[1].text.split()[:2]


def test_chunk_document_handles_overlap_gte_chunk_size_without_looping():
    doc = Document(id="1", title="t", text=" ".join(f"word{i}" for i in range(30)))
    chunks = chunk_document(doc, chunk_size=5, overlap=10)  # invalid overlap, must be clamped
    assert len(chunks) > 0
    assert len(chunks) < 100  # would hang / explode if step could be <= 0


def test_tfidf_retrieval_ranks_topically_relevant_chunk_highest():
    docs = [
        Document(id="a", title="Bread", text="Sourdough bread needs a wild yeast starter and flour."),
        Document(id="b", title="Space", text="Rockets use liquid oxygen and kerosene as propellant."),
        Document(id="c", title="Cats", text="Cats hunt using stalking and pouncing behavior."),
    ]
    chunks = [c for doc in docs for c in chunk_document(doc, chunk_size=50, overlap=0)]
    index = TfidfIndex(chunks)

    results = retrieve(index, "sourdough starter yeast", pool_size=3, similarity_threshold=0.0)
    assert results[0].chunk.doc_title == "Bread"


def test_rerank_can_change_order():
    chunks = [
        Chunk(doc_id="a", doc_title="A", index=0, text="cats hunt mice at night"),
        Chunk(doc_id="b", doc_title="B", index=0, text="dogs bark loudly outside"),
    ]
    index = TfidfIndex(chunks)
    pool = retrieve(index, "cats hunt", pool_size=2, similarity_threshold=0.0)
    reranked = rerank("cats hunt", pool)
    assert reranked[0].chunk.doc_title == "A"
    assert reranked[0].rerank_score is not None


def test_rag_session_query_answers_from_relevant_context():
    session = RagSession()
    result = session.query(
        query="how do I brew coffee",
        chunk_size=60,
        overlap=10,
        top_k=2,
        similarity_threshold=0.0,
        use_reranking=False,
        model="mock-small",
    )
    assert len(result.retrieved) == 2
    assert result.retrieved[0].chunk.doc_title == "Coffee Brewing"
    assert result.answer  # mock provider always returns non-empty text


def test_rag_session_add_and_remove_document():
    session = RagSession()
    initial_count = len(session.list_documents())
    doc = session.add_document("Custom", "Some custom text about kayaking.")
    assert len(session.list_documents()) == initial_count + 1
    session.remove_document(doc.id)
    assert len(session.list_documents()) == initial_count


def test_api_rag_query_roundtrip(client):
    response = client.post(
        "/api/genai/rag/query",
        json={"query": "how does sourdough rise", "top_k": 2},
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["retrieved"]) == 2
    assert body["retrieved"][0]["doc_title"] == "Sourdough Bread"
    assert body["answer"]
