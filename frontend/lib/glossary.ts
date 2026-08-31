export interface GlossaryEntry {
  term: string;
  definition: string;
}

/** Plain-language definitions for jargon used across the labs. Keyed by a
 * stable id so `<Term id="...">` call sites don't break if the display
 * text changes. Extend this as new modules introduce new vocabulary. */
export const GLOSSARY: Record<string, GlossaryEntry> = {
  loss: {
    term: "Loss",
    definition:
      "A single number that measures how wrong the model's predictions are. Lower is better. Training is the process of adjusting the model to make this number smaller.",
  },
  mse: {
    term: "Mean Squared Error (MSE)",
    definition:
      "A common loss for predicting numbers: take each prediction's error (predicted − actual), square it (so positive and negative errors both count, and big errors count extra), then average over all the data points.",
  },
  "gradient-descent": {
    term: "Gradient descent",
    definition:
      "An algorithm for reducing loss: compute which direction, for each weight, makes the loss go up fastest (the gradient), then move every weight a small step in the opposite direction. Repeat many times.",
  },
  gradient: {
    term: "Gradient",
    definition:
      "For a given weight, the gradient says two things: which direction increases the loss, and how steeply. Moving against it decreases the loss.",
  },
  "learning-rate": {
    term: "Learning rate",
    definition:
      "How big a step gradient descent takes at each update. Too small and training crawls; too large and it can overshoot and never settle down.",
  },
  epoch: {
    term: "Epoch / step",
    definition:
      "One round of computing the loss on the training data, computing gradients, and updating every weight once. Training usually takes many of these.",
  },
  "train-test-split": {
    term: "Train/test split",
    definition:
      "Data held out from training (the test set) so you can check whether the model actually learned the underlying pattern, rather than just memorizing the exact points it was trained on.",
  },
  overfitting: {
    term: "Overfitting",
    definition:
      "When a model gets very good at the training data but worse at new data, because it started fitting noise and quirks specific to the training points instead of the general pattern.",
  },
  regularization: {
    term: "L2 regularization",
    definition:
      "A penalty added to the loss for having large weights, which discourages the model from relying too heavily on any one feature — a common way to reduce overfitting.",
  },
  "polynomial-degree": {
    term: "Polynomial degree",
    definition:
      "How many bends a curve is allowed to have. Degree 1 is a straight line; higher degrees can wiggle more to fit more complicated shapes — including, if too high, the noise in the training data.",
  },
  weights: {
    term: "Weights",
    definition:
      "The numbers inside a model that get adjusted during training. A prediction is computed by combining the input with these weights; changing the weights changes the prediction.",
  },
  "decision-boundary": {
    term: "Decision boundary",
    definition:
      "The line (or curve) where a classifier switches its prediction from one class to the other — exactly where its predicted probability crosses 50%.",
  },
  sigmoid: {
    term: "Sigmoid function",
    definition:
      "Squashes any real number into a value between 0 and 1, so a raw score can be read as a probability. Large positive scores map near 1, large negative scores map near 0, and 0 maps to exactly 0.5.",
  },
  neuron: {
    term: "Neuron",
    definition:
      "The basic building block of a neural network. A neuron takes in some numbers, combines them into one weighted score using its weights and bias, and passes that score through an activation function to produce a single output number.",
  },
  bias: {
    term: "Bias",
    definition:
      "A constant a neuron adds to its weighted sum, on top of the weighted inputs. It lets the neuron shift its output up or down no matter what the inputs are — the same role the intercept term played in Regression and Classification's linear models.",
  },
  layer: {
    term: "Layer",
    definition:
      "A group of neurons that all compute from the same set of inputs, side by side and independently of one another. A network is a stack of layers: an input layer (the raw numbers going in), one or more hidden layers, and an output layer.",
  },
  "hidden-layer": {
    term: "Hidden layer",
    definition:
      "A layer of neurons sitting between a network's input and its output — 'hidden' because nothing outside the network reads its values directly. Its job is to compute intermediate features the final layer can combine into a prediction.",
  },
  "activation-function": {
    term: "Activation function",
    definition:
      "The nonlinear function applied to each neuron's raw weighted-sum score before passing it on. Without one, stacking layers would collapse into a single linear function no matter how many layers there were — the activation function is what lets depth add real power. Sigmoid, tanh, and ReLU are common choices.",
  },
  relu: {
    term: "ReLU",
    definition:
      "Short for 'rectified linear unit': outputs 0 for any negative input, and passes positive input through unchanged. Cheap to compute and a common default activation function in deep networks.",
  },
  backpropagation: {
    term: "Backpropagation",
    definition:
      "The algorithm that computes gradient descent's gradients for a multi-layer network: it passes the output error backward through the layers, using the chain rule at each one to work out how much every weight — even deep, early ones — contributed to the final mistake.",
  },
  "cross-entropy": {
    term: "Cross-entropy loss",
    definition:
      "The loss used for classification: it compares the predicted probability of the correct class against 1 (certainty). It punishes confident wrong answers much more heavily than uncertain ones.",
  },
  centroid: {
    term: "Centroid",
    definition:
      "The center of a cluster — literally the average (mean) position of every point currently assigned to it.",
  },
  inertia: {
    term: "Inertia",
    definition:
      "k-means's objective: the sum, over every point, of the squared distance from that point to its assigned cluster's centroid. Lower means tighter, more compact clusters.",
  },
  "elbow-method": {
    term: "Elbow method",
    definition:
      "A rule of thumb for picking k: run k-means for several values of k and plot inertia against k. Inertia always drops as k grows, but it drops fast at first and then levels off — the 'elbow' where it bends is a reasonable choice, since adding more clusters past that point buys little.",
  },
  "local-optimum": {
    term: "Local optimum",
    definition:
      "A solution that can't be improved by the algorithm's own small moves, but isn't necessarily the best solution overall. K-means always settles somewhere it can't improve on — but depending on where the centroids started, that 'somewhere' can be worse than what a different starting point would have found.",
  },
  "lloyds-algorithm": {
    term: "Lloyd's algorithm",
    definition:
      "The procedure k-means uses to minimize inertia: assign every point to its nearest centroid, then move each centroid to the mean of its assigned points, and repeat. Unlike gradient descent, each step is an exact recalculation, not a small nudge.",
  },
  token: {
    term: "Token",
    definition:
      "A chunk of text — usually a word or a punctuation mark — that a language model treats as one discrete unit. Text is split into tokens before anything else can happen to it.",
  },
  embedding: {
    term: "Embedding",
    definition:
      "A list of numbers (a vector) that represents a token. It's just an input, exactly like the x₁/x₂ numbers used throughout this app — there are simply many more of them per token, and in a trained model their values end up capturing something about the token's meaning.",
  },
  dimension: {
    term: "Dimension",
    definition:
      "One slot in a list of numbers. A vector with 8 numbers has 8 dimensions — 'the 3rd dimension' just means 'the 3rd number in the list', nothing more exotic than that.",
  },
  "positional-encoding": {
    term: "Positional encoding",
    definition:
      "A pattern of numbers added to each token's embedding to tell the model where in the sequence that token sits. Without it, attention would treat a sentence as a bag of tokens with no order — the encoding for each position is unique, so 'where' becomes part of what the model can use.",
  },
  query: {
    term: "Query",
    definition:
      "One of three vectors attention computes from a token's embedding. The query represents what this token is 'looking for' in the rest of the sequence — it's compared against every token's key to decide how much attention to pay to each one.",
  },
  key: {
    term: "Key",
    definition:
      "One of three vectors attention computes from a token's embedding. The key represents what this token 'advertises' about itself — it's compared against another token's query to produce an attention score.",
  },
  value: {
    term: "Value",
    definition:
      "One of three vectors attention computes from a token's embedding. Once attention decides how much to focus on a token (via its key), the value is the actual content that gets pulled forward — attention output is a weighted blend of values.",
  },
  softmax: {
    term: "Softmax",
    definition:
      "A function that turns a list of raw scores into a list of positive numbers that sum to 1 — a probability distribution. The largest score ends up with most of the weight, but every score keeps at least some, rather than a hard winner-takes-all pick.",
  },
  "causal-masking": {
    term: "Causal masking",
    definition:
      "The rule that a token's attention is only allowed to look at itself and earlier tokens, never later ones. It exists because at generation time later tokens don't exist yet — letting a token attend to the future during training would teach it to cheat.",
  },
  "multi-head-attention": {
    term: "Multi-head attention",
    definition:
      "Instead of computing attention once, split the embedding into several equal slices ('heads') and run attention separately, in parallel, on each slice. Each head can end up focusing on a different kind of relationship between tokens; their outputs are then combined back together.",
  },
  sublayer: {
    term: "Sublayer",
    definition:
      "One of the two computations wrapped in a residual connection plus layer normalization inside a Transformer block: attention is one sublayer, the feed-forward network is the other. Same wrapper, different box in the middle.",
  },
  "residual-connection": {
    term: "Residual connection",
    definition:
      "Adding a sublayer's input back onto its output (output = x + sublayer(x)), instead of just using the sublayer's output on its own. It gives the network an easy fallback — 'change nothing' — and keeps signals from fading out as they pass through many stacked layers.",
  },
  "layer-normalization": {
    term: "Layer normalization",
    definition:
      "Rescaling each token's vector, after a sublayer, so its own values have a consistent mean (0) and spread (1). It keeps numbers in a stable range as they flow through many stacked blocks, rather than growing or shrinking layer after layer.",
  },
  "feed-forward-network": {
    term: "Feed-forward network (FFN)",
    definition:
      "A small ordinary neural network — Linear → ReLU → Linear, no attention involved — applied to each token's vector independently. It's the exact same kind of network taught in the Neural Networks chapter, just reused as one piece of a Transformer block.",
  },
  "transformer-block": {
    term: "Transformer block",
    definition:
      "One repeatable unit of a Transformer: multi-head attention (wrapped in a residual connection and layer normalization), followed by a feed-forward network (also wrapped in a residual connection and layer normalization). Stacking several of these is what makes the model 'deep'.",
  },
  "system-prompt": {
    term: "System prompt",
    definition:
      "Instructions sent with every request that set the model's role or behavior for the whole conversation — e.g. 'You are a helpful assistant' — separate from the user prompt, which is the actual question or task for this one call.",
  },
  delimiter: {
    term: "Delimiter",
    definition:
      "A marker — like an XML-style tag such as <instructions> or <article> — that marks exactly where one part of a prompt ends and another begins. It exists because a model reading one long block of text has to guess where instructions stop and content starts; a delimiter makes that boundary explicit instead of relying on the model to infer it correctly every time.",
  },
  "prompt-injection": {
    term: "Prompt injection",
    definition:
      "When text inserted into a prompt — a retrieved document, a tool's result, a user's message — contains instructions of its own (e.g. 'ignore previous instructions and...') that try to override what the prompt actually asked the model to do. Delimiters and clear instruction/data separation help but aren't foolproof; inserted content should never be treated as trusted instructions.",
  },
  "prompt-template": {
    term: "Prompt template",
    definition:
      "A prompt written with placeholders (e.g. '{{document}}') instead of hardcoded text, filled in with real values at request time. Lets one reusable prompt handle many different inputs — production prompts are almost always templates, not one-off strings.",
  },
  "lost-in-the-middle": {
    term: "Lost in the middle",
    definition:
      "The tendency for models to pay less attention to information buried in the middle of a long context than to information near the start or end. The practical fix: put critical instructions at the start and/or end of a long prompt, not buried in the middle.",
  },
  "few-shot-prompting": {
    term: "Few-shot prompting",
    definition:
      "Showing the model a handful of example input → output pairs before asking it to handle a new input, so it can pattern-match your intent instead of guessing from instructions alone. 'Zero-shot' means no examples, just instructions; 'few-shot' usually means somewhere between 2 and 10.",
  },
  "chain-of-thought": {
    term: "Chain-of-thought prompting",
    definition:
      "Asking the model to work through a problem step by step before giving a final answer, instead of jumping straight to it. Often improves accuracy on multi-step or arithmetic-heavy tasks by giving the model room to reason on the page rather than all at once. Distinct from a reasoning model's own hidden thinking tokens — this is an explicit instruction any model can follow.",
  },
  "reasoning-effort": {
    term: "Reasoning effort",
    definition:
      "A setting on some models (OpenAI's o-series and GPT-5, Anthropic's extended thinking, Gemini's thinking mode) that controls how much hidden 'thinking' the model does before answering. Higher effort can improve answer quality on hard problems, but those thinking tokens are usually billed as output tokens even though you never see them, and latency goes up too.",
  },
  "cached-tokens": {
    term: "Cached tokens",
    definition:
      "The portion of a request's input that a provider recognizes as an exact repeat of a previous request's prefix — most commonly, the growing conversation history in a multi-turn chat. Cached tokens are billed at a fraction of the normal input price, since the provider doesn't have to reprocess them from scratch.",
  },
  temperature: {
    term: "Temperature",
    definition:
      "A dial on how random text generation is: every score is divided by the temperature before softmax. Low temperature (< 1) sharpens the distribution toward the top candidate, closer to always picking the single most likely token. High temperature (> 1) flattens it, giving weaker candidates a real chance and making output more varied — and more error-prone.",
  },
  "context-window": {
    term: "Context window",
    definition:
      "The maximum number of tokens — input and generated output combined — a model can process in a single call. It isn't a soft guideline; it's a hard ceiling built into how the model was trained and deployed. Anything beyond it has to be cut, summarized, or left out entirely.",
  },
  tfidf: {
    term: "TF-IDF",
    definition:
      "A way to turn text into a vector by counting words: each word's count in a chunk (term frequency), scaled up for words that are rare across the whole corpus and down for common ones (inverse document frequency). It's a real vector, but a sparse, word-counting one — unlike a trained neural embedding, it has no notion of meaning, so 'car' and 'automobile' look completely unrelated to it despite meaning the same thing.",
  },
  "cosine-similarity": {
    term: "Cosine similarity",
    definition:
      "A way to score how similar two vectors are: the cosine of the angle between them, from -1 (opposite) to 1 (identical direction). For normalized vectors this is just their dot product — the same score RAG's vector search ranks chunks by.",
  },
  "ai-artifact": {
    term: "AI Artifact",
    definition:
      "An AI Artifact is a saved configuration you can reuse and compare against later versions — a RAG setup, a prompt, an agent, or any other configuration this app builds. It's saved under a name with a version number, so a new attempt can be checked against an earlier one in Evaluation instead of tuning from memory.",
  },
  "json-schema": {
    term: "JSON Schema",
    definition:
      "A specification, written as JSON itself, that describes the exact shape a piece of JSON data must have: which fields exist, their types (string, number, boolean, object, array), which fields are required, and — for a field like a status or role — the exact set of allowed values (an enum).",
  },
  "constrained-decoding": {
    term: "Constrained decoding",
    definition:
      "A generation technique that restricts which tokens a model is allowed to produce at each step, so output that violates a given schema is structurally impossible to generate — instead of letting the model generate freely and checking the result afterward, disallowed tokens are given zero probability before one is even picked.",
  },
  "tool-calling": {
    term: "Tool calling",
    definition:
      "Giving a model access to external functions — a calculator, a live lookup, a document search — that it can call mid-conversation when its own knowledge or reasoning falls short, then use the result to answer. Also called function calling.",
  },
  agent: {
    term: "Agent",
    definition:
      "A model that can take more than one action to reach a goal: plan out several tool calls, run them one after another, and combine everything it learns into a single final answer — instead of the one request-response round trip a plain tool call is.",
  },
  plan: {
    term: "Plan",
    definition:
      "A to-do list an agent keeps alongside its own reasoning, checked off and rewritten as it works. Most real agents implement updating it as a tool call, exactly like calling any other tool, so the plan lives outside the model's own generated text rather than only inside it.",
  },
  observation: {
    term: "Observation",
    definition:
      "The result a tool call returns, fed back to the model as new information it didn't have before. The term comes from the classic 'decide, act, observe' (ReAct) loop that agent systems are built around.",
  },
  "react-pattern": {
    term: "ReAct (Decide, Act, Observe)",
    definition:
      "A step-by-step agent loop: decide one action, take it, look at the result, then decide the next action using that new information — repeating until the goal is done. This lets an agent adapt mid-task, unlike an agent that commits to a full plan before doing anything.",
  },
  mcp: {
    term: "MCP (Model Context Protocol)",
    definition:
      "A standard way to connect a model to many tools and data sources without writing custom integration code for each pairing: register a tool once with an MCP server, and any MCP-compatible model can discover and call it — instead of every application wiring every tool into its own backend by hand.",
  },
  "exact-match": {
    term: "Exact match",
    definition:
      "A metric that checks whether a model's output is character-for-character identical to the expected answer (sometimes after simple normalizing, like lowercasing). Strict and easy to compute, but it scores a correct answer worded differently as wrong — best suited to tasks with one fixed correct string, not open-ended writing.",
  },
  faithfulness: {
    term: "Faithfulness",
    definition:
      "Whether an answer is actually supported by the source material it was given (retrieved documents, provided context), as opposed to sounding plausible but including claims the source never said. A faithful answer can still be factually wrong if the source itself was wrong — faithfulness measures agreement with the source, not truth in general.",
  },
  "retrieval-quality": {
    term: "Retrieval quality",
    definition:
      "How good the documents a system retrieved actually are, measured on their own — separately from whether the final answer built from them turned out correct. Separating the two makes it possible to tell whether a bad answer came from retrieving the wrong documents or from writing a bad answer despite retrieving the right ones.",
  },
  autoregressive: {
    term: "Autoregressive generation",
    definition:
      "Generating text one token at a time: predict the next token, append it to the sequence, then feed the whole thing back in to predict the next one after that. Every word a language model 'writes' was produced by repeating this single-token step.",
  },
  "llm-judge": {
    term: "LLM-as-a-judge",
    definition:
      "Using a model to grade another model's output: it reads the question, the answer, and (if there is one) the reference, then returns a score plus a short explanation for that score. Cheaper and faster than a human rater at scale, but it inherits its own biases — a confidently-worded wrong answer can fool it more easily than a hedging one, and its verdict can shift depending on the order options are shown in.",
  },
  "regression-testing": {
    term: "Regression testing",
    definition:
      "Re-running the same dataset and metrics against a new version of a system and comparing the two score sets side by side, so an improvement on one metric that quietly regresses another (e.g. faster but less accurate) gets caught before it ships, instead of only after users notice.",
  },
};
