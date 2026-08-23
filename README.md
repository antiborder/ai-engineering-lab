# AI Playground

AI Playground is a single app for learning AI from the ground up, built for beginners so they
never get stuck or give up. Learn anywhere, anytime, covering the AI field quickly and simply —
no prior background assumed. Every concept is taught through interactive 2D and 3D
visualizations and hands-on experiments, not slides: drag a slider, watch a model overfit, train
a real Transformer yourself. The goal throughout is understanding, not memorization — you learn
an idea by experiencing it, not by reciting a definition.

It teaches the full AI engineering lifecycle across five connected modules:

1. **Fundamentals** — how LLMs work (classical ML → neural nets → Transformers → tiny LLM)
2. **GenAI Systems** — how AI applications are built (LLM APIs, RAG, tool calling, agents, workflows)
3. **Evaluation** — how to measure whether an AI system works
4. **Inference** — how models are served efficiently (vLLM, KV cache, batching, quantization)
5. **LLMOps** — the production lifecycle (experiment tracking, CI/CD, deployment, monitoring, rollback)

The five modules are not independent apps. They share a single **AI Artifact** lifecycle:

```text
Build → Evaluate → Optimize → Deploy → Monitor → Improve ↺
```

Full specification: [`docs/spec.txt`](docs/spec.txt). Architecture notes: [`docs/architecture/`](docs/architecture/).

## Repository layout

```text
docs/      specs, architecture, learning content, API docs, decisions
frontend/  Next.js + TypeScript
backend/   Python + FastAPI
infra/     Terraform (Phase 2 / GCP only — not used in Phase 1)
```

## Status

Phase 1 (local, no cloud dependency) is in progress. See [`docs/product/`](docs/product/) for per-module status and test checklists.

## Local development

See [`docs/architecture/local-dev.md`](docs/architecture/local-dev.md) for setup instructions.
