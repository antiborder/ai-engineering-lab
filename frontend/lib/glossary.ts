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
};
