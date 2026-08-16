from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.genai.agent import run_agent
from app.genai.rag_session import RagSession, get_rag_session
from app.genai.structured_output import generate_structured_output, validate_against_schema
from app.genai.tool_calling import run_tool_calling
from app.providers.factory import get_provider

router = APIRouter(prefix="/genai", tags=["genai"])

AVAILABLE_MODELS = ["mock-small", "mock-large"]


class CompletionRequest(BaseModel):
    model: str = "mock-small"
    system: str | None = None
    prompt: str = Field(min_length=1, max_length=4000)


class CompletionResponse(BaseModel):
    text: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    estimated_cost: float
    request_id: str
    timestamp: datetime


@router.get("/models")
def list_models() -> list[str]:
    return AVAILABLE_MODELS


@router.post("/complete", response_model=CompletionResponse)
def complete(data: CompletionRequest) -> CompletionResponse:
    provider = get_provider()
    result = provider.complete(data.model, data.prompt, data.system)
    return CompletionResponse(
        text=result.text,
        model=result.model,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        latency_ms=result.latency_ms,
        estimated_cost=result.estimated_cost,
        request_id=result.request_id,
        timestamp=result.timestamp,
    )


class StructuredOutputRequest(BaseModel):
    json_schema: dict[str, Any]
    break_schema: bool = False
    seed: int = 1


class StructuredOutputResponse(BaseModel):
    output: dict[str, Any]
    valid: bool
    errors: list[str]


@router.post("/structured-output/generate", response_model=StructuredOutputResponse)
def generate_structured(data: StructuredOutputRequest) -> StructuredOutputResponse:
    output = generate_structured_output(data.json_schema, data.seed, data.break_schema)
    errors = validate_against_schema(output, data.json_schema)
    return StructuredOutputResponse(output=output, valid=len(errors) == 0, errors=errors)


class DocumentResponse(BaseModel):
    id: str
    title: str
    text: str


class AddDocumentRequest(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    text: str = Field(min_length=1, max_length=8000)


@router.get("/rag/documents", response_model=list[DocumentResponse])
def list_documents(session: RagSession = Depends(get_rag_session)) -> list[DocumentResponse]:
    return [DocumentResponse(id=d.id, title=d.title, text=d.text) for d in session.list_documents()]


@router.post("/rag/documents", response_model=DocumentResponse, status_code=201)
def add_document(
    data: AddDocumentRequest, session: RagSession = Depends(get_rag_session)
) -> DocumentResponse:
    doc = session.add_document(data.title, data.text)
    return DocumentResponse(id=doc.id, title=doc.title, text=doc.text)


@router.delete("/rag/documents/{doc_id}", status_code=204)
def delete_document(doc_id: str, session: RagSession = Depends(get_rag_session)) -> None:
    session.remove_document(doc_id)


@router.post("/rag/documents/reset", response_model=list[DocumentResponse])
def reset_documents(session: RagSession = Depends(get_rag_session)) -> list[DocumentResponse]:
    session.reset_to_demo()
    return [DocumentResponse(id=d.id, title=d.title, text=d.text) for d in session.list_documents()]


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    chunk_size: int = Field(default=60, ge=10, le=300)
    overlap: int = Field(default=15, ge=0, le=200)
    top_k: int = Field(default=3, ge=1, le=10)
    similarity_threshold: float = Field(default=0.0, ge=0, le=1)
    use_reranking: bool = False
    model: str = "mock-small"


class RetrievedChunkResponse(BaseModel):
    doc_title: str
    chunk_index: int
    text: str
    score: float
    rerank_score: float | None


class RagQueryResponse(BaseModel):
    retrieved: list[RetrievedChunkResponse]
    context: str
    answer: str
    model: str
    latency_ms: float
    estimated_cost: float


@router.post("/rag/query", response_model=RagQueryResponse)
def rag_query(
    data: RagQueryRequest, session: RagSession = Depends(get_rag_session)
) -> RagQueryResponse:
    if len(session.list_documents()) == 0:
        raise HTTPException(status_code=400, detail="no documents in the corpus")
    result = session.query(
        query=data.query,
        chunk_size=data.chunk_size,
        overlap=data.overlap,
        top_k=data.top_k,
        similarity_threshold=data.similarity_threshold,
        use_reranking=data.use_reranking,
        model=data.model,
    )
    return RagQueryResponse(
        retrieved=[
            RetrievedChunkResponse(
                doc_title=r.chunk.doc_title,
                chunk_index=r.chunk.index,
                text=r.chunk.text,
                score=r.score,
                rerank_score=r.rerank_score,
            )
            for r in result.retrieved
        ],
        context=result.context,
        answer=result.answer,
        model=result.model,
        latency_ms=result.latency_ms,
        estimated_cost=result.estimated_cost,
    )


class ToolCallRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    model: str = "mock-small"


class ToolCallResponse(BaseModel):
    tool_name: str | None
    tool_args: dict[str, str] | None
    tool_result: str | None
    answer: str
    model: str


@router.post("/tools/call", response_model=ToolCallResponse)
def call_with_tools(
    data: ToolCallRequest, session: RagSession = Depends(get_rag_session)
) -> ToolCallResponse:
    trace = run_tool_calling(data.message, session.list_documents(), data.model)
    return ToolCallResponse(
        tool_name=trace.tool_name,
        tool_args=trace.tool_args,
        tool_result=trace.tool_result,
        answer=trace.answer,
        model=trace.model,
    )


class AgentRunRequest(BaseModel):
    goal: str = Field(min_length=1, max_length=500)
    model: str = "mock-small"


class AgentStepResponse(BaseModel):
    step: int
    tool_name: str
    tool_args: dict[str, str]
    observation: str
    failed: bool
    retried: bool


class AgentRunResponse(BaseModel):
    plan: list[str]
    steps: list[AgentStepResponse]
    final_answer: str
    model: str


@router.post("/agent/run", response_model=AgentRunResponse)
def agent_run(
    data: AgentRunRequest, session: RagSession = Depends(get_rag_session)
) -> AgentRunResponse:
    trace = run_agent(data.goal, session.list_documents(), data.model)
    return AgentRunResponse(
        plan=trace.plan,
        steps=[
            AgentStepResponse(
                step=s.step,
                tool_name=s.tool_name,
                tool_args=s.tool_args,
                observation=s.observation,
                failed=s.failed,
                retried=s.retried,
            )
            for s in trace.steps
        ],
        final_answer=trace.final_answer,
        model=trace.model,
    )
