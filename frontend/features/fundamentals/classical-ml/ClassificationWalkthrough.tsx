"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Equation } from "@/components/Equation";
import { Term } from "@/components/Term";
import { generateMoonsData, type ClassificationPoint } from "./data";
import { LogisticRegressor } from "./models";
import { DecisionBoundaryCanvas } from "@/components/DecisionBoundaryCanvas";
import { ProbabilitySurface3D } from "./ProbabilitySurface3D";
import { LossChart } from "./LossChart";
import { Slider } from "./Slider";

const BASE_SEED = 6;
const BASE_N = 20;
const BASE_NOISE = 0.15;
// The Overfitting/Noise/Train-Ratio/L2 sections need enough points for a
// genuine, stable train/test accuracy gap to show up — 20 points is too
// few for that (test accuracy can end up *higher* than train by luck of
// the split). Verified against this seed: at OF_N/OF_NOISE, a degree-9
// model reaches 100% train accuracy but only ~78% test accuracy.
const OF_N = 30;
const OF_NOISE = 0.25;
const DOMAIN = { xMin: -1.6, xMax: 2.4, yMin: -1.9, yMax: 1.4 };

function trainSteps(model: LogisticRegressor, points: ClassificationPoint[], n: number): number[] {
  let w = model.weights;
  for (let i = 0; i < n; i++) {
    w = new LogisticRegressor(model.degree, model.lambda, model.lr, w).nextWeights(points);
  }
  return w;
}

/** Classification's counterpart to RegressionWalkthrough: same ~50-step,
 * chapter-structured, one-idea-per-step format, with its own pair of
 * per-step visuals — the flat 2D decision-boundary heatmap
 * (DecisionBoundaryCanvas) plus a 3D probability surface
 * (ProbabilitySurface3D) that literally bends into shape as the model
 * trains, playing the same visual role MSELandscape played for
 * Regression's loss surface. */
export function ClassificationWalkthrough({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  // Shared dataset for "The Data" through "The Learning Rate Dial" — fully
  // train (trainRatio=1) until "Overfitting" introduces the split.
  const basePoints = useMemo(() => generateMoonsData(BASE_SEED, BASE_N, BASE_NOISE, 1), []);

  // --- Linear Boundary sandbox (degree 1: w0 + w1 x1 + w2 x2) ---
  const [linWeights, setLinWeights] = useState<number[]>([0, 0, 0]);
  const linModel = useMemo(() => new LogisticRegressor(1, 0, 1.2, linWeights), [linWeights]);
  const linPredict = useCallback((x1: number, x2: number) => linModel.probability(x1, x2), [linModel]);

  // --- Curved Boundary sandbox (degree 3) ---
  const [cubWeights, setCubWeights] = useState<number[] | undefined>(undefined);
  const cubModel = useMemo(() => new LogisticRegressor(3, 0, 1.2, cubWeights), [cubWeights]);
  const cubPredict = useCallback((x1: number, x2: number) => cubModel.probability(x1, x2), [cubModel]);

  // --- Overfitting sandbox ---
  const [ofDegree, setOfDegree] = useState(9);
  const [ofWeights, setOfWeights] = useState<number[] | undefined>(undefined);
  const [ofTrainRatio, setOfTrainRatio] = useState(1);
  const [ofHistory, setOfHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });
  const ofPoints = useMemo(
    () => generateMoonsData(BASE_SEED, OF_N, OF_NOISE, ofTrainRatio),
    [ofTrainRatio]
  );
  const ofTrain = useMemo(() => ofPoints.filter((p) => p.split === "train"), [ofPoints]);
  const ofTest = useMemo(() => ofPoints.filter((p) => p.split === "test"), [ofPoints]);
  const ofModel = useMemo(() => new LogisticRegressor(ofDegree, 0, 1.2, ofWeights), [ofDegree, ofWeights]);
  const ofPredict = useCallback((x1: number, x2: number) => ofModel.probability(x1, x2), [ofModel]);

  // --- Learning Rate sandbox (reuses a fresh degree-3 model) ---
  const [lrValue, setLrValue] = useState(1.2);
  const [lrWeights, setLrWeights] = useState<number[] | undefined>(undefined);
  const lrModel = useMemo(() => new LogisticRegressor(3, 0, lrValue, lrWeights), [lrValue, lrWeights]);
  const lrPredict = useCallback((x1: number, x2: number) => lrModel.probability(x1, x2), [lrModel]);

  // --- Noise sandbox ---
  const [noiseValue, setNoiseValue] = useState(0.15);
  const [noiseWeights, setNoiseWeights] = useState<number[] | undefined>(undefined);
  const noisePoints = useMemo(() => generateMoonsData(BASE_SEED, OF_N, noiseValue, 1), [noiseValue]);
  const noiseModel = useMemo(() => new LogisticRegressor(9, 0, 1.2, noiseWeights), [noiseWeights]);
  const noisePredict = useCallback((x1: number, x2: number) => noiseModel.probability(x1, x2), [noiseModel]);

  // --- Train Ratio sandbox ---
  const [ratioValue, setRatioValue] = useState(0.5);
  const ratioPoints = useMemo(() => generateMoonsData(BASE_SEED, OF_N, OF_NOISE, ratioValue), [ratioValue]);
  const ratioTrain = useMemo(() => ratioPoints.filter((p) => p.split === "train"), [ratioPoints]);
  const ratioTest = useMemo(() => ratioPoints.filter((p) => p.split === "test"), [ratioPoints]);
  const [ratioWeights, setRatioWeights] = useState<number[] | undefined>(undefined);
  const [ratioHistory, setRatioHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });
  const ratioModel = useMemo(() => new LogisticRegressor(9, 0, 1.2, ratioWeights), [ratioWeights]);
  const ratioPredict = useCallback((x1: number, x2: number) => ratioModel.probability(x1, x2), [ratioModel]);

  // --- L2 Regularization sandbox ---
  const [lambdaValue, setLambdaValue] = useState(0);
  const [regWeights, setRegWeights] = useState<number[] | undefined>(undefined);
  const regPoints = useMemo(() => generateMoonsData(BASE_SEED, OF_N, OF_NOISE, 0.7), []);
  const regTrain = useMemo(() => regPoints.filter((p) => p.split === "train"), [regPoints]);
  const regTest = useMemo(() => regPoints.filter((p) => p.split === "test"), [regPoints]);
  const regModel = useMemo(() => new LogisticRegressor(9, lambdaValue, 1.2, regWeights), [lambdaValue, regWeights]);
  const regPredict = useCallback((x1: number, x2: number) => regModel.probability(x1, x2), [regModel]);

  const pct = (v: number) => `${(v * 100).toFixed(0)}%`;
  const num = (v: number, d = 3) => v.toFixed(d);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white";
  const trainBtn = (label: string, onClick: () => void) => (
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
    /** Undoes whatever a "Train N steps" button on this step just did,
     * back to that sandbox's starting state. Sliders are already their own
     * undo (drag them back); a training button isn't, so every step with
     * one gets a paired reset. */
    resetAction?: () => void;
  }

  const steps: Step[] = [
    // ---------------------------------------------------------------
    {
      section: "Welcome",
      title: "Let's learn classification together",
      body: (
        <p>
          Hi again! This time we&rsquo;re teaching a model to sort points into two groups instead
          of predicting a number. Same friendly pace as before — one small idea per step, and
          plenty to try yourself along the way.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={[]} predict={linPredict} domain={DOMAIN} showBoundary={false} />,
    },
    // ----------------------- 1. The Data ----------------------------
    {
      section: "1. The Data",
      title: "Here's what we're working with",
      body: (
        <p>
          Every point belongs to one of two classes — orange or cyan — arranged in two
          interleaving crescents. Our goal is to draw a boundary that separates them as cleanly as
          possible.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} showBoundary={false} />,
    },
    {
      section: "1. The Data",
      title: "What do the axes mean?",
      body: (
        <p>
          <Equation tex="x_1" display={false} /> and <Equation tex="x_2" display={false} /> are
          just two measurements about each point — any two numbers you could measure about
          something. The label (orange or cyan) is whatever category we&rsquo;re trying to
          predict from them.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} showBoundary={false} />,
    },
    {
      section: "1. The Data",
      title: "Our plan",
      body: (
        <p>
          Same recipe as Regression: start with the simplest possible boundary — a straight line —
          train it with <Term id="gradient-descent">gradient descent</Term>, then reuse the exact
          same technique on a curvier model once we see where the line falls short.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} showBoundary={false} />,
    },
    // ------------------- 2. Linear Boundary (subsection) -----------------
    {
      section: "2. Linear Boundary",
      title: "Our first model: a straight boundary",
      body: (
        <p>
          Three numbers control a straight boundary through this 2D space:
          <Equation tex={"z = w_0 + w_1 x_1 + w_2 x_2"} />
          <Equation tex="z" display={false} /> is a raw score — positive on one side of the line,
          negative on the other, exactly zero right on it.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    {
      section: "2. Linear Boundary",
      title: "From score to probability: the sigmoid",
      body: (
        <p>
          A raw score isn&rsquo;t a probability yet — it can be any number. The{" "}
          <Term id="sigmoid">sigmoid function</Term> squashes it into a clean 0–1 range. We write
          the result <Equation tex="P(y=1 \mid x)" display={false} /> — read aloud as{" "}
          <em>&ldquo;the probability y is 1, given x&rdquo;</em>, where{" "}
          <Equation tex={"\\mid"} display={false} /> just means &ldquo;given&rdquo;:
          <Equation tex={"P(y=1 \\mid x) = \\sigma(z(x)), \\qquad \\sigma(z) = \\frac{1}{1+e^{-z}}"} />
          <Equation tex="z(x)" display={false} /> is just the score from the previous step,{" "}
          <Equation tex="w_0 + w_1 x_1 + w_2 x_2" display={false} />, written for input{" "}
          <Equation tex="x = (x_1, x_2)" display={false} />. Large positive{" "}
          <Equation tex="z" display={false} /> means &ldquo;confidently cyan&rdquo;; large negative
          means &ldquo;confidently orange&rdquo;.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    {
      section: "2. Linear Boundary",
      title: "Starting from zero",
      body: (
        <p>
          All three weights start at zero, so <Equation tex="z=0" display={false} /> everywhere
          and every point gets exactly <Equation tex="0.5" display={false} /> — a coin flip. That&rsquo;s
          the flat, even blend of both colors you see, and the flat plane on the right.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
      onAdvance: () => setLinWeights([0, 0, 0]),
    },
    {
      section: "2. Linear Boundary",
      title: "Try it yourself: tilt the boundary",
      body: (
        <p>
          Drag the sliders and watch the line move on the left — and the plane tilt on the right.
          The boundary is exactly where that tilted plane crosses the dashed 0.5 line.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
      controls: (
        <div className="grid grid-cols-3 gap-3">
          <Slider label="w₀" value={linWeights[0]} min={-4} max={4} step={0.1} onChange={(v) => setLinWeights([v, linWeights[1], linWeights[2]])} format={(v) => v.toFixed(1)} />
          <Slider label="w₁" value={linWeights[1]} min={-4} max={4} step={0.1} onChange={(v) => setLinWeights([linWeights[0], v, linWeights[2]])} format={(v) => v.toFixed(1)} />
          <Slider label="w₂" value={linWeights[2]} min={-4} max={4} step={0.1} onChange={(v) => setLinWeights([linWeights[0], linWeights[1], v])} format={(v) => v.toFixed(1)} />
        </div>
      ),
      onAdvance: () => setLinWeights([0, 0, 0]),
    },
    {
      section: "2. Linear Boundary",
      title: "Which points are wrong?",
      body: (
        <p>
          Points ringed in red are misclassified by the current boundary — the model predicted the
          wrong side. Right now, with the flat 50/50 guess, that&rsquo;s about half of them.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    {
      section: "2. Linear Boundary",
      title: "Measuring how wrong: cross-entropy",
      body: (
        <p>
          <Term id="cross-entropy">Cross-entropy loss</Term> checks each point&rsquo;s predicted
          probability of its <em>correct</em> class against certainty:
          <Equation tex={"\\text{Loss} = -\\frac{1}{n}\\sum_{i=1}^{n}\\big[y_i\\log p_i + (1-y_i)\\log(1-p_i)\\big]"} />
          <Equation tex="y_i" display={false} /> is point <Equation tex="i" display={false} />&rsquo;s
          true label (0 or 1); <Equation tex="p_i" display={false} /> is the model&rsquo;s predicted
          probability that it&rsquo;s class 1. Right now, Loss ={" "}
          <span className="text-neutral-900 font-mono">{num(linModel.loss(basePoints), 4)}</span>,
          accuracy = <span className="text-neutral-900 font-mono">{pct(linModel.accuracy(basePoints))}</span>.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    {
      section: "2. Linear Boundary",
      title: "Our precise goal",
      body: (
        <p>
          Find <Equation tex="w_0, w_1, w_2" display={false} /> that make that loss as small as
          possible — in other words, tilt the plane so its 0.5 crossing separates the two colors
          as cleanly as it can.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    {
      section: "2. Linear Boundary",
      title: "The update rule",
      body: (
        <p>
          Exactly the same <Term id="gradient-descent">gradient descent</Term> rule as Regression
          — only the loss changed:
          <Equation tex={"w_i \\leftarrow w_i - \\eta \\, \\frac{\\partial \\, \\text{Loss}}{\\partial w_i}"} />
          <Equation tex={"\\eta"} display={false} /> is the{" "}
          <Term id="learning-rate">learning rate</Term>, fixed for now.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    {
      section: "2. Linear Boundary",
      title: "Take one real step",
      body: (
        <p>
          Click below to take one real gradient descent step and watch the boundary — and the
          plane — shift, just slightly.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
      controls: trainBtn("Take one gradient descent step", () => {
        setLinWeights(trainSteps(linModel, basePoints, 1));
      }),
      resetAction: () => setLinWeights([0, 0, 0]),
    },
    {
      section: "2. Linear Boundary",
      title: "Repeat, and watch it learn",
      body: (
        <p>
          Click below to run 150 steps. Watch the red-ringed (misclassified) points disappear as
          the boundary settles into place.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
      controls: trainBtn("Train 150 steps", () => {
        setLinWeights(trainSteps(linModel, basePoints, 150));
      }),
      resetAction: () => setLinWeights([0, 0, 0]),
      // The next two steps' narration asserts a specific, well-trained
      // result ("accuracy has flattened out at X%") — true only once
      // trained, so guarantee it regardless of whether the user clicked
      // the training buttons on this or the previous step.
      onAdvance: () => {
        if (linWeights.every((w) => w === 0)) {
          setLinWeights(trainSteps(new LogisticRegressor(1, 0, 1.2, [0, 0, 0]), basePoints, 150));
        }
      },
    },
    {
      section: "2. Linear Boundary",
      title: "The best a line can do",
      body: (
        <p>
          Accuracy has flattened out at{" "}
          <span className="text-neutral-900 font-mono">{pct(linModel.accuracy(basePoints))}</span> — a
          straight line simply can&rsquo;t curve around two interleaving crescents, no matter how
          it&rsquo;s angled.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    {
      section: "2. Linear Boundary",
      title: "A straight boundary has a hard limit",
      body: (
        <p>
          This isn&rsquo;t a training problem — more steps won&rsquo;t fix it. A straight line has
          no way to bend around the shape of this data. We need a model that&rsquo;s allowed to
          curve.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={linPredict} domain={DOMAIN} highlightErrors />,
      chart: <ProbabilitySurface3D domain={DOMAIN} predict={linPredict} />,
    },
    // ------------------- 3. A More Flexible Boundary --------------
    {
      section: "3. A More Flexible Boundary",
      title: "Same recipe, a curvier boundary",
      body: (
        <p>
          We expand the input into polynomial features{" "}
          <Equation tex={"\\phi(x) = (1, x_1, x_2, x_1^2, x_1 x_2, x_2^2, \\dots)"} />
          and score with <Equation tex="z = w \cdot \phi(x)" display={false} /> instead. Same loss,
          same update rule — just more weights, so the boundary can bend.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} />,
    },
    {
      section: "3. A More Flexible Boundary",
      title: "Starting from zero, again",
      body: <p>Same starting point: every weight at zero, so it&rsquo;s a flat 50/50 guess again.</p>,
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} />,
      onAdvance: () => setCubWeights(undefined),
    },
    {
      section: "3. A More Flexible Boundary",
      title: "Train it the same way",
      body: <p>Click below to run 300 gradient descent steps on this curvier model.</p>,
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} highlightErrors />,
      controls: trainBtn("Train 300 steps", () => {
        setCubWeights(trainSteps(cubModel, basePoints, 300));
      }),
      resetAction: () => setCubWeights(undefined),
      onAdvance: () => {
        if (!cubWeights) setCubWeights(trainSteps(new LogisticRegressor(3, 0, 1.2, undefined), basePoints, 300));
      },
    },
    {
      section: "3. A More Flexible Boundary",
      title: "How much better?",
      body: (
        <p>
          Accuracy jumped to{" "}
          <span className="text-neutral-900 font-mono">{pct(cubModel.accuracy(basePoints))}</span> —
          up from the straight line&rsquo;s ceiling. The boundary now curls around each crescent
          instead of slicing straight through both.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} highlightErrors />,
    },
    {
      section: "3. A More Flexible Boundary",
      title: "Why did more weights help so much?",
      body: (
        <p>
          <Equation tex="x_1^2" display={false} />, <Equation tex="x_1 x_2" display={false} />, and{" "}
          <Equation tex="x_2^2" display={false} /> let the boundary curve — a straight line can
          only tilt, but this model can wrap around a shape.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} />,
    },
    {
      section: "3. A More Flexible Boundary",
      title: "So more flexibility is always better... right?",
      body: (
        <p>
          If a few extra weights helped this much, surely even more would help even more? Let&rsquo;s
          find out — and discover why the answer isn&rsquo;t a simple &ldquo;yes&rdquo;.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} />,
    },
    // ------------------------ 4. Overfitting (subsection) ---------------
    {
      section: "4. Overfitting",
      title: "Let's push it further",
      body: <p>Here&rsquo;s the same idea at a much higher degree — a far more flexible boundary. Click to train it.</p>,
      visual: <DecisionBoundaryCanvas points={ofTrain} predict={ofPredict} domain={DOMAIN} highlightErrors />,
      chart: ofHistory.train.length > 0 ? <LossChart series={[{ label: "train loss", color: "#0891b2", values: ofHistory.train }]} height={100} /> : undefined,
      controls: trainBtn("Train 400 steps", () => {
        const w = trainSteps(ofModel, ofTrain, 400);
        setOfWeights(w);
        const m = new LogisticRegressor(ofDegree, 0, 1.2, w);
        setOfHistory((h) => ({ train: [...h.train, m.loss(ofTrain)].slice(-150), test: h.test }));
      }),
      resetAction: () => { setOfWeights(undefined); setOfHistory({ train: [], test: [] }); },
    },
    {
      section: "4. Overfitting",
      title: "Try it yourself: drag the degree",
      body: <p>Drag the degree slider, then retrain. Low degree can&rsquo;t bend enough; watch what happens as you push it higher.</p>,
      visual: <DecisionBoundaryCanvas points={ofTrain} predict={ofPredict} domain={DOMAIN} highlightErrors />,
      chart: <LossChart series={[{ label: "train loss", color: "#0891b2", values: ofHistory.train }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Polynomial degree" value={ofDegree} min={1} max={10} step={1} onChange={(v) => { setOfDegree(v); setOfWeights(undefined); setOfHistory({ train: [], test: [] }); }} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ofModel, ofTrain, 400);
            setOfWeights(w);
            const m = new LogisticRegressor(ofDegree, 0, 1.2, w);
            setOfHistory((h) => ({ train: [...h.train, m.loss(ofTrain)].slice(-150), test: h.test }));
          })}
        </div>
      ),
      resetAction: () => { setOfWeights(undefined); setOfHistory({ train: [], test: [] }); },
      onAdvance: () => {
        setOfDegree(9);
        setOfWeights(trainSteps(new LogisticRegressor(9, 0, 1.2, undefined), ofTrain, 400));
        setOfHistory({ train: [], test: [] });
      },
    },
    {
      section: "4. Overfitting",
      title: "The training accuracy looks incredible",
      body: (
        <p>
          Train accuracy is{" "}
          <span className="text-neutral-900 font-mono">{pct(ofModel.accuracy(ofTrain))}</span> — almost
          every training point classified correctly. Looks like a clean win.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={ofTrain} predict={ofPredict} domain={DOMAIN} highlightErrors />,
      chart: <LossChart series={[{ label: "train loss", color: "#0891b2", values: ofHistory.train }]} height={100} />,
    },
    {
      section: "4. Overfitting",
      title: "...but is it learning the shape?",
      body: (
        <p>
          Look closely at the heatmap — it snakes around individual points instead of tracing the
          two smooth crescents. It memorized these exact points rather than the general pattern.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={ofTrain} predict={ofPredict} domain={DOMAIN} />,
    },
    {
      section: "4. Overfitting",
      title: "The problem: we only checked what we trained on",
      body: (
        <p>
          To know whether it generalizes, we need to test it on points it has never seen — a{" "}
          <Term id="train-test-split">train/test split</Term>.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={ofTrain} predict={ofPredict} domain={DOMAIN} />,
    },
    {
      section: "4. Overfitting",
      title: "Try it yourself: hold out a test set",
      body: <p>Drag to set the train/test split (purple = train, orange-ringed = test), then retrain.</p>,
      visual: <DecisionBoundaryCanvas points={ofPoints} predict={ofPredict} domain={DOMAIN} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Train ratio" value={ofTrainRatio} min={0.3} max={0.9} step={0.05} onChange={(v) => { setOfTrainRatio(v); setOfWeights(undefined); setOfHistory({ train: [], test: [] }); }} format={(v) => pct(v)} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ofModel, ofTrain, 400);
            setOfWeights(w);
            const m = new LogisticRegressor(ofDegree, 0, 1.2, w);
            setOfHistory((h) => ({
              train: [...h.train, m.loss(ofTrain)].slice(-150),
              test: [...h.test, m.loss(ofTest)].slice(-150),
            }));
          })}
        </div>
      ),
      resetAction: () => { setOfWeights(undefined); setOfHistory({ train: [], test: [] }); },
      onAdvance: () => {
        setOfTrainRatio(0.7);
        const freshTrain = generateMoonsData(BASE_SEED, OF_N, OF_NOISE, 0.7).filter((p) => p.split === "train");
        setOfWeights(trainSteps(new LogisticRegressor(9, 0, 1.2, undefined), freshTrain, 400));
        setOfHistory({ train: [], test: [] });
      },
    },
    {
      section: "4. Overfitting",
      title: "Now compare train vs. test accuracy",
      body: (
        <p>
          Train accuracy is{" "}
          <span className="text-neutral-900 font-mono">{pct(ofModel.accuracy(ofTrain))}</span>, but test
          accuracy is only{" "}
          <span className="text-neutral-900 font-mono">{pct(ofModel.accuracy(ofTest))}</span>. Great on
          points it memorized, worse on points it didn&rsquo;t.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={ofPoints} predict={ofPredict} domain={DOMAIN} />,
      chart: (
        <LossChart
          series={[
            { label: "train loss", color: "#7c3aed", values: ofHistory.train },
            { label: "test loss", color: "#ea580c", values: ofHistory.test },
          ]}
          height={100}
        />
      ),
    },
    {
      section: "4. Overfitting",
      title: "That gap has a name",
      body: (
        <p>
          This is <Term id="overfitting">overfitting</Term>: great on training data, worse on new
          data, because the model latched onto quirks of these exact points instead of the general
          shape.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={ofPoints} predict={ofPredict} domain={DOMAIN} />,
    },
    {
      section: "4. Overfitting",
      title: "Degree is a dial, not a one-way switch",
      body: (
        <p>
          Too low a <Term id="polynomial-degree">degree</Term> and it can&rsquo;t bend enough
          (underfitting, back at the straight line). Too high and it bends to fit noise
          (overfitting, right here). Somewhere around degree 3 was the sweet spot for this data.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={ofPoints} predict={ofPredict} domain={DOMAIN} />,
    },
    // -------------------- 5. The Learning Rate Dial ----------------------
    {
      section: "5. The Learning Rate Dial",
      title: "One more knob: how big a step",
      body: (
        <p>
          The <Term id="learning-rate">learning rate</Term>{" "}
          <Equation tex={"\\eta"} display={false} /> controls how big each gradient descent update
          is. Let&rsquo;s see what happens when we change it.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={lrPredict} domain={DOMAIN} />,
    },
    {
      section: "5. The Learning Rate Dial",
      title: "Try it yourself: too small",
      body: <p>Set the learning rate very low (try 0.05) and train — progress will crawl.</p>,
      visual: <DecisionBoundaryCanvas points={basePoints} predict={lrPredict} domain={DOMAIN} highlightErrors />,
      controls: (
        <div className="space-y-3">
          <Slider label="Learning rate (η)" value={lrValue} min={0.05} max={4} step={0.05} onChange={setLrValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 50 steps", () => setLrWeights(trainSteps(lrModel, basePoints, 50)))}
        </div>
      ),
      resetAction: () => setLrWeights(undefined),
    },
    {
      section: "5. The Learning Rate Dial",
      title: "Try it yourself: too large",
      body: <p>Now push it high (try 3.5) and train — the boundary can jitter wildly instead of settling down.</p>,
      visual: <DecisionBoundaryCanvas points={basePoints} predict={lrPredict} domain={DOMAIN} highlightErrors />,
      controls: (
        <div className="space-y-3">
          <Slider label="Learning rate (η)" value={lrValue} min={0.05} max={4} step={0.05} onChange={setLrValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 50 steps", () => setLrWeights(trainSteps(lrModel, basePoints, 50)))}
        </div>
      ),
      resetAction: () => setLrWeights(undefined),
    },
    {
      section: "5. The Learning Rate Dial",
      title: "Finding the sweet spot",
      body: <p>Try values around 1–1.5 — accuracy should climb quickly and settle, without jittering.</p>,
      visual: <DecisionBoundaryCanvas points={basePoints} predict={lrPredict} domain={DOMAIN} highlightErrors />,
      controls: (
        <div className="space-y-3">
          <Slider label="Learning rate (η)" value={lrValue} min={0.05} max={4} step={0.05} onChange={setLrValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 50 steps", () => setLrWeights(trainSteps(lrModel, basePoints, 50)))}
        </div>
      ),
      resetAction: () => setLrWeights(undefined),
      onAdvance: () => { setLrValue(1.2); setLrWeights(undefined); },
    },
    // ------------------------- 6. Noisy Data -----------------------------
    {
      section: "6. Noisy Data",
      title: "Real data is never perfectly clean",
      body: <p>Every point so far had a little random scatter around its true crescent — that&rsquo;s noise.</p>,
      visual: <DecisionBoundaryCanvas points={noisePoints} predict={noisePredict} domain={DOMAIN} showBoundary={false} />,
    },
    {
      section: "6. Noisy Data",
      title: "Try it yourself: turn up the noise",
      body: <p>Drag the slider and watch the two crescents blur into each other.</p>,
      visual: <DecisionBoundaryCanvas points={noisePoints} predict={noisePredict} domain={DOMAIN} showBoundary={false} />,
      controls: <Slider label="Noise" value={noiseValue} min={0} max={0.4} step={0.02} onChange={(v) => { setNoiseValue(v); setNoiseWeights(undefined); }} format={(v) => v.toFixed(2)} />,
    },
    {
      section: "6. Noisy Data",
      title: "Noise makes overfitting worse",
      body: <p>Train this high-degree model on the noisy data — it bends to match the scatter, not just the shape.</p>,
      visual: <DecisionBoundaryCanvas points={noisePoints} predict={noisePredict} domain={DOMAIN} highlightErrors />,
      controls: trainBtn("Train 400 steps", () => setNoiseWeights(trainSteps(noiseModel, noisePoints, 400))),
      resetAction: () => setNoiseWeights(undefined),
      onAdvance: () => { setNoiseValue(0.15); setNoiseWeights(undefined); },
    },
    // -------------------- 7. How Much to Hold Out --------------------
    {
      section: "7. How Much to Hold Out",
      title: "Splitting data is a trade-off",
      body: <p>More training data usually fits better; more test data means a more trustworthy check. Every point goes to one side or the other.</p>,
      visual: <DecisionBoundaryCanvas points={ratioPoints} predict={ratioPredict} domain={DOMAIN} showBoundary={false} />,
    },
    {
      section: "7. How Much to Hold Out",
      title: "Try it yourself: adjust the split",
      body: <p>Drag the slider and watch the train/test counts shift.</p>,
      visual: <DecisionBoundaryCanvas points={ratioPoints} predict={ratioPredict} domain={DOMAIN} showBoundary={false} />,
      controls: (
        <div className="space-y-2">
          <Slider label="Train ratio" value={ratioValue} min={0.1} max={0.9} step={0.05} onChange={(v) => { setRatioValue(v); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); }} format={(v) => pct(v)} />
          <p className="text-xs text-neutral-500">{ratioTrain.length} train points · {ratioTest.length} test points</p>
        </div>
      ),
    },
    {
      section: "7. How Much to Hold Out",
      title: "Too little training data",
      body: <p>Set the ratio low (try 20%) and train — too few examples to learn the shape at all.</p>,
      visual: <DecisionBoundaryCanvas points={ratioPoints} predict={ratioPredict} domain={DOMAIN} highlightErrors />,
      chart: <LossChart series={[{ label: "train", color: "#7c3aed", values: ratioHistory.train }, { label: "test", color: "#ea580c", values: ratioHistory.test }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Train ratio" value={ratioValue} min={0.1} max={0.9} step={0.05} onChange={(v) => { setRatioValue(v); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); }} format={(v) => pct(v)} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ratioModel, ratioTrain, 400);
            setRatioWeights(w);
            const m = new LogisticRegressor(9, 0, 1.2, w);
            setRatioHistory((h) => ({ train: [...h.train, m.loss(ratioTrain)].slice(-150), test: [...h.test, m.loss(ratioTest)].slice(-150) }));
          })}
        </div>
      ),
      resetAction: () => { setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); },
    },
    {
      section: "7. How Much to Hold Out",
      title: "Too little test data",
      body: <p>Now set it high (try 90%) and train — with only a couple of test points left, test accuracy bounces around unreliably.</p>,
      visual: <DecisionBoundaryCanvas points={ratioPoints} predict={ratioPredict} domain={DOMAIN} highlightErrors />,
      chart: <LossChart series={[{ label: "train", color: "#7c3aed", values: ratioHistory.train }, { label: "test", color: "#ea580c", values: ratioHistory.test }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Train ratio" value={ratioValue} min={0.1} max={0.9} step={0.05} onChange={(v) => { setRatioValue(v); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); }} format={(v) => pct(v)} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ratioModel, ratioTrain, 400);
            setRatioWeights(w);
            const m = new LogisticRegressor(9, 0, 1.2, w);
            setRatioHistory((h) => ({ train: [...h.train, m.loss(ratioTrain)].slice(-150), test: [...h.test, m.loss(ratioTest)].slice(-150) }));
          })}
        </div>
      ),
      resetAction: () => { setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); },
      onAdvance: () => { setRatioValue(0.5); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); },
    },
    // -------------------- 8. L2 Regularization -----------------------
    {
      section: "8. L2 Regularization",
      title: "Another way to fight overfitting",
      body: <p>Besides degree and data split, we can change the loss itself to discourage huge weights.</p>,
      visual: <DecisionBoundaryCanvas points={regTrain} predict={regPredict} domain={DOMAIN} />,
    },
    {
      section: "8. L2 Regularization",
      title: "The idea: penalize large weights",
      body: (
        <p>
          <Term id="regularization">L2 regularization</Term> adds a penalty for big weights:
          <Equation tex={"\\text{Loss} = \\text{Cross-entropy} + \\lambda \\sum_i w_i^2"} />
          Large weights are what let the boundary wiggle wildly, so shrinking them smooths it out.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={regTrain} predict={regPredict} domain={DOMAIN} />,
    },
    {
      section: "8. L2 Regularization",
      title: "Try it yourself: turn up λ",
      body: <p>Train, then raise <Equation tex={"\\lambda"} display={false} /> and train again — watch the wild curves calm down.</p>,
      visual: <DecisionBoundaryCanvas points={regTrain} predict={regPredict} domain={DOMAIN} />,
      controls: (
        <div className="space-y-3">
          <Slider label="λ (regularization strength)" value={lambdaValue} min={0} max={0.5} step={0.01} onChange={setLambdaValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 400 steps", () => setRegWeights(trainSteps(regModel, regTrain, 400)))}
          <p className="text-xs text-neutral-500 font-mono">
            train acc {pct(regModel.accuracy(regTrain))} · test acc {pct(regModel.accuracy(regTest))}
          </p>
        </div>
      ),
      resetAction: () => setRegWeights(undefined),
    },
    {
      section: "8. L2 Regularization",
      title: "Too much regularization",
      body: <p>Push λ high (try 0.4) and train — the boundary flattens back toward a straight line, underfitting again.</p>,
      visual: <DecisionBoundaryCanvas points={regTrain} predict={regPredict} domain={DOMAIN} />,
      controls: (
        <div className="space-y-3">
          <Slider label="λ (regularization strength)" value={lambdaValue} min={0} max={0.5} step={0.01} onChange={setLambdaValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 400 steps", () => setRegWeights(trainSteps(regModel, regTrain, 400)))}
        </div>
      ),
      resetAction: () => setRegWeights(undefined),
      onAdvance: () => { setLambdaValue(0); setRegWeights(undefined); },
    },
    {
      section: "8. L2 Regularization",
      title: "Same four dials as Regression",
      body: (
        <p>
          <Term id="polynomial-degree">Degree</Term>, data split, noise, and{" "}
          <Term id="regularization">L2 regularization</Term> affect overfitting here exactly the
          way they did there — degree is the biggest lever, and regularization is the one dial
          that fights overfitting instead of causing it.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={regTrain} predict={regPredict} domain={DOMAIN} />,
    },
    // ---------------------------- 9. Wrap-up ------------------------------
    {
      section: "9. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A raw score <Equation tex="z" display={false} /> becomes a probability via the <Term id="sigmoid">sigmoid</Term>.</li>
            <li><Term id="cross-entropy">Cross-entropy loss</Term> measures how wrong the predicted probabilities are.</li>
            <li><Term id="gradient-descent">Gradient descent</Term> — the exact same update rule as Regression — reduces it.</li>
            <li>More flexible boundaries fit better, up to the point they <Term id="overfitting">overfit</Term>.</li>
            <li>A <Term id="train-test-split">train/test split</Term>, learning rate, noise, and L2 regularization all shape training the same way they did for Regression.</li>
          </ul>
        </div>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} />,
    },
    {
      section: "9. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything you just learned is now unlocked below as a free-play sandbox. Push the
          degree too high. Find a learning rate that jitters. See it for yourself.
        </p>
      ),
      visual: <DecisionBoundaryCanvas points={basePoints} predict={cubPredict} domain={DOMAIN} />,
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

      <div className="h-1 rounded-full bg-neutral-200 overflow-hidden">
        <div
          className="h-full bg-cyan-600 transition-all"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <div className="grid md:grid-cols-[420px_1fr] gap-6">
        <div className="space-y-3">
          {current.visual}
          {current.chart}
        </div>

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
                  ↺ Undo training on this step
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
