"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Equation } from "@/components/Equation";
import { Term } from "@/components/Term";
import { generateRegressionData, type RegressionPoint } from "./data";
import { PolynomialRegressor } from "./models";
import { RegressionPlot } from "./RegressionPlot";
import { LossChart } from "./LossChart";
import { MSELandscape } from "./MSELandscape";
import { Slider } from "./Slider";

const BASE_SEED = 7;
const BASE_N = 16;
const BASE_NOISE = 0.15;

function trainSteps(model: PolynomialRegressor, points: RegressionPoint[], n: number): number[] {
  let w = model.weights;
  for (let i = 0; i < n; i++) {
    w = new PolynomialRegressor(model.degree, model.lambda, model.lr, w).nextWeights(points);
  }
  return w;
}

/** Same as trainSteps, but also returns every intermediate weight vector —
 * only used for the 2-weight linear model, to draw the actual path
 * gradient descent walked down the MSE landscape (not just start -> end). */
function trainStepsWithPath(model: PolynomialRegressor, points: RegressionPoint[], n: number): number[][] {
  let w = model.weights;
  const path: number[][] = [];
  for (let i = 0; i < n; i++) {
    w = new PolynomialRegressor(model.degree, model.lambda, model.lr, w).nextWeights(points);
    path.push(w);
  }
  return path;
}

/** ~55-step, chapter-structured teaching sequence for Regression. Unlike
 * RegressionGuide (the old flat 5-step version this replaces), each step
 * introduces one small idea, most carry their own interactive control
 * (slider or button), and steps are grouped into named subsections with a
 * chapter-style progress readout. Model/point state lives here, one useState
 * per subsection's little sandbox, so earlier subsections don't get
 * disturbed by sliders introduced later (e.g. the noise slider in "Noisy
 * Data" only ever touches that subsection's own dataset). */
export function RegressionWalkthrough({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  // Shared dataset used by "The Data", "Linear Model", "A More Flexible
  // Model", and "The Learning Rate Dial" — always fully train (trainRatio=1)
  // since the train/test split idea isn't introduced until "Overfitting".
  const basePoints = useMemo(() => generateRegressionData(BASE_SEED, BASE_N, BASE_NOISE, 1), []);

  // --- Linear Model sandbox ---
  const [linWeights, setLinWeights] = useState<number[]>([0, 0]);
  // Every [w0, w1] gradient descent has actually visited, in order — draws
  // the descent trail on the MSE landscape. Reset alongside linWeights.
  const [linPath, setLinPath] = useState<[number, number][]>([]);
  const linModel = useMemo(() => new PolynomialRegressor(1, 0, 0.5, linWeights), [linWeights]);

  // --- Cubic Model sandbox ---
  const [cubWeights, setCubWeights] = useState<number[]>([0, 0, 0, 0]);
  const [cubHistory, setCubHistory] = useState<number[]>([]);
  const cubModel = useMemo(() => new PolynomialRegressor(3, 0, 0.5, cubWeights), [cubWeights]);

  // --- Overfitting sandbox ---
  const [ofDegree, setOfDegree] = useState(9);
  const [ofWeights, setOfWeights] = useState<number[] | undefined>(undefined);
  const [ofTrainRatio, setOfTrainRatio] = useState(1);
  const [ofHistory, setOfHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });
  const ofPoints = useMemo(
    () => generateRegressionData(BASE_SEED, BASE_N, BASE_NOISE, ofTrainRatio),
    [ofTrainRatio]
  );
  const ofTrain = useMemo(() => ofPoints.filter((p) => p.split === "train"), [ofPoints]);
  const ofTest = useMemo(() => ofPoints.filter((p) => p.split === "test"), [ofPoints]);
  const ofModel = useMemo(
    () => new PolynomialRegressor(ofDegree, 0, 0.5, ofWeights ?? new Array(ofDegree + 1).fill(0)),
    [ofDegree, ofWeights]
  );

  // --- Learning Rate sandbox (reuses a fresh cubic model) ---
  const [lrValue, setLrValue] = useState(0.6);
  const [lrWeights, setLrWeights] = useState<number[]>([0, 0, 0, 0]);
  const [lrHistory, setLrHistory] = useState<number[]>([]);
  const lrModel = useMemo(() => new PolynomialRegressor(3, 0, lrValue, lrWeights), [lrValue, lrWeights]);

  // --- Noise sandbox ---
  const [noiseValue, setNoiseValue] = useState(0.15);
  const [noiseWeights, setNoiseWeights] = useState<number[] | undefined>(undefined);
  const noisePoints = useMemo(() => generateRegressionData(BASE_SEED, BASE_N, noiseValue, 1), [noiseValue]);
  const noiseModel = useMemo(
    () => new PolynomialRegressor(9, 0, 0.5, noiseWeights ?? new Array(10).fill(0)),
    [noiseWeights]
  );

  // --- Train Ratio sandbox ---
  const [ratioValue, setRatioValue] = useState(0.5);
  const ratioPoints = useMemo(() => generateRegressionData(BASE_SEED, BASE_N, BASE_NOISE, ratioValue), [ratioValue]);
  const ratioTrain = useMemo(() => ratioPoints.filter((p) => p.split === "train"), [ratioPoints]);
  const ratioTest = useMemo(() => ratioPoints.filter((p) => p.split === "test"), [ratioPoints]);
  const [ratioWeights, setRatioWeights] = useState<number[] | undefined>(undefined);
  const [ratioHistory, setRatioHistory] = useState<{ train: number[]; test: number[] }>({ train: [], test: [] });
  const ratioModel = useMemo(
    () => new PolynomialRegressor(9, 0, 0.5, ratioWeights ?? new Array(10).fill(0)),
    [ratioWeights]
  );

  // --- L2 Regularization sandbox ---
  const [lambdaValue, setLambdaValue] = useState(0);
  const [regWeights, setRegWeights] = useState<number[] | undefined>(undefined);
  const regPoints = useMemo(() => generateRegressionData(BASE_SEED, BASE_N, BASE_NOISE, 0.7), []);
  const regTrain = useMemo(() => regPoints.filter((p) => p.split === "train"), [regPoints]);
  const regTest = useMemo(() => regPoints.filter((p) => p.split === "test"), [regPoints]);
  const regModel = useMemo(
    () => new PolynomialRegressor(9, lambdaValue, 0.5, regWeights ?? new Array(10).fill(0)),
    [lambdaValue, regWeights]
  );

  const num = (n: number, d = 3) => n.toFixed(d);

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
      title: "Let's learn regression together",
      body: (
        <p>
          Hi! I&rsquo;ll be your guide through <span className="text-neutral-800 font-medium">regression</span> —
          teaching a model to predict a number. We&rsquo;ll go slowly, one small idea at a time, and you&rsquo;ll
          get to try things yourself along the way. There&rsquo;s no rush — click{" "}
          <span className="text-neutral-700">Next</span> whenever you&rsquo;re ready.
        </p>
      ),
      visual: <RegressionPlot points={[]} model={linModel} showTrueFn={false} showCurve={false} />,
    },
    // ----------------------- 1. The Data ----------------------------
    {
      section: "1. The Data",
      title: "Here's what we're working with",
      body: (
        <p>
          These dots are our data: each one is a pair of numbers, an input <Equation tex="x" display={false} />{" "}
          and an output <Equation tex="y" display={false} />. Our goal is to draw a single curve that follows
          this pattern as closely as possible — one that could predict <Equation tex="y" display={false} /> for
          an <Equation tex="x" display={false} /> we haven&rsquo;t even seen yet.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showCurve={false} />,
    },
    {
      section: "1. The Data",
      title: "What do the axes mean?",
      body: (
        <p>
          Think of <Equation tex="x" display={false} /> as anything you can measure or set — a time, a
          setting, a position — and <Equation tex="y" display={false} /> as the number you&rsquo;d like to
          predict from it. The actual meaning doesn&rsquo;t matter for how we&rsquo;ll solve this: the technique
          works the same regardless of what <Equation tex="x" display={false} /> and{" "}
          <Equation tex="y" display={false} /> represent.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showCurve={false} />,
    },
    {
      section: "1. The Data",
      title: "Our plan",
      body: (
        <p>
          We&rsquo;ll start with the simplest possible curve — a straight line — and teach it to fit this
          data using an algorithm called <Term id="gradient-descent">gradient descent</Term>. Once you&rsquo;ve
          seen how that works, we&rsquo;ll reuse the exact same recipe on curvier models and explore what can
          go right, and wrong, along the way.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showCurve={false} />,
    },
    // ------------------- 2. Linear Model (subsection) -----------------
    {
      section: "2. Linear Model",
      title: "Our first model: a straight line",
      body: (
        <p>
          A straight line is controlled by just two numbers, which we&rsquo;ll call{" "}
          <Equation tex="w_0" display={false} /> and <Equation tex="w_1" display={false} />:
          <Equation tex={"\\hat{y} = w_0 + w_1 x"} />
          Given an <Equation tex="x" display={false} />, the model&rsquo;s prediction is{" "}
          <Equation tex="\hat{y}" display={false} />. We call <Equation tex="w_0" display={false} /> and{" "}
          <Equation tex="w_1" display={false} /> the model&rsquo;s <Term id="weights">weights</Term>.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} />,
      chart: (
        <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />
      ),
    },
    {
      section: "2. Linear Model",
      title: "What each weight does",
      body: (
        <p>
          <Equation tex="w_0" display={false} /> slides the whole line up or down — it&rsquo;s the value of{" "}
          <Equation tex="\hat{y}" display={false} /> when <Equation tex="x=0" display={false} />.{" "}
          <Equation tex="w_1" display={false} /> tilts the line — how much{" "}
          <Equation tex="\hat{y}" display={false} /> changes for each step <Equation tex="x" display={false} />{" "}
          moves right. Together they can place the line anywhere, at any angle. Every possible{" "}
          <Equation tex="(w_0, w_1)" display={false} /> pair is one point on the landscape to the right — its
          height is how well that line fits the data.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
    },
    {
      section: "2. Linear Model",
      title: "Starting from zero",
      body: (
        <p>
          Right now <Equation tex="w_0 = 0" display={false} /> and <Equation tex="w_1 = 0" display={false} />,
          so <Equation tex="\hat{y} = 0" display={false} /> no matter what{" "}
          <Equation tex="x" display={false} /> is — that&rsquo;s the flat line you see. Every model has to
          start somewhere; ours starts knowing nothing at all.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
      onAdvance: () => { setLinWeights([0, 0]); setLinPath([]); },
    },
    {
      section: "2. Linear Model",
      title: "Try it yourself: move the line",
      body: (
        <p>
          Before we let the computer learn, get a feel for the two weights yourself. Drag the sliders below
          and watch how <Equation tex="w_0" display={false} /> and <Equation tex="w_1" display={false} /> change
          the line — and where that puts you on the MSE landscape on the right. Every point on that surface is
          one possible line; the height is how bad it is.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
      controls: (
        <div className="grid grid-cols-2 gap-4">
          <Slider label="w₀ (intercept)" value={linWeights[0]} min={-2} max={2} step={0.05} onChange={(v) => setLinWeights([v, linWeights[1]])} format={(v) => v.toFixed(2)} />
          <Slider label="w₁ (slope)" value={linWeights[1]} min={-2} max={2} step={0.05} onChange={(v) => setLinWeights([linWeights[0], v])} format={(v) => v.toFixed(2)} />
        </div>
      ),
      onAdvance: () => { setLinWeights([0, 0]); setLinPath([]); },
    },
    {
      section: "2. Linear Model",
      title: "How wrong is one prediction?",
      body: (
        <p>
          For any point, the <span className="text-neutral-800 font-medium">error</span> is the gap between
          what the model predicts and the real value — shown here as red lines. We&rsquo;d like every one of
          these gaps to be as small as possible.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showErrors />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
    },
    {
      section: "2. Linear Model",
      title: "Averaging all the errors: MSE",
      body: (
        <p>
          To judge the whole line at once, not just one point, we square every error (so misses in either
          direction count as positive, and big misses count extra) and average them. This is called{" "}
          <Term id="mse">Mean Squared Error</Term>:
          <Equation tex={"\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^{n} (\\hat{y}_i - y_i)^2"} />
          Right now, with the flat line, MSE ={" "}
          <span className="text-neutral-900 font-mono">{num(linModel.loss(basePoints), 4)}</span>. That single
          number is exactly the <em>height</em> of the landscape on the right, at the point{" "}
          <Equation tex="(w_0, w_1)" display={false} /> we&rsquo;re currently standing on.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showErrors />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
    },
    {
      section: "2. Linear Model",
      title: "Our precise goal",
      body: (
        <p>
          Now we can say exactly what we&rsquo;re after: find the values of{" "}
          <Equation tex="w_0" display={false} /> and <Equation tex="w_1" display={false} /> that make{" "}
          <Term id="mse">MSE</Term> as small as possible — in other words, find the lowest point in that
          landscape. That&rsquo;s the entire job of training.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showErrors />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
    },
    {
      section: "2. Linear Model",
      title: "Which way should a weight move?",
      body: (
        <p>
          For each weight, we can ask: if I nudge it up slightly, does MSE go up or down? That direction —
          and how steep it is — is called the <Term id="gradient">gradient</Term>. If nudging{" "}
          <Equation tex="w_1" display={false} /> up would increase MSE, we should move it down instead, and
          vice versa. Geometrically: feel which way the landscape slopes downhill from where we&rsquo;re
          standing, and step that way.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showErrors />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
    },
    {
      section: "2. Linear Model",
      title: "The update rule",
      body: (
        <p>
          <Term id="gradient-descent">Gradient descent</Term> turns that idea into a repeatable formula —
          every weight, every step:
          <Equation tex={"w_i \\leftarrow w_i - \\eta \\, \\frac{\\partial \\, \\text{MSE}}{\\partial w_i}"} />
          <Equation tex={"\\eta"} display={false} /> is the <Term id="learning-rate">learning rate</Term> — how
          big a step to take. We&rsquo;ll explore that dial later; for now it&rsquo;s fixed at a sensible value.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showErrors />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} />,
    },
    {
      section: "2. Linear Model",
      title: "Take one real step",
      body: (
        <p>
          Let&rsquo;s actually do it. Click the button and watch both weights update once using the rule above
          — the line will nudge slightly toward the data, and the yellow dot will take one visible step
          downhill on the landscape.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showErrors />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} path={linPath} />,
      controls: trainBtn("Take one gradient descent step", () => {
        const path = trainStepsWithPath(linModel, basePoints, 1);
        const w = path[path.length - 1];
        setLinWeights(w);
        setLinPath((p) => [...p, [w[0], w[1]]]);
      }),
      resetAction: () => { setLinWeights([0, 0]); setLinPath([]); },
    },
    {
      section: "2. Linear Model",
      title: "Repeat, and watch it learn",
      body: (
        <p>
          One step barely moves the line. Training is just this same update, over and over — each repetition
          is one <Term id="epoch">step</Term>. Click below to run 150 steps and watch the dot walk all the way
          down into the valley.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn={false} showErrors />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} path={linPath} />,
      controls: trainBtn("Train 150 steps", () => {
        const path = trainStepsWithPath(linModel, basePoints, 150);
        const w = path[path.length - 1];
        setLinWeights(w);
        setLinPath((p) => [...p, ...path.map((pt) => [pt[0], pt[1]] as [number, number])]);
      }),
      resetAction: () => { setLinWeights([0, 0]); setLinPath([]); },
    },
    {
      section: "2. Linear Model",
      title: "The best a line can do",
      body: (
        <p>
          MSE has flattened out — this line is about as good as a straight line gets, at{" "}
          <span className="text-neutral-900 font-mono">{num(linModel.loss(basePoints), 4)}</span>. The yellow
          trail on the landscape shows the whole path gradient descent walked to get here, settling at the
          bottom of the valley. The dashed curve on the left shows the true underlying pattern the data came
          from — notice the line can&rsquo;t follow its bends.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} path={linPath} />,
    },
    {
      section: "2. Linear Model",
      title: "A straight line has a hard limit",
      body: (
        <p>
          This isn&rsquo;t a training problem — no amount of extra steps will fix it. Gradient descent already
          found the bottom of this valley; there is no lower point to walk to. A straight line simply cannot
          bend, so it can never match a curve that rises and falls like this one does. To do better, we need a
          model that&rsquo;s allowed to curve.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={linModel} showTrueFn />,
      chart: <MSELandscape points={basePoints} current={[linWeights[0], linWeights[1]]} path={linPath} />,
    },
    // ------------------- 3. A More Flexible Model (cubic) --------------
    {
      section: "3. A More Flexible Model",
      title: "Same recipe, a curvier model",
      body: (
        <p>
          Let&rsquo;s add two more terms, <Equation tex="x^2" display={false} /> and{" "}
          <Equation tex="x^3" display={false} />, each with its own weight:
          <Equation tex={"\\hat{y} = w_0 + w_1 x + w_2 x^2 + w_3 x^3"} />
          That&rsquo;s the only change. <Term id="mse">MSE</Term>,{" "}
          <Term id="gradient-descent">gradient descent</Term>, the update rule — all identical to before.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} showTrueFn={false} />,
    },
    {
      section: "3. A More Flexible Model",
      title: "Starting from zero, again",
      body: (
        <p>
          Same starting point as last time: all four weights at zero, so the model predicts a flat line
          until it&rsquo;s trained.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} showTrueFn={false} />,
      onAdvance: () => setCubWeights([0, 0, 0, 0]),
    },
    {
      section: "3. A More Flexible Model",
      title: "Train it the same way",
      body: (
        <p>
          Since the technique is identical, let&rsquo;s skip straight to training. Click below to run 300
          gradient descent steps on this degree-3 model.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} showTrueFn={false} />,
      chart: cubHistory.length > 0 ? <LossChart series={[{ label: "MSE", color: "#0891b2", values: cubHistory }]} height={100} /> : undefined,
      controls: trainBtn("Train 300 steps", () => {
        const w = trainSteps(cubModel, basePoints, 300);
        setCubWeights(w);
        setCubHistory((h) => [...h, new PolynomialRegressor(3, 0, 0.5, w).loss(basePoints)].slice(-150));
      }),
      resetAction: () => { setCubWeights([0, 0, 0, 0]); setCubHistory([]); },
      // The next step's narration asserts the cubic curve now fits clearly
      // better than the line — true only once trained, so guarantee it
      // regardless of whether the user clicked the button above.
      onAdvance: () => {
        if (cubWeights.every((w) => w === 0)) {
          const fresh = new PolynomialRegressor(3, 0, 0.5, [0, 0, 0, 0]);
          setCubWeights(trainSteps(fresh, basePoints, 300));
        }
      },
    },
    {
      section: "3. A More Flexible Model",
      title: "Compare: the old line vs. the new curve",
      body: (
        <p>
          The dashed purple curve is our earlier straight-line fit; the solid cyan curve is this new
          degree-3 model. Notice how much closer the solid curve hugs the data, especially where it rises
          and falls.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} compareModel={linModel} showTrueFn={false} />,
    },
    {
      section: "3. A More Flexible Model",
      title: "Why two extra numbers helped so much",
      body: (
        <p>
          <Equation tex="x^2" display={false} /> and <Equation tex="x^3" display={false} /> let the curve
          bend — a straight line can only tilt, but this model can curve up, then down, then up again. More
          weights means more shapes the model is capable of drawing.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} showTrueFn />,
      chart: <LossChart series={[{ label: "MSE", color: "#0891b2", values: cubHistory }]} height={100} />,
    },
    {
      section: "3. A More Flexible Model",
      title: "So more flexibility is always better... right?",
      body: (
        <p>
          If two extra weights helped this much, surely adding even more would help even more? Let&rsquo;s
          find out — and discover why the answer is more interesting than a simple &ldquo;yes&rdquo;.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} showTrueFn />,
    },
    // ------------------------ 4. Overfitting (subsection) ---------------
    {
      section: "4. Overfitting",
      title: "Let's push it further",
      body: (
        <p>
          Here&rsquo;s the same idea with degree 9 instead of degree 3 — ten weights instead of four,
          controlling a much curvier model. Click below to train it on the same data.
        </p>
      ),
      visual: <RegressionPlot points={ofTrain} model={ofModel} showTrueFn={false} />,
      chart: ofHistory.train.length > 0 ? <LossChart series={[{ label: "train MSE", color: "#0891b2", values: ofHistory.train }]} height={100} /> : undefined,
      controls: trainBtn("Train 400 steps", () => {
        const w = trainSteps(ofModel, ofTrain, 400);
        setOfWeights(w);
        const m = new PolynomialRegressor(ofDegree, 0, 0.5, w);
        setOfHistory((h) => ({ train: [...h.train, m.loss(ofTrain)].slice(-150), test: h.test }));
      }),
      resetAction: () => { setOfWeights(undefined); setOfHistory({ train: [], test: [] }); },
    },
    {
      section: "4. Overfitting",
      title: "Try it yourself: drag the degree",
      body: (
        <p>
          Drag the slider to change the polynomial&rsquo;s degree, then retrain. Low degree can&rsquo;t bend
          enough (<em>underfitting</em>); watch what happens as you push it higher.
        </p>
      ),
      visual: <RegressionPlot points={ofTrain} model={ofModel} showTrueFn={false} />,
      chart: <LossChart series={[{ label: "train MSE", color: "#0891b2", values: ofHistory.train }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Polynomial degree" value={ofDegree} min={1} max={10} step={1} onChange={(v) => { setOfDegree(v); setOfWeights(undefined); setOfHistory({ train: [], test: [] }); }} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ofModel, ofTrain, 400);
            setOfWeights(w);
            const m = new PolynomialRegressor(ofDegree, 0, 0.5, w);
            setOfHistory((h) => ({ train: [...h.train, m.loss(ofTrain)].slice(-150), test: h.test }));
          })}
        </div>
      ),
      resetAction: () => { setOfWeights(undefined); setOfHistory({ train: [], test: [] }); },
      // However the user left the slider/training button, the next step's
      // narration asserts a specific, well-trained degree-9 result — so
      // force that state directly rather than trusting whatever `ofModel`
      // happens to be (untrained after a slider drag, or a different degree).
      onAdvance: () => {
        setOfDegree(9);
        const fresh = new PolynomialRegressor(9, 0, 0.5, new Array(10).fill(0));
        setOfWeights(trainSteps(fresh, ofTrain, 400));
        setOfHistory({ train: [], test: [] });
      },
    },
    {
      section: "4. Overfitting",
      title: "The training error looks incredible",
      body: (
        <p>
          At degree 9, the training MSE is{" "}
          <span className="text-neutral-900 font-mono">{num(ofModel.loss(ofTrain), 4)}</span> — much lower
          than the degree-3 model ever reached. It looks like a clear win.
        </p>
      ),
      visual: <RegressionPlot points={ofTrain} model={ofModel} showTrueFn={false} />,
      chart: <LossChart series={[{ label: "train MSE", color: "#0891b2", values: ofHistory.train }]} height={100} />,
    },
    {
      section: "4. Overfitting",
      title: "...but is it learning the pattern?",
      body: (
        <p>
          Compare the curve against the true function (dashed). Between the data points, it wiggles wildly
          — it&rsquo;s threading itself exactly through every training point, noise included, instead of
          following the smooth pattern underneath.
        </p>
      ),
      visual: <RegressionPlot points={ofTrain} model={ofModel} showTrueFn />,
    },
    {
      section: "4. Overfitting",
      title: "The problem: we only checked what we trained on",
      body: (
        <p>
          A model that has <em>memorized</em> its training points will always look perfect on those exact
          points. To find out whether it actually learned anything general, we need to test it on data it
          has never seen — a <Term id="train-test-split">train/test split</Term>.
        </p>
      ),
      visual: <RegressionPlot points={ofTrain} model={ofModel} showTrueFn />,
    },
    {
      section: "4. Overfitting",
      title: "Try it yourself: hold out a test set",
      body: (
        <p>
          Drag the slider to set what fraction of points are used for training (purple) versus held back for
          testing (orange), then retrain the degree-9 model.
        </p>
      ),
      visual: <RegressionPlot points={ofPoints} model={ofModel} showTrueFn={false} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Train ratio" value={ofTrainRatio} min={0.3} max={0.9} step={0.05} onChange={(v) => { setOfTrainRatio(v); setOfWeights(undefined); setOfHistory({ train: [], test: [] }); }} format={(v) => `${Math.round(v * 100)}%`} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ofModel, ofTrain, 400);
            setOfWeights(w);
            const m = new PolynomialRegressor(ofDegree, 0, 0.5, w);
            setOfHistory((h) => ({
              train: [...h.train, m.loss(ofTrain)].slice(-150),
              test: [...h.test, m.loss(ofTest)].slice(-150),
            }));
          })}
        </div>
      ),
      resetAction: () => { setOfWeights(undefined); setOfHistory({ train: [], test: [] }); },
      // Same reasoning as the degree slider above: force a properly-trained
      // degree-9 model at the 70/30 split the next two steps' narration
      // assumes, regardless of what the user left the slider/button at.
      onAdvance: () => {
        setOfDegree(9);
        setOfTrainRatio(0.7);
        const freshTrain = generateRegressionData(BASE_SEED, BASE_N, BASE_NOISE, 0.7).filter((p) => p.split === "train");
        const fresh = new PolynomialRegressor(9, 0, 0.5, new Array(10).fill(0));
        setOfWeights(trainSteps(fresh, freshTrain, 400));
        setOfHistory({ train: [], test: [] });
      },
    },
    {
      section: "4. Overfitting",
      title: "Now compare train vs. test error",
      body: (
        <p>
          Train MSE is <span className="text-neutral-900 font-mono">{num(ofModel.loss(ofTrain), 4)}</span>,
          but test MSE is <span className="text-neutral-900 font-mono">{num(ofModel.loss(ofTest), 4)}</span> —
          much higher. The model does great on points it memorized and poorly on points it didn&rsquo;t.
        </p>
      ),
      visual: <RegressionPlot points={ofPoints} model={ofModel} showTrueFn />,
      chart: (
        <LossChart
          series={[
            { label: "train", color: "#7c3aed", values: ofHistory.train },
            { label: "test", color: "#ea580c", values: ofHistory.test },
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
          This is <Term id="overfitting">overfitting</Term>: the model got very good at the training data
          but worse at new data, because it started fitting the noise and quirks specific to those exact
          points instead of the general pattern.
        </p>
      ),
      visual: <RegressionPlot points={ofPoints} model={ofModel} showTrueFn />,
      chart: (
        <LossChart
          series={[
            { label: "train", color: "#7c3aed", values: ofHistory.train },
            { label: "test", color: "#ea580c", values: ofHistory.test },
          ]}
          height={100}
        />
      ),
    },
    {
      section: "4. Overfitting",
      title: "Degree is a dial, not a one-way switch",
      body: (
        <p>
          Too low a <Term id="polynomial-degree">degree</Term> and the model can&rsquo;t bend enough
          (underfitting, back in &ldquo;Linear Model&rdquo;). Too high and it bends to fit noise
          (overfitting, right here). Somewhere in between — around degree 3 for this data — is the sweet
          spot.
        </p>
      ),
      visual: <RegressionPlot points={ofPoints} model={ofModel} showTrueFn />,
    },
    // -------------------- 5. The Learning Rate Dial ----------------------
    {
      section: "5. The Learning Rate Dial",
      title: "One more knob: how big a step",
      body: (
        <p>
          Back in &ldquo;Linear Model&rdquo; we fixed <Equation tex={"\\eta"} display={false} />, the{" "}
          <Term id="learning-rate">learning rate</Term>, without exploring it. It controls how big a jump
          each gradient descent update takes. Let&rsquo;s see what happens when we change it.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={lrModel} showTrueFn={false} />,
    },
    {
      section: "5. The Learning Rate Dial",
      title: "Try it yourself: too small",
      body: (
        <p>
          Set the learning rate very low (try 0.02) and train. Notice how little the loss moves — each step
          is so cautious that training crawls.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={lrModel} showTrueFn={false} />,
      chart: <LossChart series={[{ label: "MSE", color: "#0891b2", values: lrHistory }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Learning rate (η)" value={lrValue} min={0.02} max={2.5} step={0.02} onChange={setLrValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 50 steps", () => {
            const w = trainSteps(lrModel, basePoints, 50);
            setLrWeights(w);
            setLrHistory((h) => [...h, new PolynomialRegressor(3, 0, lrValue, w).loss(basePoints)].slice(-150));
          })}
        </div>
      ),
      resetAction: () => { setLrWeights([0, 0, 0, 0]); setLrHistory([]); },
    },
    {
      section: "5. The Learning Rate Dial",
      title: "Try it yourself: too large",
      body: (
        <p>
          Now push it high (try 2.2) and train again. Watch the loss chart — instead of settling down, it
          can bounce around or even shoot upward. A step that&rsquo;s too big overshoots the bottom of the
          valley and lands somewhere worse.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={lrModel} showTrueFn={false} />,
      chart: <LossChart series={[{ label: "MSE", color: "#0891b2", values: lrHistory }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Learning rate (η)" value={lrValue} min={0.02} max={2.5} step={0.02} onChange={setLrValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 50 steps", () => {
            const w = trainSteps(lrModel, basePoints, 50);
            setLrWeights(w);
            setLrHistory((h) => [...h, new PolynomialRegressor(3, 0, lrValue, w).loss(basePoints)].slice(-150));
          })}
        </div>
      ),
      resetAction: () => { setLrWeights([0, 0, 0, 0]); setLrHistory([]); },
    },
    {
      section: "5. The Learning Rate Dial",
      title: "Finding the sweet spot",
      body: (
        <p>
          Try values around 0.3–0.8 and train — loss should drop quickly and settle smoothly, without
          bouncing. There&rsquo;s rarely one &ldquo;correct&rdquo; learning rate; it&rsquo;s usually found by
          trying a few values, just like you did.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={lrModel} showTrueFn={false} />,
      chart: <LossChart series={[{ label: "MSE", color: "#0891b2", values: lrHistory }]} height={100} />,
      controls: (
        <div className="space-y-3">
          <Slider label="Learning rate (η)" value={lrValue} min={0.02} max={2.5} step={0.02} onChange={setLrValue} format={(v) => v.toFixed(2)} />
          {trainBtn("Train 50 steps", () => {
            const w = trainSteps(lrModel, basePoints, 50);
            setLrWeights(w);
            setLrHistory((h) => [...h, new PolynomialRegressor(3, 0, lrValue, w).loss(basePoints)].slice(-150));
          })}
        </div>
      ),
      resetAction: () => { setLrWeights([0, 0, 0, 0]); setLrHistory([]); },
      onAdvance: () => { setLrValue(0.6); setLrWeights([0, 0, 0, 0]); setLrHistory([]); },
    },
    // ------------------------- 6. Noisy Data -----------------------------
    {
      section: "6. Noisy Data",
      title: "Real data is never perfectly clean",
      body: (
        <p>
          Every point we&rsquo;ve used so far had a bit of random scatter added around the true curve —
          that&rsquo;s <span className="text-neutral-800 font-medium">noise</span>, and real-world
          measurements almost always have some.
        </p>
      ),
      visual: <RegressionPlot points={noisePoints} model={noiseModel} showTrueFn showCurve={false} />,
    },
    {
      section: "6. Noisy Data",
      title: "Try it yourself: turn up the noise",
      body: (
        <p>
          Drag the slider to add more scatter to the data and watch the points spread further from the true
          curve (dashed).
        </p>
      ),
      visual: <RegressionPlot points={noisePoints} model={noiseModel} showTrueFn showCurve={false} />,
      controls: (
        <Slider label="Noise" value={noiseValue} min={0} max={0.5} step={0.02} onChange={(v) => { setNoiseValue(v); setNoiseWeights(undefined); }} format={(v) => v.toFixed(2)} />
      ),
    },
    {
      section: "6. Noisy Data",
      title: "Noise makes overfitting worse",
      body: (
        <p>
          Train this degree-9 model on the noisy data — it will bend itself to match the scatter, not just
          the shape. More noise gives it more misleading detail to memorize, so the same degree overfits
          harder than it did on cleaner data.
        </p>
      ),
      visual: <RegressionPlot points={noisePoints} model={noiseModel} showTrueFn />,
      controls: trainBtn("Train 400 steps", () => {
        const w = trainSteps(noiseModel, noisePoints, 400);
        setNoiseWeights(w);
      }),
      resetAction: () => setNoiseWeights(undefined),
    },
    {
      section: "6. Noisy Data",
      title: "Noise is why testing matters",
      body: (
        <p>
          Because we can&rsquo;t remove noise from real data, we can&rsquo;t just trust training error —
          it&rsquo;s exactly why the train/test split and, as we&rsquo;ll see next, keeping weights small
          both matter so much.
        </p>
      ),
      visual: <RegressionPlot points={noisePoints} model={noiseModel} showTrueFn />,
      onAdvance: () => { setNoiseValue(0.15); setNoiseWeights(undefined); },
    },
    // ------------------------- 7. How Much to Hold Out --------------------
    {
      section: "7. How Much to Hold Out",
      title: "Splitting data is a trade-off",
      body: (
        <p>
          More training data usually means a better-fit model. More test data means a more trustworthy
          estimate of how well it generalizes. Every point given to one side is a point taken from the
          other.
        </p>
      ),
      visual: <RegressionPlot points={ratioPoints} model={ratioModel} showTrueFn={false} showCurve={false} />,
    },
    {
      section: "7. How Much to Hold Out",
      title: "Try it yourself: adjust the split",
      body: (
        <p>
          Drag the slider — purple points are train, orange are test. Watch the counts shift as you move
          it.
        </p>
      ),
      visual: <RegressionPlot points={ratioPoints} model={ratioModel} showTrueFn={false} showCurve={false} />,
      controls: (
        <div className="space-y-2">
          <Slider label="Train ratio" value={ratioValue} min={0.1} max={0.9} step={0.05} onChange={(v) => { setRatioValue(v); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); }} format={(v) => `${Math.round(v * 100)}%`} />
          <p className="text-xs text-neutral-500">{ratioTrain.length} train points · {ratioTest.length} test points</p>
        </div>
      ),
    },
    {
      section: "7. How Much to Hold Out",
      title: "Too little training data",
      body: (
        <p>
          Set the ratio low (try 20%) and train. With so few examples, the model can barely learn the shape
          at all — there just isn&rsquo;t enough signal to work with.
        </p>
      ),
      visual: <RegressionPlot points={ratioPoints} model={ratioModel} showTrueFn />,
      chart: (
        <LossChart series={[{ label: "train", color: "#7c3aed", values: ratioHistory.train }, { label: "test", color: "#ea580c", values: ratioHistory.test }]} height={100} />
      ),
      controls: (
        <div className="space-y-3">
          <Slider label="Train ratio" value={ratioValue} min={0.1} max={0.9} step={0.05} onChange={(v) => { setRatioValue(v); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); }} format={(v) => `${Math.round(v * 100)}%`} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ratioModel, ratioTrain, 400);
            setRatioWeights(w);
            const m = new PolynomialRegressor(9, 0, 0.5, w);
            setRatioHistory((h) => ({ train: [...h.train, m.loss(ratioTrain)].slice(-150), test: [...h.test, m.loss(ratioTest)].slice(-150) }));
          })}
        </div>
      ),
      resetAction: () => { setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); },
    },
    {
      section: "7. How Much to Hold Out",
      title: "Too little test data",
      body: (
        <p>
          Now set the ratio high (try 90%) and train. The fit can look great, but with only a couple of test
          points left, the test MSE bounces around a lot depending on which specific points happened to be
          held out — it&rsquo;s no longer a reliable estimate.
        </p>
      ),
      visual: <RegressionPlot points={ratioPoints} model={ratioModel} showTrueFn />,
      chart: (
        <LossChart series={[{ label: "train", color: "#7c3aed", values: ratioHistory.train }, { label: "test", color: "#ea580c", values: ratioHistory.test }]} height={100} />
      ),
      controls: (
        <div className="space-y-3">
          <Slider label="Train ratio" value={ratioValue} min={0.1} max={0.9} step={0.05} onChange={(v) => { setRatioValue(v); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); }} format={(v) => `${Math.round(v * 100)}%`} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(ratioModel, ratioTrain, 400);
            setRatioWeights(w);
            const m = new PolynomialRegressor(9, 0, 0.5, w);
            setRatioHistory((h) => ({ train: [...h.train, m.loss(ratioTrain)].slice(-150), test: [...h.test, m.loss(ratioTest)].slice(-150) }));
          })}
        </div>
      ),
      resetAction: () => { setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); },
    },
    {
      section: "7. How Much to Hold Out",
      title: "A common default",
      body: (
        <p>
          In practice, 70/30 or 80/20 (train/test) is a common starting point — enough data to learn from,
          enough held back to trust the evaluation. Like the learning rate, the right split depends on how
          much data you actually have.
        </p>
      ),
      visual: <RegressionPlot points={ratioPoints} model={ratioModel} showTrueFn />,
      onAdvance: () => { setRatioValue(0.5); setRatioWeights(undefined); setRatioHistory({ train: [], test: [] }); },
    },
    // -------------------- 8. Taming the Wiggles: L2 -----------------------
    {
      section: "8. L2 Regularization",
      title: "Another way to fight overfitting",
      body: (
        <p>
          So far we&rsquo;ve fought overfitting by changing the degree or the data split. There&rsquo;s a
          third way: change the loss itself so that huge, wiggly weights are directly discouraged.
        </p>
      ),
      visual: <RegressionPlot points={regTrain} model={regModel} showTrueFn={false} />,
    },
    {
      section: "8. L2 Regularization",
      title: "The idea: penalize large weights",
      body: (
        <p>
          <Term id="regularization">L2 regularization</Term> adds a penalty term to the loss, proportional
          to the size of the weights:
          <Equation tex={"\\text{Loss} = \\text{MSE} + \\lambda \\sum_i w_i^2"} />
          <Equation tex={"\\lambda"} display={false} /> controls how strongly big weights are punished.
          Large weights are exactly what let a curve wiggle wildly, so shrinking them smooths the curve out.
        </p>
      ),
      visual: <RegressionPlot points={regTrain} model={regModel} showTrueFn={false} />,
    },
    {
      section: "8. L2 Regularization",
      title: "Try it yourself: turn up λ",
      body: (
        <p>
          This is the same degree-9 model from &ldquo;Overfitting&rdquo;. Train it, then raise{" "}
          <Equation tex={"\\lambda"} display={false} /> and train again — watch the wild wiggles calm down
          even though the degree hasn&rsquo;t changed.
        </p>
      ),
      visual: <RegressionPlot points={regTrain} model={regModel} showTrueFn />,
      controls: (
        <div className="space-y-3">
          <Slider label="λ (regularization strength)" value={lambdaValue} min={0} max={0.05} step={0.001} onChange={setLambdaValue} format={(v) => v.toFixed(3)} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(regModel, regTrain, 400);
            setRegWeights(w);
          })}
          <p className="text-xs text-neutral-500 font-mono">
            train MSE {num(regModel.loss(regTrain), 4)} · test MSE {num(regModel.loss(regTest), 4)}
          </p>
        </div>
      ),
      resetAction: () => setRegWeights(undefined),
    },
    {
      section: "8. L2 Regularization",
      title: "Too much regularization",
      body: (
        <p>
          Push <Equation tex={"\\lambda"} display={false} /> high (try 0.04) and train. The penalty
          dominates, weights get squashed toward zero, and the curve flattens back toward a straight line —
          underfitting again, just reached from a different direction.
        </p>
      ),
      visual: <RegressionPlot points={regTrain} model={regModel} showTrueFn />,
      controls: (
        <div className="space-y-3">
          <Slider label="λ (regularization strength)" value={lambdaValue} min={0} max={0.05} step={0.001} onChange={setLambdaValue} format={(v) => v.toFixed(3)} />
          {trainBtn("Train 400 steps", () => {
            const w = trainSteps(regModel, regTrain, 400);
            setRegWeights(w);
          })}
        </div>
      ),
      resetAction: () => setRegWeights(undefined),
    },
    {
      section: "8. L2 Regularization",
      title: "What actually causes overfitting most?",
      body: (
        <div className="space-y-2">
          <p>Ranking the four knobs we&rsquo;ve explored, from biggest overfitting risk to smallest:</p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-700">
            <li><Term id="polynomial-degree">Polynomial degree</Term> — directly sets how much the model is capable of wiggling. The single biggest lever.</li>
            <li>Too little training data (a low train ratio) — few points are trivial for a flexible model to memorize outright.</li>
            <li>Noise — gives the model misleading detail to latch onto, but only bites once there&rsquo;s enough capacity (degree) to fit it.</li>
            <li><Term id="regularization">L2 regularization</Term> — the odd one out: turning it <em>up</em> fights overfitting rather than causing it.</li>
          </ol>
        </div>
      ),
      visual: <RegressionPlot points={regTrain} model={regModel} showTrueFn />,
      onAdvance: () => { setLambdaValue(0); setRegWeights(undefined); },
    },
    // ---------------------------- 9. Wrap-up ------------------------------
    {
      section: "9. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>A model predicts <Equation tex="\hat{y}" display={false} /> from <Equation tex="x" display={false} /> using weights.</li>
            <li><Term id="mse">MSE</Term> measures how wrong those predictions are.</li>
            <li><Term id="gradient-descent">Gradient descent</Term> repeatedly nudges the weights to lower it.</li>
            <li>More flexible models (higher <Term id="polynomial-degree">degree</Term>) fit better — up to a point, past which they <Term id="overfitting">overfit</Term>.</li>
            <li>A <Term id="train-test-split">train/test split</Term> reveals overfitting that training error alone hides.</li>
            <li>The <Term id="learning-rate">learning rate</Term>, noise, and <Term id="regularization">L2 regularization</Term> are all dials that shape how training behaves.</li>
          </ul>
        </div>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} compareModel={linModel} showTrueFn />,
    },
    {
      section: "9. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          You&rsquo;ve seen every idea Regression has to offer, one step at a time. Below, a free-play
          version of everything you just learned is now unlocked — no more guided steps, just the sliders
          and controls, all in one place. Go make it overfit on purpose. Go find a learning rate that
          explodes. It&rsquo;s yours to break.
        </p>
      ),
      visual: <RegressionPlot points={basePoints} model={cubModel} showTrueFn />,
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
          <button
            onClick={goNext}
            className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white"
          >
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
