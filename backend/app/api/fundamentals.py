from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.fundamentals.corpus import TINY_LLM_CORPUS
from app.fundamentals.tiny_llm_session import TinyLlmConfig, TinyLlmSession, get_tiny_llm_session

router = APIRouter(prefix="/fundamentals/tiny-llm", tags=["fundamentals"])


class InitRequest(BaseModel):
    n_layer: int = Field(ge=1, le=4)
    n_head: int = Field(ge=1, le=4)
    n_embd: int = Field(ge=8, le=128)
    block_size: int = Field(ge=8, le=128)
    lr: float = Field(gt=0, le=0.1)


class StateResponse(BaseModel):
    n_layer: int
    n_head: int
    n_embd: int
    block_size: int
    lr: float
    vocab_size: int
    num_params: int
    step: int
    loss_history: list[float]


def _state_response(session: TinyLlmSession) -> StateResponse:
    assert session.model is not None and session.config is not None
    config = session.config
    return StateResponse(
        n_layer=config.n_layer,
        n_head=config.n_head,
        n_embd=config.n_embd,
        block_size=config.block_size,
        lr=config.lr,
        vocab_size=len(session.chars),
        num_params=session.model.num_params(),
        step=session.step,
        loss_history=session.loss_history,
    )


@router.get("/corpus")
def get_corpus() -> dict[str, str | int]:
    return {"text": TINY_LLM_CORPUS, "length": len(TINY_LLM_CORPUS)}


@router.get("/state", response_model=StateResponse)
def get_state(
    session: TinyLlmSession = Depends(get_tiny_llm_session),
) -> StateResponse:
    return _state_response(session)


@router.post("/init", response_model=StateResponse)
def init_model(
    data: InitRequest,
    session: TinyLlmSession = Depends(get_tiny_llm_session),
) -> StateResponse:
    session.reset(TinyLlmConfig(**data.model_dump()))
    return _state_response(session)


class TrainRequest(BaseModel):
    steps: int = Field(ge=1, le=50)


class TrainResponse(BaseModel):
    step: int
    losses: list[float]
    loss_history: list[float]


@router.post("/train", response_model=TrainResponse)
def train(
    data: TrainRequest,
    session: TinyLlmSession = Depends(get_tiny_llm_session),
) -> TrainResponse:
    losses = session.train_steps(data.steps)
    return TrainResponse(step=session.step, losses=losses, loss_history=session.loss_history)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=200)
    max_new_tokens: int = Field(default=200, ge=1, le=500)
    temperature: float = Field(default=0.8, gt=0, le=2)


class GenerateResponse(BaseModel):
    text: str


@router.post("/generate", response_model=GenerateResponse)
def generate(
    data: GenerateRequest,
    session: TinyLlmSession = Depends(get_tiny_llm_session),
) -> GenerateResponse:
    text = session.generate(data.prompt, data.max_new_tokens, data.temperature)
    return GenerateResponse(text=text)
