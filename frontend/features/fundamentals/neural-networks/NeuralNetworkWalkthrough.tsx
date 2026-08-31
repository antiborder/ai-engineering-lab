"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Equation } from "@/components/Equation";
import { Term } from "@/components/Term";
import { SegmentedProgressBar } from "@/components/SegmentedProgressBar";
import { generateMoonsData, type ClassificationPoint } from "../classical-ml/data";
import { DecisionBoundaryCanvas } from "@/components/DecisionBoundaryCanvas";
import { ProbabilitySurface3D } from "../classical-ml/ProbabilitySurface3D";
import { LossChart } from "../classical-ml/LossChart";
import { Slider } from "../classical-ml/Slider";
import { NetworkDiagram } from "./NetworkDiagram";
import { NeuronDiagram } from "./NeuronDiagram";
import { FunctionPlot } from "@/components/FunctionPlot";
import {
  accuracy,
  initMlp,
  loss,
  meanActivations,
  nextWeights,
  predictProb,
  type Activation,
  type MlpConfig,
  type MlpWeights,
  type Sample,
} from "./mlp";

const BASE_SEED = 4;
const BASE_N = 24;
const BASE_NOISE = 0.15;
const DOMAIN = { xMin: -1.6, xMax: 2.4, yMin: -1.9, yMax: 1.4 };

const ARCH_OPTIONS: { label: string; hiddenSizes: number[] }[] = [
  { label: "no hidden layer (linear)", hiddenSizes: [] },
  { label: "1 layer × 2", hiddenSizes: [2] },
  { label: "1 layer × 4", hiddenSizes: [4] },
  { label: "1 layer × 8", hiddenSizes: [8] },
  { label: "1 layer × 24", hiddenSizes: [24] },
  { label: "3 layers × 16, 16, 16", hiddenSizes: [16, 16, 16] },
];

function toSamples(points: ClassificationPoint[]): Sample[] {
  return points.map((p) => ({ x: [p.x1, p.x2], y: p.label }));
}

function trainSteps(weights: MlpWeights, config: MlpConfig, points: Sample[], lr: number, lambda: number, n: number): MlpWeights {
  let w = weights;
  for (let i = 0; i < n; i++) w = nextWeights(w, config, points, lr, lambda);
  return w;
}

/** Trains from scratch in chunks, recording a loss checkpoint after each
 * chunk — used to pre-populate the loss chart when a step is force-set to a
 * particular architecture, so the trajectory (not just an endpoint) is
 * already visible even if the user skips the training button. */
function trainWithHistory(
  config: MlpConfig,
  seed: number,
  train: Sample[],
  test: Sample[],
  lr: number,
  lambda: number,
  totalSteps: number,
  chunk: number
): { weights: MlpWeights; history: { train: number[]; test: number[] } } {
  let w = initMlp(config, seed);
  const history: { train: number[]; test: number[] } = { train: [], test: [] };
  for (let done = 0; done < totalSteps; done += chunk) {
    w = trainSteps(w, config, train, lr, lambda, chunk);
    history.train.push(loss(w, config, train));
    history.test.push(loss(w, config, test));
  }
  return { weights: w, history };
}

const sigmoidFn = (z: number) => 1 / (1 + Math.exp(-z));
const reluFn = (z: number) => Math.max(0, z);

/** Neural Networks' counterpart to the Classical ML walkthroughs — but
 * unlike Regression/Classification, this chapter can't lean on prior
 * vocabulary for its central object: "neuron" and "layer" are brand new
 * words. So this walkthrough spends its first two sections building a
 * neuron from scratch (inputs, weights, bias, activation) and proving,
 * explicitly, that one neuron IS Classification's linear model, before
 * ever using the word "network". Only after that does it stack neurons
 * into layers, motivate nonlinearity, and cover backpropagation, capacity,
 * and activation choice — each new function (tanh, ReLU) shown as an
 * actual graph, not just an equation. */
export function NeuralNetworkWalkthrough({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const basePoints = useMemo(() => generateMoonsData(BASE_SEED, BASE_N, BASE_NOISE, 1), []);
  const baseSamples = useMemo(() => toSamples(basePoints), [basePoints]);

  // --- Section 2/3 sandbox: a single neuron, weights exposed as scalars so
  // sliders can drive them directly (mirrors Classification's linWeights). ---
  const neuronConfig: MlpConfig = useMemo(() => ({ inputDim: 2, hiddenSizes: [], activation: "tanh" }), []);
  const [neuronWeights, setNeuronWeights] = useState<MlpWeights>([{ W: [[0, 0]], b: [0] }]);
  const neuronW1 = neuronWeights[0].W[0][0];
  const neuronW2 = neuronWeights[0].W[0][1];
  const neuronB = neuronWeights[0].b[0];
  const setNeuronParams = (w1: number, w2: number, b: number) => setNeuronWeights([{ W: [[w1, w2]], b: [b] }]);
  const resetNeuron = () => setNeuronWeights([{ W: [[0, 0]], b: [0] }]);
  const neuronPredict = useCallback((x1: number, x2: number) => predictProb(neuronWeights, neuronConfig, [x1, x2]), [neuronWeights, neuronConfig]);
  const neuronActivations = useMemo(() => meanActivations(neuronWeights, neuronConfig, baseSamples), [neuronWeights, neuronConfig, baseSamples]);

  // --- Main teaching sandbox: one hidden layer of 4, tanh ---
  const netConfig: MlpConfig = useMemo(() => ({ inputDim: 2, hiddenSizes: [4], activation: "tanh" }), []);
  const [netWeights, setNetWeights] = useState<MlpWeights>(() => initMlp(netConfig, 3));
  const netPredict = useCallback((x1: number, x2: number) => predictProb(netWeights, netConfig, [x1, x2]), [netWeights, netConfig]);
  const netActivations = useMemo(() => meanActivations(netWeights, netConfig, baseSamples), [netWeights, netConfig, baseSamples]);
  const resetNet = () => setNetWeights(initMlp(netConfig, 3));

  // --- Architecture sandbox ---
  // Few points and above-average noise: small enough that a big network can
  // memorize training noise, but not so small that even a linear model
  // gets lucky. Verified directly (not just by eye) that at lr=0.5 this
  // seed makes "no hidden layer" plateau early on both losses (underfits),
  // while "3 layers × 16,16,16" drives train loss to ~0 while test loss
  // keeps climbing well past 600 steps (overfits) — and that raising λ on
  // the big network brings test loss back down.
  const ARCH_N = 24;
  const ARCH_NOISE = 0.3;
  const ARCH_LR = 0.5;
  const archPoints = useMemo(() => generateMoonsData(7, ARCH_N, ARCH_NOISE, 0.6), []);
  const archTrain = useMemo(() => archPoints.filter((p) => p.split === "train"), [archPoints]);
  const archTest = useMemo(() => archPoints.filter((p) => p.split === "test"), [archPoints]);
  const archTrainSamples = useMemo(() => toSamples(archTrain), [archTrain]);
  const archTestSamples = useMemo(() => toSamples(archTest), [archTest]);
  const [archIndex, setArchIndex] = useState(2);
  const archConfig: MlpConfig = useMemo(() => ({ inputDim: 2, hiddenSizes: ARCH_OPTIONS[archIndex].hiddenSizes, activation: "tanh" }), [archIndex]);
  const [archLambda, setArchLambda] = useState(0);
  const [archWeights, setArchWeights] = useState<MlpWeights | undefined>(undefined);
  const [archHistory, setArchHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });
  const archModelWeights = archWeights ?? initMlp(archConfig, 5);
  const archPredict = useCallback((x1: number, x2: number) => predictProb(archModelWeights, archConfig, [x1, x2]), [archModelWeights, archConfig]);
  const archActivations = useMemo(() => meanActivations(archModelWeights, archConfig, toSamples(archPoints)), [archModelWeights, archConfig, archPoints]);
  const resetArch = () => { setArchWeights(undefined); setArchHistory({ train: [], test: [] }); };
  const trainArch = (n: number) => {
    const w = trainSteps(archModelWeights, archConfig, archTrainSamples, ARCH_LR, archLambda, n);
    setArchWeights(w);
    setArchHistory((h) => ({
      train: [...h.train, loss(w, archConfig, archTrainSamples)].slice(-150),
      test: [...h.test, loss(w, archConfig, archTestSamples)].slice(-150),
    }));
  };

  // --- Activation-function sandbox ---
  const [actFn, setActFn] = useState<Activation>("tanh");
  const actConfig: MlpConfig = useMemo(() => ({ inputDim: 2, hiddenSizes: [8], activation: actFn }), [actFn]);
  const [actWeights, setActWeights] = useState<MlpWeights | undefined>(undefined);
  const actModelWeights = actWeights ?? initMlp(actConfig, 5);
  const actPredict = useCallback((x1: number, x2: number) => predictProb(actModelWeights, actConfig, [x1, x2]), [actModelWeights, actConfig]);
  const actActivations = useMemo(() => meanActivations(actModelWeights, actConfig, baseSamples), [actModelWeights, actConfig, baseSamples]);
  const resetAct = () => setActWeights(undefined);
  const trainAct = (n: number) => setActWeights(trainSteps(actModelWeights, actConfig, baseSamples, 0.8, 0, n));

  // --- Familiar dials sandbox (learning rate / noise / train ratio) ---
  const [dialLr, setDialLr] = useState(0.8);
  const [dialNoise, setDialNoise] = useState(0.15);
  const [dialRatio, setDialRatio] = useState(0.5);
  const dialConfig: MlpConfig = useMemo(() => ({ inputDim: 2, hiddenSizes: [8], activation: "tanh" }), []);
  const dialPoints = useMemo(() => generateMoonsData(9, 50, dialNoise, dialRatio), [dialNoise, dialRatio]);
  const dialTrain = useMemo(() => dialPoints.filter((p) => p.split === "train"), [dialPoints]);
  const dialTest = useMemo(() => dialPoints.filter((p) => p.split === "test"), [dialPoints]);
  const [dialWeights, setDialWeights] = useState<MlpWeights | undefined>(undefined);
  const dialModelWeights = dialWeights ?? initMlp(dialConfig, 5);
  const dialPredict = useCallback((x1: number, x2: number) => predictProb(dialModelWeights, dialConfig, [x1, x2]), [dialModelWeights, dialConfig]);
  const resetDial = () => setDialWeights(undefined);
  const trainDial = (n: number) => setDialWeights(trainSteps(dialModelWeights, dialConfig, toSamples(dialTrain), dialLr, 0, n));

  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white";
  const chapterLinkBtn =
    "inline bg-transparent p-0 m-0 border-b border-dotted border-cyan-600 text-cyan-700 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 rounded-sm font-semibold";
  const actionBtn = (label: string, onClick: () => void) => (
    <button onClick={onClick} className={nextBtn}>
      {label}
    </button>
  );

  interface Step {
    section: string;
    title: string;
    body: ReactNode;
    visual: ReactNode;
    chart?: ReactNode;
    controls?: ReactNode;
    onAdvance?: () => void;
    resetAction?: () => void;
  }

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "What you learn from this chapter",
      body: (
        <div className="space-y-2">
          <p>This chapter covers stacking neurons into a network:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><strong>The Data</strong> — the same dataset as Classification.</li>
            <li><strong>Meet the Neuron</strong> — the basic building block.</li>
            <li><strong>One Neuron Is a Linear Model</strong> — same math as before, wearing a new name.</li>
            <li><strong>From One Neuron to a Network</strong> — stacking neurons into layers.</li>
            <li><strong>Choosing an Architecture</strong> — how many layers, how many neurons.</li>
            <li><strong>Activation Functions</strong> — sigmoid, tanh, ReLU.</li>
            <li><strong>Familiar Dials Return</strong> — learning rate, regularization, overfitting still apply.</li>
          </ol>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "Welcome",
      title: "Let's learn neural networks together",
      body: (
        <p>
          Last stop in Fundamentals! This chapter introduces a couple of genuinely new words —{" "}
          <Term id="neuron">neuron</Term> and <Term id="layer">layer</Term> — but everything
          underneath them is exactly what you already trained in Classification: weighted sums,
          sigmoid, cross-entropy loss, gradient descent. Same friendly pace, one small idea per
          step.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
    },
    // ----------------------- 1. The Data ----------------------------
    {
      section: "1. The Data",
      title: "The same two crescents",
      body: (
        <p>
          Same dataset as Classification&rsquo;s interleaving crescents — on purpose. It lets us
          compare directly: how much better can a network do than a single neuron on the exact
          same problem?
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} showBoundary={false} />,
    },
    {
      section: "1. The Data",
      title: "Our plan",
      body: (
        <p>
          First, meet the <Term id="neuron">neuron</Term> — the one new building block this whole
          chapter is made of — and see that a single neuron is secretly the exact model you
          already trained. Then we&rsquo;ll stack neurons into <Term id="layer">layers</Term>,
          see why that only works with a nonlinear{" "}
          <Term id="activation-function">activation function</Term>, train the whole thing with{" "}
          <Term id="gradient-descent">gradient descent</Term> via backpropagation, and finish by
          exploring the new dials a network gives us: how big to build it, and which activation to
          use.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} showBoundary={false} />,
    },
    // ------------------------ 2. Meet the Neuron ---------------------------
    {
      section: "2. Meet the Neuron",
      title: "What is a neuron?",
      body: (
        <p>
          Every neural network — no matter how large — is built out of one simple, repeated part
          called a <Term id="neuron">neuron</Term>. A neuron takes in some numbers and produces
          one number out. The rest of this section is just: which numbers go in, and exactly how
          it turns them into that one output.
        </p>
      ),
      visual: <NeuronDiagram stage="blackbox" />,
    },
    {
      section: "2. Meet the Neuron",
      title: "Inputs: the numbers going in",
      body: (
        <p>
          The numbers a neuron receives are its inputs — here, the same{" "}
          <Equation tex="x_1" display={false} /> and <Equation tex="x_2" display={false} /> you
          already know from this dataset. Together, all the inputs feeding a network are called
          its input <Term id="layer">layer</Term> — the two dots on the left of the diagram.
        </p>
      ),
      visual: <NeuronDiagram stage="sum" highlight={["inputs"]} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} showBoundary={false} />,
    },
    {
      section: "2. Meet the Neuron",
      title: "Weights: how much each input matters",
      body: (
        <p>
          Each input connects to the neuron through its own weight — a number that scales that
          input up, down, or flips its sign. A large positive weight means that input strongly
          pushes the output one way; a weight near zero means the neuron barely listens to it. The
          neuron combines its inputs by their weights:
          <Equation tex={"w_1 x_1 + w_2 x_2"} />
        </p>
      ),
      visual: <NeuronDiagram stage="sum" highlight={["weights"]} />,
    },
    {
      section: "2. Meet the Neuron",
      title: "Bias: a constant nudge",
      body: (
        <p>
          One more number: the <Term id="bias">bias</Term>, added on top of the weighted inputs no
          matter what they are. The full weighted sum a neuron computes is:
          <Equation tex={"z = w_1 x_1 + w_2 x_2 + b"} />
          Look closely — this is exactly the raw score <Equation tex="z" display={false} /> from
          Classification&rsquo;s linear boundary. Same formula; we&rsquo;re just now viewing it as
          one neuron&rsquo;s computation instead of a whole model&rsquo;s.
        </p>
      ),
      visual: <NeuronDiagram stage="sum" highlight={["bias"]} />,
    },
    {
      section: "2. Meet the Neuron",
      title: "The activation function",
      body: (
        <p>
          A weighted sum <Equation tex="z" display={false} /> can be any number — it isn&rsquo;t a
          probability yet. A neuron passes <Equation tex="z" display={false} /> through an{" "}
          <Term id="activation-function">activation function</Term> to produce its real output.
          We&rsquo;ll start with one you already know, <Term id="sigmoid">sigmoid</Term>:
          <Equation tex={"\\sigma(z) = \\frac{1}{1+e^{-z}}"} />
          Same S-curve, squashing any score into <Equation tex="(0, 1)" display={false} />.
        </p>
      ),
      visual: <NeuronDiagram stage="full" highlight={["activation"]} />,
      chart: <FunctionPlot fn={sigmoidFn} xMin={-6} xMax={6} xLabel="z" yLabel="σ(z)" />,
    },
    {
      section: "2. Meet the Neuron",
      title: "Put it all together: one neuron",
      body: (
        <p>
          Inputs, weights, bias, activation — that&rsquo;s the whole neuron:
          <Equation tex={"\\text{output} = \\sigma(w_1 x_1 + w_2 x_2 + b)"} />
          Right now every weight and the bias are zero, so <Equation tex="z=0" display={false} />{" "}
          everywhere and the neuron outputs exactly <Equation tex="0.5" display={false} /> — a coin
          flip, shown as the flat blend of colors on the right.
        </p>
      ),
      visual: <NeuronDiagram stage="full" />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} />,
    },
    {
      section: "2. Meet the Neuron",
      title: "Try it yourself: tune a neuron's weights",
      body: (
        <p>
          Drag the sliders and watch the neuron&rsquo;s boundary move. This is the exact same
          interaction as Classification&rsquo;s &ldquo;tilt the boundary&rdquo; step — except now
          you&rsquo;re tuning one neuron&rsquo;s weights and bias directly.
        </p>
      ),
      visual: <NetworkDiagram config={neuronConfig} weights={neuronWeights} activations={neuronActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} />,
      controls: (
        <div className="grid grid-cols-3 gap-3">
          <Slider label="w₁" value={neuronW1} min={-4} max={4} step={0.1} onChange={(v) => setNeuronParams(v, neuronW2, neuronB)} format={(v) => v.toFixed(1)} />
          <Slider label="w₂" value={neuronW2} min={-4} max={4} step={0.1} onChange={(v) => setNeuronParams(neuronW1, v, neuronB)} format={(v) => v.toFixed(1)} />
          <Slider label="b" value={neuronB} min={-4} max={4} step={0.1} onChange={(v) => setNeuronParams(neuronW1, neuronW2, v)} format={(v) => v.toFixed(1)} />
        </div>
      ),
      onAdvance: resetNeuron,
    },
    // ------------------- 3. One Neuron Is a Linear Model -----------------
    {
      section: "3. One Neuron Is a Linear Model",
      title: "This should look familiar",
      body: (
        <div className="space-y-2">
          <p>Compare the two, side by side:</p>
          <p className="text-xs text-neutral-500">Classification&rsquo;s linear boundary:</p>
          <Equation tex={"z = w_0 + w_1 x_1 + w_2 x_2"} />
          <Equation tex={"P(y{=}1\\mid x) = \\sigma(z)"} />
          <p className="text-xs text-neutral-500">One neuron:</p>
          <Equation tex={"z = w_1 x_1 + w_2 x_2 + b"} />
          <Equation tex={"\\text{output} = \\sigma(z)"} />
          <p>
            The only difference is a name — <Equation tex="b" display={false} /> here is{" "}
            <Equation tex="w_0" display={false} /> there. A one-neuron network and
            Classification&rsquo;s linear logistic-regression model are the exact same
            computation, described with different words.
          </p>
        </div>
      ),
      visual: <NetworkDiagram config={neuronConfig} weights={neuronWeights} activations={neuronActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} />,
    },
    {
      section: "3. One Neuron Is a Linear Model",
      title: "Measuring wrongness: the same loss",
      body: (
        <p>
          Since a neuron&rsquo;s output is a probability between 0 and 1, we measure how wrong it
          is exactly the way we did in Classification — <Term id="cross-entropy">cross-entropy
          loss</Term>:
          <Equation tex={"\\text{Loss} = -\\frac{1}{n}\\sum_{i=1}^{n}\\big[y_i\\log p_i + (1-y_i)\\log(1-p_i)\\big]"} />
          <Equation tex="n" display={false} /> is how many data points we have;{" "}
          <Equation tex="y_i" display={false} /> is point <Equation tex="i" display={false} />
          &rsquo;s true label (0 or 1); <Equation tex="p_i" display={false} /> is the neuron&rsquo;s
          predicted probability that it&rsquo;s class 1 — so the loss is just an average, over all{" "}
          <Equation tex="n" display={false} /> points, of how wrong each prediction was. Nothing
          about the loss changes here — only what&rsquo;s producing the probability.
        </p>
      ),
      visual: <NetworkDiagram config={neuronConfig} weights={neuronWeights} activations={neuronActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} highlightErrors />,
    },
    {
      section: "3. One Neuron Is a Linear Model",
      title: "Train it — you already know how",
      body: (
        <p>
          Click below to run 150 <Term id="gradient-descent">gradient descent</Term> steps — the
          exact same update rule as before, now including the bias as one more weight to adjust:
          <Equation tex={"w_i \\leftarrow w_i - \\eta \\, \\frac{\\partial \\, \\text{Loss}}{\\partial w_i}"} />
        </p>
      ),
      visual: <NetworkDiagram config={neuronConfig} weights={neuronWeights} activations={neuronActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} highlightErrors />,
      controls: actionBtn("Train 150 steps", () => setNeuronWeights(trainSteps(neuronWeights, neuronConfig, baseSamples, 1.2, 0, 150))),
      resetAction: resetNeuron,
      onAdvance: () => {
        if (neuronW1 === 0 && neuronW2 === 0 && neuronB === 0) {
          setNeuronWeights(trainSteps([{ W: [[0, 0]], b: [0] }], neuronConfig, baseSamples, 1.2, 0, 150));
        }
      },
    },
    {
      section: "3. One Neuron Is a Linear Model",
      title: "The same ceiling",
      body: (
        <p>
          Accuracy has settled at{" "}
          <span className="text-neutral-900 font-mono">{pct(accuracy(neuronWeights, neuronConfig, baseSamples))}</span> —
          a single neuron, however its weights are tuned, computes one straight decision boundary.
          That&rsquo;s the same ceiling Classification&rsquo;s linear model hit, because it&rsquo;s
          the same model. To do better, we need more than one neuron.
        </p>
      ),
      visual: <NetworkDiagram config={neuronConfig} weights={neuronWeights} activations={neuronActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={neuronPredict} domain={DOMAIN} highlightErrors />,
    },
    // ------------------- 4. From One Neuron to a Network -----------------
    {
      section: "4. From One Neuron to a Network",
      title: "The idea: many neurons side by side",
      body: (
        <p>
          Instead of one neuron, use several, arranged in a{" "}
          <Term id="hidden-layer">hidden layer</Term> — each one computing its own weighted sum
          and activation from the exact same inputs, independently of the others. Their outputs
          then all feed into one more neuron that makes the final call.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={netPredict} domain={DOMAIN} />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "Meet the network diagram",
      body: (
        <p>
          Circles are neurons — each column is one <Term id="layer">layer</Term>. Brighter =
          more active right now. Lines are weights: cyan for positive, orange for negative,
          thicker means stronger. Same weights-and-activations idea as the single neuron, just
          drawn as a graph instead of one equation.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={netPredict} domain={DOMAIN} />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "Starting from zero",
      body: (
        <p>
          Every weight starts small and random this time, not exactly zero (a layer of identical
          zero-weight neurons would never tell them apart during training). Right now it still
          predicts close to a coin flip everywhere.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={netPredict} />,
      onAdvance: resetNet,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "Wait — does stacking layers even help?",
      body: (
        <p>
          Here&rsquo;s a surprising fact: if every neuron just computed a plain weighted sum with{" "}
          <em>no</em> activation function, stacking layers would be pointless. A linear function
          of a linear function is still just linear — the whole network would collapse into one
          single straight boundary, exactly like our one neuron, no matter how many layers you
          stacked.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={netPredict} />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "The fix: a nonlinear activation",
      body: (
        <p>
          Bending each neuron&rsquo;s output through a nonlinear function <em>between</em> layers
          is what lets depth actually add power. We&rsquo;ll use{" "}
          <Equation tex={"\\tanh"} display={false} />:
          <Equation tex={"\\tanh(z) = \\frac{e^{z} - e^{-z}}{e^{z} + e^{-z}}"} />
          It squashes any score into <Equation tex="(-1, 1)" display={false} />, smoothly — an
          S-curve like sigmoid, just centered on zero instead of 0.5.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <FunctionPlot fn={Math.tanh} xMin={-4} xMax={4} xLabel="z" yLabel="tanh(z)" color="#7c3aed" />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "The forward pass",
      body: (
        <p>
          Each hidden neuron <Equation tex="j" display={false} /> in the layer computes,
          independently, from the same inputs:
          <Equation tex={"h_j = \\tanh\\!\\big(\\textstyle\\sum_i w_{ji} x_i + b_j\\big)"} />
          then the output neuron combines all the <Equation tex="h_j" display={false} /> the same
          way our single neuron combined <Equation tex="x_i" display={false} />, finishing with
          sigmoid to get a probability.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={netPredict} />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "What loss are we minimizing?",
      body: (
        <p>
          The network&rsquo;s final neuron still outputs one probability between 0 and 1, so we
          measure how wrong the <em>whole network</em> is with the exact same{" "}
          <Term id="cross-entropy">cross-entropy loss</Term> as before, applied to that one final
          probability:
          <Equation tex={"\\text{Loss} = -\\frac{1}{n}\\sum_{i=1}^{n}\\big[y_i\\log p_i + (1-y_i)\\log(1-p_i)\\big]"} />
          Same <Equation tex="n" display={false} /> data points, same true labels{" "}
          <Equation tex="y_i" display={false} />, same predicted probabilities{" "}
          <Equation tex="p_i" display={false} /> — nothing about the loss itself is new. What&rsquo;s
          new is that now many more numbers, spread across every neuron in every layer, all need
          adjusting to bring it down.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={netPredict} domain={DOMAIN} />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "Training: still gradient descent",
      body: (
        <p>
          The goal and the update rule haven&rsquo;t changed at all — minimize that loss with:
          <Equation tex={"w_i \\leftarrow w_i - \\eta \\, \\frac{\\partial \\, \\text{Loss}}{\\partial w_i}"} />
          applied to <em>every</em> weight in <em>every</em> layer. The only new question is how
          to compute that gradient for a weight buried inside an early layer.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={netPredict} />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "Backpropagation: the chain rule, layer by layer",
      body: (
        <p>
          <Term id="backpropagation">Backpropagation</Term> computes each weight&rsquo;s gradient
          by passing the output error backward through the network, one layer at a time, using
          the chain rule — each layer asks &ldquo;how much am I to blame?&rdquo; based on how much
          the layer <em>after</em> it was to blame. No new math beyond gradient descent, just an
          efficient way to apply it everywhere at once.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={netPredict} />,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "Take one real step",
      body: (
        <p>
          Click below to run one real backpropagation update and watch the diagram&rsquo;s edge
          colors — and the probability surface — shift, just slightly.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={netPredict} />,
      controls: actionBtn("Take one backprop step", () => setNetWeights(trainSteps(netWeights, netConfig, baseSamples, 0.8, 0, 1))),
      resetAction: resetNet,
    },
    {
      section: "4. From One Neuron to a Network",
      title: "Repeat, and watch it learn",
      body: (
        <p>
          Click below to run 200 steps. Watch the network diagram light up and the decision
          surface fold itself around the two crescents.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={netPredict} />,
      controls: actionBtn("Train 200 steps", () => setNetWeights(trainSteps(netWeights, netConfig, baseSamples, 0.8, 0, 200))),
      resetAction: resetNet,
      onAdvance: () => {
        if (accuracy(netWeights, netConfig, baseSamples) < 0.8) {
          setNetWeights(trainSteps(initMlp(netConfig, 3), netConfig, baseSamples, 0.8, 0, 400));
        }
      },
    },
    {
      section: "4. From One Neuron to a Network",
      title: "A network beats a single neuron",
      body: (
        <p>
          Accuracy is now{" "}
          <span className="text-neutral-900 font-mono">{pct(accuracy(netWeights, netConfig, baseSamples))}</span> —
          remember our single neuron topped out around{" "}
          <span className="text-neutral-900 font-mono">{pct(accuracy(neuronWeights, neuronConfig, baseSamples))}</span> on
          this exact same data. Four hidden neurons, one nonlinearity, and the exact same training
          rule got us the rest of the way.
        </p>
      ),
      visual: <NetworkDiagram config={netConfig} weights={netWeights} activations={netActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={netPredict} domain={DOMAIN} highlightErrors />,
    },
    // ------------------------ 5. Choosing an Architecture ---------------
    {
      section: "5. Choosing an Architecture",
      title: "A brand-new dial: size",
      body: (
        <p>
          Networks add a new capacity knob polynomials didn&rsquo;t have: how many neurons per{" "}
          <Term id="layer">layer</Term>, and how many layers. More of either means more
          flexibility — and, just like polynomial degree, that cuts both ways.
        </p>
      ),
      visual: <NetworkDiagram config={archConfig} weights={archModelWeights} activations={archActivations} />,
      chart: <DecisionBoundaryCanvas points={archPoints} predict={archPredict} domain={DOMAIN} />,
    },
    {
      section: "5. Choosing an Architecture",
      title: "Try it yourself: pick an architecture",
      body: (
        <p>
          Drag through architectures from linear up to 3 layers deep, then train. Watch train vs.
          test loss in the chart as the network grows — that gap, more than the accuracy number,
          is where under- and overfitting first show up.
        </p>
      ),
      visual: <NetworkDiagram config={archConfig} weights={archModelWeights} activations={archActivations} />,
      chart: <LossChart series={[{ label: "train", color: "#7c3aed", values: archHistory.train }, { label: "test", color: "#ea580c", values: archHistory.test }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label={`Architecture: ${ARCH_OPTIONS[archIndex].label}`} value={archIndex} min={0} max={ARCH_OPTIONS.length - 1} step={1} onChange={(v) => { setArchIndex(v); resetArch(); }} />
          {actionBtn("Train 400 steps", () => trainArch(400))}
          <p className="text-xs text-neutral-500 font-mono">
            train acc {pct(accuracy(archModelWeights, archConfig, archTrainSamples))} · test acc {pct(accuracy(archModelWeights, archConfig, archTestSamples))}
          </p>
        </div>
      ),
      resetAction: resetArch,
      onAdvance: () => {
        setArchIndex(0);
        const linConfig: MlpConfig = { inputDim: 2, hiddenSizes: ARCH_OPTIONS[0].hiddenSizes, activation: "tanh" };
        const { weights, history } = trainWithHistory(linConfig, 5, archTrainSamples, archTestSamples, ARCH_LR, 0, 400, 100);
        setArchWeights(weights);
        setArchHistory(history);
      },
    },
    {
      section: "5. Choosing an Architecture",
      title: "Too small: underfitting",
      body: (
        <p>
          With &ldquo;no hidden layer&rdquo; selected, both curves already flatten out early and
          stay flat — more training steps won&rsquo;t improve them. A straight line simply
          can&rsquo;t bend around these crescents, so it plateaus at a mediocre loss on train
          <em> and</em> test alike. Try training more steps and watch nothing change.
        </p>
      ),
      visual: <NetworkDiagram config={archConfig} weights={archModelWeights} activations={archActivations} />,
      chart: <LossChart series={[{ label: "train", color: "#7c3aed", values: archHistory.train }, { label: "test", color: "#ea580c", values: archHistory.test }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label={`Architecture: ${ARCH_OPTIONS[archIndex].label}`} value={archIndex} min={0} max={ARCH_OPTIONS.length - 1} step={1} onChange={(v) => { setArchIndex(v); resetArch(); }} />
          {actionBtn("Train 400 steps", () => trainArch(400))}
        </div>
      ),
      resetAction: resetArch,
      onAdvance: () => {
        setArchIndex(5);
        const bigConfig: MlpConfig = { inputDim: 2, hiddenSizes: ARCH_OPTIONS[5].hiddenSizes, activation: "tanh" };
        const { weights, history } = trainWithHistory(bigConfig, 5, archTrainSamples, archTestSamples, ARCH_LR, 0, 600, 100);
        setArchWeights(weights);
        setArchHistory(history);
      },
    },
    {
      section: "5. Choosing an Architecture",
      title: "Too big: overfitting",
      body: (
        <p>
          Now with &ldquo;3 layers × 16, 16, 16&rdquo; selected, look at the loss chart: train
          loss has collapsed toward zero, but test loss is <em>higher</em> than where it started
          and still climbing. With only {archTrain.length} training points, the network has more
          than enough capacity to memorize them exactly — including their noise — which actively
          hurts it on unseen data. Click &ldquo;Train 400 steps&rdquo; again and watch test loss
          keep rising while train loss stays pinned near zero.
        </p>
      ),
      visual: <NetworkDiagram config={archConfig} weights={archModelWeights} activations={archActivations} />,
      chart: <LossChart series={[{ label: "train", color: "#7c3aed", values: archHistory.train }, { label: "test", color: "#ea580c", values: archHistory.test }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label={`Architecture: ${ARCH_OPTIONS[archIndex].label}`} value={archIndex} min={0} max={ARCH_OPTIONS.length - 1} step={1} onChange={(v) => { setArchIndex(v); resetArch(); }} />
          {actionBtn("Train 400 steps", () => trainArch(400))}
        </div>
      ),
      resetAction: resetArch,
      onAdvance: () => {
        setArchIndex(5);
        setArchWeights(undefined);
        setArchHistory({ train: [], test: [] });
      },
    },
    {
      section: "5. Choosing an Architecture",
      title: "The same fix still works: L2",
      body: (
        <p>
          <Term id="regularization">L2 regularization</Term> penalizes large weights here exactly
          like it did for polynomials. Raise <Equation tex={"\\lambda"} display={false} /> on this
          same oversized network and watch the train/test gap close back up.
        </p>
      ),
      visual: <NetworkDiagram config={archConfig} weights={archModelWeights} activations={archActivations} />,
      chart: <LossChart series={[{ label: "train", color: "#7c3aed", values: archHistory.train }, { label: "test", color: "#ea580c", values: archHistory.test }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="λ (regularization strength)" value={archLambda} min={0} max={0.5} step={0.01} onChange={setArchLambda} format={(v) => v.toFixed(2)} />
          {actionBtn("Train 400 steps", () => trainArch(400))}
        </div>
      ),
      resetAction: resetArch,
      onAdvance: () => { setArchLambda(0); setArchWeights(undefined); setArchHistory({ train: [], test: [] }); },
    },
    {
      section: "5. Choosing an Architecture",
      title: "Size is a dial, not a one-way switch",
      body: (
        <p>
          Same lesson as <Term id="polynomial-degree">polynomial degree</Term>: too small
          underfits, too big overfits (unless reined in), and the right size depends on how much
          data you actually have.
        </p>
      ),
      visual: <NetworkDiagram config={archConfig} weights={archModelWeights} activations={archActivations} />,
      chart: <DecisionBoundaryCanvas points={archPoints} predict={archPredict} domain={DOMAIN} />,
    },
    // -------------------- 6. Activation Functions -----------------------
    {
      section: "6. Activation Functions",
      title: "Recap: tanh",
      body: (
        <p>
          The hidden layer above used <Equation tex={"\\tanh"} display={false} />, which squashes
          any score into <Equation tex="(-1, 1)" display={false} />, centered on zero:
          <Equation tex={"\\tanh(z) = \\frac{e^{z} - e^{-z}}{e^{z} + e^{-z}}"} />
          Here&rsquo;s its shape again — smooth everywhere, steepest right around{" "}
          <Equation tex="z=0" display={false} />.
        </p>
      ),
      visual: <NetworkDiagram config={actConfig} weights={actModelWeights} activations={actActivations} />,
      chart: <FunctionPlot fn={Math.tanh} xMin={-4} xMax={4} xLabel="z" yLabel="tanh(z)" color="#7c3aed" />,
    },
    {
      section: "6. Activation Functions",
      title: "A new option: ReLU",
      body: (
        <p>
          <Term id="relu">ReLU</Term> is a different, blunter nonlinearity:
          <Equation tex={"\\text{ReLU}(z) = \\max(0, z)"} />
          Zero for any negative score, passed straight through unchanged otherwise — a flat line
          that suddenly turns into a rising diagonal at <Equation tex="z=0" display={false} />.
          Cheap to compute, and still nonlinear, which is the only thing that was ever required.
        </p>
      ),
      visual: <NetworkDiagram config={actConfig} weights={actModelWeights} activations={actActivations} />,
      chart: <FunctionPlot fn={reluFn} xMin={-4} xMax={4} xLabel="z" yLabel="ReLU(z)" color="#ea580c" />,
    },
    {
      section: "6. Activation Functions",
      title: "Try it yourself: switch activations",
      body: (
        <p>
          Train with tanh, note the boundary&rsquo;s shape, then switch to ReLU and train again
          from scratch.
        </p>
      ),
      visual: <NetworkDiagram config={actConfig} weights={actModelWeights} activations={actActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={actPredict} domain={DOMAIN} />,
      controls: (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["tanh", "relu"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setActFn(f); resetAct(); }}
                className={`px-3 py-1.5 rounded-md text-sm ${actFn === f ? "bg-cyan-600 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
              >
                {f === "tanh" ? "tanh" : "ReLU"}
              </button>
            ))}
          </div>
          {actionBtn("Train 300 steps", () => trainAct(300))}
        </div>
      ),
      resetAction: resetAct,
    },
    {
      section: "6. Activation Functions",
      title: "Why they look different",
      body: (
        <p>
          ReLU boundaries tend to look faceted — made of flat pieces — because each ReLU neuron
          is either fully &ldquo;off&rdquo; or acting like a plain straight line. Tanh boundaries
          tend to look smoother, since every neuron bends continuously. Neither is strictly
          better; ReLU is popular mainly because it&rsquo;s cheap to compute and trains fast in
          deep networks.
        </p>
      ),
      visual: <NetworkDiagram config={actConfig} weights={actModelWeights} activations={actActivations} />,
      chart: <DecisionBoundaryCanvas points={basePoints} predict={actPredict} domain={DOMAIN} />,
      onAdvance: () => { setActFn("tanh"); setActWeights(undefined); },
    },
    // -------------------- 7. Familiar Dials Return -----------------------
    {
      section: "7. Familiar Dials Return",
      title: "Same dials, same effects",
      body: (
        <p>
          Learning rate, noise, and train ratio all mean exactly what they meant in Classification
          — a network doesn&rsquo;t change what they do, just how many weights they&rsquo;re
          nudging at once.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={dialPoints} predict={dialPredict} domain={DOMAIN} />,
    },
    {
      section: "7. Familiar Dials Return",
      title: "Try it yourself: learning rate",
      body: (
        <p>
          Push it very low, train, then very high, train again. Same story as before: too small
          crawls, too large jitters.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={dialPoints} predict={dialPredict} domain={DOMAIN} highlightErrors />,
      controls: (
        <div className="space-y-3">
          <Slider label="Learning rate (η)" value={dialLr} min={0.05} max={3} step={0.05} onChange={setDialLr} format={(v) => v.toFixed(2)} />
          {actionBtn("Train 100 steps", () => trainDial(100))}
        </div>
      ),
      resetAction: resetDial,
      onAdvance: () => { setDialLr(0.8); setDialWeights(undefined); },
    },
    {
      section: "7. Familiar Dials Return",
      title: "Try it yourself: noise and data split",
      body: (
        <p>
          Turn up noise to blur the crescents together, or push the train ratio to an extreme, and
          train — the same underfitting/overfitting/unreliable-estimate effects show up again.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={dialPoints} predict={dialPredict} domain={DOMAIN} highlightErrors />,
      controls: (
        <div className="grid grid-cols-2 gap-3">
          <Slider label="Noise" value={dialNoise} min={0} max={0.4} step={0.02} onChange={(v) => { setDialNoise(v); resetDial(); }} format={(v) => v.toFixed(2)} />
          <Slider label="Train ratio" value={dialRatio} min={0.1} max={0.9} step={0.05} onChange={(v) => { setDialRatio(v); resetDial(); }} format={(v) => pct(v)} />
          <div className="col-span-2">{actionBtn("Train 200 steps", () => trainDial(200))}</div>
          <p className="col-span-2 text-xs text-neutral-500">{dialTrain.length} train points · {dialTest.length} test points</p>
        </div>
      ),
      resetAction: resetDial,
      onAdvance: () => { setDialNoise(0.15); setDialRatio(0.5); setDialWeights(undefined); },
    },
    // ---------------------------- 8. Wrap-up ------------------------------
    {
      section: "8. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A <Term id="neuron">neuron</Term> combines its inputs via weights and a{" "}
              <Term id="bias">bias</Term> into one weighted sum, then passes it through an{" "}
              <Term id="activation-function">activation function</Term>.</li>
            <li>A <Term id="layer">layer</Term> is a group of neurons computing from the same
              inputs, side by side.</li>
            <li>A single neuron with sigmoid <em>is</em> Classification&rsquo;s linear model —
              same equation, same loss, same training rule.</li>
            <li>Without a nonlinear activation between layers, stacking is pointless — it
              collapses back to one linear boundary.</li>
            <li><Term id="backpropagation">Backpropagation</Term> is gradient descent&rsquo;s
              chain rule, applied layer by layer — same update rule as before.</li>
            <li>Network size (width and depth) is a new capacity dial, with the same under/
              <Term id="overfitting">overfitting</Term> tradeoff as polynomial degree.</li>
            <li>Learning rate, noise, train ratio, and <Term id="regularization">L2
              regularization</Term> all carry over unchanged.</li>
          </ul>
        </div>
      ),
      visual: undefined,
    },
    {
      section: "8. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything you just learned is now unlocked below as a free-play sandbox. Build a
          network far too big for the data. Watch it overfit, then rein it back in. See it for
          yourself.
          <br />
          Or,{" "}
          <Link href="/fundamentals/transformers" className={chapterLinkBtn}>
            proceed to Transformers?
          </Link>
        </p>
      ),
      visual: undefined,
    },
  ];

  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;
  const isFirst = step === 0;

  const goNext = () => {
    current.onAdvance?.();
    if (isLast) {
      onComplete();
      return;
    }
    setStep((s) => Math.min(total - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-center sm:text-left">
        <span className="text-xs uppercase tracking-wide text-cyan-700 sm:flex-1">{current.section}</span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={goBack}
            disabled={isFirst}
            className="px-3 py-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-sm text-neutral-700"
          >
            Back
          </button>
          <button onClick={goNext} className={nextBtn}>
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
        <span className="text-xs text-neutral-500 sm:flex-1 sm:text-right">
          Step {step + 1} of {total}
        </span>
      </div>

      <SegmentedProgressBar
        sections={steps.map((s) => s.section)}
        currentStep={step}
        onSelectStep={setStep}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-neutral-900">{current.title}</h3>
        <div className="text-sm text-neutral-600 leading-relaxed space-y-3">{current.body}</div>

        {current.controls && (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex flex-col items-start gap-2">
            {current.controls}
            {current.resetAction && (
              <button
                onClick={current.resetAction}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                ↺ Undo / reset this step
              </button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {current.visual}
          {current.chart}
        </div>
      </div>
    </div>
  );
}
