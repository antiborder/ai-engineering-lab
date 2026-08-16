# Module 1 — Fundamentals: status

## What's implemented

All four planned sections: Classical ML, Neural Networks, Transformers, Tiny LLM.

### Classical ML (`/fundamentals/classical-ml`)

Three interactive labs, all client-side, all training live in the browser:

- **Regression** — polynomial regression on a noisy sine curve, trained by batch gradient
  descent. Controls: polynomial degree, L2 regularization (λ), noise, train/test ratio. Shows
  the fitted curve, the true function, and live train/test loss curves. Flags overfitting when
  test loss diverges from train loss.
- **Classification** — logistic regression with polynomial feature expansion on a two-moons
  dataset, trained the same way. Shows a decision-boundary heatmap, train/test accuracy, and
  the same overfitting detection.
- **Clustering** — k-means (Lloyd's algorithm) on Gaussian blobs, animated iteration by
  iteration until assignments stop changing. Lets you set k independently of the true number of
  groups to see under/over-clustering.

Covers the spec 11.1 concept list: regression, classification, clustering, loss, gradient
descent, train/test split, overfitting, regularization, evaluation.

### Neural Networks (`/fundamentals/neural-networks`)

A from-scratch multilayer perceptron (manual forward pass + backpropagation, no ML library),
trained live on the same two-moons dataset as Classification — same loop, more expressive
model. Controls: architecture (no hidden layer up to 2 hidden layers), activation (tanh/ReLU),
learning rate, noise, train ratio. Two linked visualizations:

- **Network diagram** — nodes are neurons; edge color is weight sign, edge thickness is weight
  magnitude; node brightness is mean activation magnitude across the dataset. Updates live
  every training tick.
- **Decision boundary** — the same heatmap component as Classification, so the two are directly
  comparable (a plain linear model draws a straight line; adding hidden layers curves it).

Covers the spec 11.2 concept list: neurons, weights, activations, forward propagation, loss,
backpropagation, optimization.

### Transformers (`/fundamentals/transformers`)

Type any text and inspect a real causal self-attention forward pass, computed from scratch
(tokenization → embeddings + sinusoidal positional encoding → Q/K/V → scaled dot-product
attention → softmax → multi-head concat → residual + layer norm → feed-forward → residual +
layer norm, stacked into 1–3 Transformer blocks). Weights are randomly initialized and fixed
per seed rather than trained — deliberately, since training happens in Tiny LLM; this section
is purely about making the mechanism inspectable:

- **Attention heatmap** — query rows × key columns, selectable by layer and head. Causally
  masked cells (key position after query position) are shown with a distinct red tint rather
  than just "happens to be near zero," so the masking rule reads as a rule.
- **Next-token bars** — a real softmax over real vectors (tied to the input token embeddings),
  clearly captioned as not-yet-meaningful since nothing is trained.
- Controls: number of heads (1/2/3/4/6/8, all divide the fixed 24-dim model), number of
  Transformer blocks (1–3), and a "reinitialize weights" button.

Covers the spec 11.3 concept list: tokenization, embeddings, positional information, Q/K/V,
attention scores, softmax, multi-head attention, causal masking, FFN, residual connections,
layer normalization, Transformer blocks. Autoregressive generation (repeatedly sampling and
appending the next token) is deferred to Tiny LLM, where the predictions are actually worth
generating from.

### Tiny LLM (`/fundamentals/tiny-llm`)

The only Fundamentals section with a real backend: a from-scratch decoder-only Transformer
(`backend/app/fundamentals/model.py`, plain PyTorch — no framework wrapping the architecture)
trained live via `/api/fundamentals/tiny-llm/*` on a ~1.5KB public-domain excerpt (Alice's
Adventures in Wonderland, ch. 1), character-level tokenization. Unlike Transformers, these
weights are actually optimized — clicking Train repeatedly calls a `/train` endpoint that runs
real gradient descent (AdamW + cross-entropy) and the loss visibly drops. Generation is real
autoregressive sampling (temperature-scaled softmax, one token at a time, fed back as input).

Controls: number of Transformer blocks (1–4), attention heads (1/2/4), learning rate,
generation length and temperature. "Reinitialize model" resets training from scratch.

Covers spec 11.4 fully: inspect architecture (param count, vocab size shown), train it, change
parameters, observe loss, generate text — and spec 11.6's explicit PyTorch/tensors/training-loop
learning objective, which the other three (client-side, JS-only) sections don't touch.

**Known limitation:** training state is a single global in-memory session on the backend (no
per-user isolation, resets on backend restart) — correct for this app's single-user local-dev
scope, would need real session handling before any multi-user deployment.

## How to run locally

See [`docs/architecture/local-dev.md`](../architecture/local-dev.md). Classical ML, Neural
Networks, and Transformers are frontend-only. Tiny LLM needs the backend running (no Firestore
emulator needed — its training state isn't persisted).

## What to test

1. Visit `/fundamentals/classical-ml`.
   - **Regression tab**: watch the loss curves converge; drag polynomial degree to 12 and
     confirm the overfitting warning appears; drag back to ~3 and confirm it clears.
   - **Classification tab**: watch the decision boundary settle; increase noise and confirm
     accuracy drops; increase polynomial degree and confirm the boundary curves more.
   - **Clustering tab**: watch it converge (green badge); set k below/above the true number of
     groups to see under/over-clustering.
2. Visit `/fundamentals/neural-networks`.
   - Switch architecture from "no hidden layer" to "2 layers × 6, 4" and confirm both the
     network diagram (node/edge count changes) and the decision boundary (goes from a straight
     line to a curved one) respond.
   - Switch activation between tanh and ReLU and confirm training still converges.
   - Confirm accuracy is comparable to or better than Classical ML's Classification tab on the
     same dataset shape.
3. Visit `/fundamentals/transformers`.
   - Type your own sentence and confirm it tokenizes as expected (words + punctuation as
     separate chips).
   - Switch layer/head selectors and confirm the attention heatmap changes.
   - Confirm the upper-triangle of the heatmap is consistently the dark-red masked color
     regardless of layer/head/text (causal masking).
   - Change "Number of heads" and "Transformer blocks" and confirm the next-token bars update.
4. Visit `/fundamentals/tiny-llm` (backend must be running).
   - Click Train and watch the loss chart drop within a few seconds (tiny model, fast steps).
   - Click Generate with prompt "Alice" — early on it's noise; after ~1000+ steps it should
     produce recognizable words and phrases lifted from the training text.
   - Change architecture (layers/heads) and click "Reinitialize model" — confirm param count
     and vocab size update, loss resets to empty.
   - Stop the backend process and reload the page — confirm a clear error message appears
     instead of a silent failure or crash.
5. Confirm global nav and breadcrumbs work from all four pages, and that the other four
   module links load their (currently placeholder) pages without errors.

## Learning objectives covered

Interactive intuition for: loss functions, gradient descent, the train/test split, overfitting,
L2 regularization; how stacking neurons with nonlinear activations increases model capacity and
how backpropagation is the chain rule applied layer by layer; and how self-attention actually
computes a weighted combination of value vectors from query/key similarity, why causal masking
is necessary for autoregressive generation, and what multiple heads/layers change structurally.

## Known limitations

- Transformers section uses fixed random (untrained) weights by design — see above.
- Tiny LLM's training session is single-user/in-memory (see above).
- No artifact integration in this module (by design — Fundamentals doesn't create AI Artifacts;
  that starts in Module 2). The Firestore-backed `/api/artifacts` endpoints exist as shared
  infrastructure but aren't used by any Fundamentals page.
- No dark/light theme toggle; the app is dark-only for now.

## Tests

- `frontend/tests/fundamentals/classical-ml/models.test.ts` — loss decreases with training,
  regularization shrinks weights, classification accuracy improves, k-means inertia decreases
  monotonically to convergence.
- `frontend/tests/fundamentals/neural-networks/mlp.test.ts` — backpropagation gradients
  verified against a numerical (finite-difference) gradient check, plus a training/accuracy
  sanity test on the two-moons dataset.
- `frontend/tests/fundamentals/transformers/transformer.test.ts` — tokenizer behavior,
  embedding determinism, attention rows sum to 1 (softmax correctness), causal masking is
  actually zero for future positions, next-token distribution covers the right vocabulary.
- `backend/tests/test_tiny_llm.py` — encode/decode roundtrip, training measurably reduces
  loss, generation returns the requested number of new characters, and a full
  init → train → generate API roundtrip.
- `backend/tests/test_artifacts.py`, `test_health.py` — shared infrastructure, not yet used by
  this module's UI.
