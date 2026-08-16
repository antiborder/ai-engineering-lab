import random
from functools import lru_cache

import torch

from app.fundamentals.corpus import TINY_LLM_CORPUS
from app.fundamentals.model import TinyGPT

MAX_LOSS_HISTORY = 200


class TinyLlmConfig:
    def __init__(self, n_layer: int, n_head: int, n_embd: int, block_size: int, lr: float):
        self.n_layer = n_layer
        self.n_head = n_head
        self.n_embd = n_embd
        self.block_size = block_size
        self.lr = lr


class TinyLlmSession:
    """Holds the one Tiny LLM model/optimizer this local dev server trains.

    Single global instance is intentional: this is a Phase 1, single-user,
    local-only teaching tool (spec section 35), not a multi-tenant service —
    there is exactly one "current" model, matching how the frontend lab
    presents it (one architecture, one training run at a time).
    """

    def __init__(self):
        self.chars = sorted(set(TINY_LLM_CORPUS))
        self.stoi = {ch: i for i, ch in enumerate(self.chars)}
        self.itos = dict(enumerate(self.chars))
        self.data = torch.tensor([self.stoi[c] for c in TINY_LLM_CORPUS], dtype=torch.long)

        self.config: TinyLlmConfig | None = None
        self.model: TinyGPT | None = None
        self.optimizer: torch.optim.Optimizer | None = None
        self.step = 0
        self.loss_history: list[float] = []

        self.reset(TinyLlmConfig(n_layer=2, n_head=2, n_embd=32, block_size=48, lr=0.003))

    def encode(self, text: str) -> list[int]:
        return [self.stoi[c] for c in text if c in self.stoi]

    def decode(self, ids: list[int]) -> str:
        return "".join(self.itos[i] for i in ids)

    def reset(self, config: TinyLlmConfig) -> None:
        vocab_size = len(self.chars)
        config.block_size = min(config.block_size, len(self.data) - 1)
        self.model = TinyGPT(vocab_size, config.n_layer, config.n_head, config.n_embd, config.block_size)
        self.optimizer = torch.optim.AdamW(self.model.parameters(), lr=config.lr)
        self.config = config
        self.step = 0
        self.loss_history = []

    def _sample_batch(self, batch_size: int) -> tuple[torch.Tensor, torch.Tensor]:
        assert self.model is not None and self.config is not None
        block_size = self.config.block_size
        max_start = len(self.data) - block_size - 1
        starts = [random.randint(0, max_start) for _ in range(batch_size)]
        x = torch.stack([self.data[s : s + block_size] for s in starts])
        y = torch.stack([self.data[s + 1 : s + block_size + 1] for s in starts])
        return x, y

    def train_steps(self, steps: int, batch_size: int = 32) -> list[float]:
        assert self.model is not None and self.optimizer is not None
        self.model.train()
        losses = []
        for _ in range(steps):
            x, y = self._sample_batch(batch_size)
            _, loss = self.model(x, y)
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            self.step += 1
            loss_value = loss.item()
            losses.append(loss_value)
            self.loss_history = [*self.loss_history, loss_value][-MAX_LOSS_HISTORY:]
        return losses

    def generate(self, prompt: str, max_new_tokens: int, temperature: float) -> str:
        assert self.model is not None
        self.model.eval()
        seed_ids = self.encode(prompt) or [self.stoi[self.chars[0]]]
        idx = torch.tensor([seed_ids], dtype=torch.long)
        out = self.model.generate(idx, max_new_tokens=max_new_tokens, temperature=temperature)
        return self.decode(out[0].tolist())


@lru_cache
def get_tiny_llm_session() -> TinyLlmSession:
    return TinyLlmSession()
