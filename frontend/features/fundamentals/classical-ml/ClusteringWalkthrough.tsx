"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Equation } from "@/components/Equation";
import { Term } from "@/components/Term";
import { generateBlobsData, type Point2D } from "./data";
import { initCentroids, kmeansStep } from "./models";
import { ClusteringPlot } from "./ClusteringPlot";
import { InertiaSurface3D } from "./InertiaSurface3D";
import { Slider } from "./Slider";

const DOMAIN = { xMin: -7, xMax: 7, yMin: -7, yMax: 7 };

function previewAssignment(centroids: Point2D[], points: Point2D[]) {
  const assignments = points.map((p) => {
    let best = 0;
    let bestDist = Infinity;
    centroids.forEach((c, i) => {
      const d = (p.x1 - c.x1) ** 2 + (p.x2 - c.x2) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  });
  const inertia = points.reduce((sum, p, i) => {
    const c = centroids[assignments[i]];
    return sum + (p.x1 - c.x1) ** 2 + (p.x2 - c.x2) ** 2;
  }, 0);
  return { assignments, inertia };
}

function runToConvergence(centroids: Point2D[], points: Point2D[], maxIter = 20) {
  let c = centroids;
  let assignments: number[] = [];
  let iteration = 0;
  const history: number[] = [];
  for (let i = 0; i < maxIter; i++) {
    const next = kmeansStep(c, points, iteration);
    history.push(next.inertia);
    const stable = assignments.length === next.assignments.length && assignments.every((a, j) => a === next.assignments[j]);
    c = next.centroids;
    assignments = next.assignments;
    iteration = next.iteration;
    if (stable) break;
  }
  return { centroids: c, assignments, iteration, history, inertia: history[history.length - 1] ?? 0 };
}

/** Small bar chart for inertia-vs-k (the "elbow" plot) — LossChart assumes
 * a sequential training-step x-axis, but this needs real k values labeled
 * on the x-axis, so it gets its own tiny chart. */
function ElbowChart({ data }: { data: { k: number; inertia: number }[] }) {
  const W = 420;
  const H = 150;
  const pad = { top: 10, right: 10, bottom: 26, left: 10 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const maxY = Math.max(1, ...data.map((d) => d.inertia));
  const barW = innerW / data.length;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto max-w-[420px] mx-auto block">
      {data.map((d, i) => {
        const h = (d.inertia / maxY) * innerH;
        const x = pad.left + i * barW;
        const y = pad.top + innerH - h;
        return (
          <g key={d.k}>
            <rect x={x + barW * 0.15} y={y} width={barW * 0.7} height={h} fill="#0891b2" rx={2} />
            <text x={x + barW / 2} y={pad.top + innerH + 14} fontSize={10} textAnchor="middle" fill="rgba(23,23,23,0.7)">
              {d.k}
            </text>
          </g>
        );
      })}
      <text x={pad.left + innerW / 2} y={H - 2} fontSize={10} textAnchor="middle" fill="rgba(23,23,23,0.75)">
        k
      </text>
    </svg>
  );
}

/** Clustering's counterpart to RegressionWalkthrough / ClassificationWalkthrough.
 * K-means has no gradient descent, loss function to differentiate, or
 * train/test split, so the arc is adapted rather than copied verbatim:
 * teach Lloyd's algorithm step by step, then two of k-means' own real
 * failure modes — picking the wrong k, and getting stuck depending on
 * where the centroids started — play the role Overfitting/Learning-Rate
 * played for the other two modules. */
export function ClusteringWalkthrough({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  // --- Lloyd's Algorithm sandbox ---
  const LLOYD_K = 3;
  const lloydPoints = useMemo(() => generateBlobsData(3, 45, LLOYD_K), []);
  const [lloydCentroids, setLloydCentroids] = useState<Point2D[]>(() => initCentroids(lloydPoints, LLOYD_K, 9));
  const [lloydAssignments, setLloydAssignments] = useState<number[]>([]);
  const [lloydIteration, setLloydIteration] = useState(0);
  const [lloydHistory, setLloydHistory] = useState<number[]>([]);
  const lloydPreview = useMemo(() => previewAssignment(lloydCentroids, lloydPoints), [lloydCentroids, lloydPoints]);
  const lloydDisplayAssignments = lloydAssignments.length > 0 ? lloydAssignments : lloydPreview.assignments;

  const lloydDefaults = () => initCentroids(lloydPoints, LLOYD_K, 9);
  const resetLloyd = () => {
    setLloydCentroids(lloydDefaults());
    setLloydAssignments([]);
    setLloydIteration(0);
    setLloydHistory([]);
  };
  const lloydOneIteration = () => {
    const next = kmeansStep(lloydCentroids, lloydPoints, lloydIteration);
    setLloydCentroids(next.centroids);
    setLloydAssignments(next.assignments);
    setLloydIteration(next.iteration);
    setLloydHistory((h) => [...h, next.inertia]);
  };
  const lloydRunAll = () => {
    const result = runToConvergence(lloydCentroids, lloydPoints);
    setLloydCentroids(result.centroids);
    setLloydAssignments(result.assignments);
    setLloydIteration(result.iteration);
    setLloydHistory((h) => [...h, ...result.history]);
  };

  // --- Choosing k sandbox ---
  const K_TRUE = 4;
  const kPoints = useMemo(() => generateBlobsData(5, 60, K_TRUE), []);
  const [kValue, setKValue] = useState(4);
  const [kCentroids, setKCentroids] = useState<Point2D[] | undefined>(undefined);
  const [kAssignments, setKAssignments] = useState<number[]>([]);
  const [elbowData, setElbowData] = useState<{ k: number; inertia: number }[]>([]);

  const kRunToConvergence = () => {
    const start = initCentroids(kPoints, kValue, 11);
    const result = runToConvergence(start, kPoints);
    setKCentroids(result.centroids);
    setKAssignments(result.assignments);
  };
  const resetK = () => {
    setKCentroids(undefined);
    setKAssignments([]);
  };
  const kDisplayCentroids = kCentroids ?? [];
  const computeElbow = () => {
    const data = Array.from({ length: 8 }, (_, i) => {
      const k = i + 1;
      const start = initCentroids(kPoints, k, 11);
      const result = runToConvergence(start, kPoints);
      return { k, inertia: result.inertia };
    });
    setElbowData(data);
  };

  // --- Initialization Matters sandbox ---
  const INIT_K = 5;
  const initPoints = useMemo(() => generateBlobsData(13, 70, INIT_K), []);
  const [initSeed, setInitSeed] = useState(1);
  const [initCentroidsState, setInitCentroidsState] = useState<Point2D[] | undefined>(undefined);
  const [initAssignments, setInitAssignments] = useState<number[]>([]);
  const [initHistory, setInitHistory] = useState<number[]>([]);

  const initRun = (seed: number) => {
    const start = initCentroids(initPoints, INIT_K, seed);
    const result = runToConvergence(start, initPoints);
    setInitCentroidsState(result.centroids);
    setInitAssignments(result.assignments);
    setInitHistory((h) => [...h, result.inertia].slice(-8));
  };
  const initReroll = () => {
    const seed = initSeed + 1;
    setInitSeed(seed);
    initRun(seed);
  };
  const resetInit = () => {
    setInitCentroidsState(undefined);
    setInitAssignments([]);
    setInitHistory([]);
  };
  const initDisplayCentroids = initCentroidsState ?? [];

  const num = (n: number, d = 2) => n.toFixed(d);

  const nextBtn = "px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-sm font-medium text-white";
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
      title: "Let's learn clustering together",
      body: (
        <p>
          One more model to go! This time there are no labels at all — just points, and the job
          is to find groups in them. Same pace as before: one small idea per step.
        </p>
      ),
      visual: <ClusteringPlot points={[]} centroids={[]} assignments={[]} />,
    },
    // ----------------------- 1. The Data ----------------------------
    {
      section: "1. The Data",
      title: "Here's what we're working with",
      body: (
        <p>
          Just points — no colors, no correct answer to check against. Our goal is to group
          points that sit close together, without ever being told what the groups are.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={[]} assignments={[]} />,
    },
    {
      section: "1. The Data",
      title: "This is different: unsupervised",
      body: (
        <p>
          Regression and classification are <em>supervised</em> — every point came with a right
          answer (a number, a class) to train against. Clustering is{" "}
          <em>unsupervised</em>: there&rsquo;s no right answer, only the shape of the data
          itself.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={[]} assignments={[]} />,
    },
    {
      section: "1. The Data",
      title: "Our plan",
      body: (
        <p>
          We&rsquo;ll learn <Term id="lloyds-algorithm">Lloyd&rsquo;s algorithm</Term> — the
          classic recipe behind k-means — one step at a time, then look at two ways it can go
          wrong: picking the wrong number of groups, and bad luck in where it starts.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={[]} assignments={[]} />,
    },
    // ------------------- 2. Lloyd's Algorithm (subsection) -----------------
    {
      section: "2. Lloyd's Algorithm",
      title: "The idea: centroids",
      body: (
        <p>
          A <Term id="centroid">centroid</Term> is just the average position of a group of
          points — its center of mass. k-means&rsquo; whole strategy is: guess some centroids,
          then improve the guess, over and over.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={[]} assignments={[]} />,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "Starting centroids: a random guess",
      body: (
        <p>
          We start by picking {LLOYD_K} random points to act as the first centroids (the ✕
          marks). There&rsquo;s no assignment yet — just a starting guess for where the group
          centers might be.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={[]} />,
      onAdvance: resetLloyd,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "Try it yourself: move a centroid",
      body: (
        <p>
          Drag the sliders to move the first centroid (✕) around by hand, and watch which points
          on the left would be assigned to it, and how the 3D surface&rsquo;s basin follows it
          on the right.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
      controls: (
        <div className="grid grid-cols-2 gap-3">
          <Slider label="centroid 1: x₁" value={lloydCentroids[0]?.x1 ?? 0} min={-6} max={6} step={0.2} onChange={(v) => setLloydCentroids((cs) => cs.map((c, i) => (i === 0 ? { ...c, x1: v } : c)))} format={(v) => v.toFixed(1)} />
          <Slider label="centroid 1: x₂" value={lloydCentroids[0]?.x2 ?? 0} min={-6} max={6} step={0.2} onChange={(v) => setLloydCentroids((cs) => cs.map((c, i) => (i === 0 ? { ...c, x2: v } : c)))} format={(v) => v.toFixed(1)} />
        </div>
      ),
      onAdvance: resetLloyd,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "Which centroid does each point get?",
      body: (
        <p>
          Every point is assigned to its <em>nearest</em> centroid — that&rsquo;s why the colors
          just appeared. Distance here means ordinary straight-line distance in the plane.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "Measuring badness: inertia",
      body: (
        <p>
          k-means&rsquo; objective, called <Term id="inertia">inertia</Term>, is the total
          squared distance from every point to its assigned centroid:
          <Equation tex={"J = \\sum_{i=1}^{n} \\lVert x_i - \\mu_{c(i)} \\rVert^2"} />
          <Equation tex={"\\mu_{c(i)}"} display={false} /> is the centroid point{" "}
          <Equation tex="i" display={false} /> was assigned to. Right now{" "}
          <Equation tex="J" display={false} /> ={" "}
          <span className="text-neutral-900 font-mono">{num(lloydPreview.inertia, 1)}</span> — and
          that number is exactly the total height of the surface on the right, summed over every
          point.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "Our precise goal",
      body: (
        <p>
          Find centroid positions that make inertia as small as possible — in other words, place
          each centroid at the bottom of its own basin.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "No gradient descent this time",
      body: (
        <p>
          Here&rsquo;s where clustering differs from Regression and Classification:{" "}
          <strong className="text-neutral-800 font-medium">there is no learning rate, no
          gradient</strong>. Instead, each centroid jumps straight to the exact mean of the
          points currently assigned to it:
          <Equation tex={"\\mu_k \\leftarrow \\frac{1}{|C_k|}\\sum_{x_i \\in C_k} x_i"} />
          One exact recalculation, not a small nudge.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "Take one real iteration",
      body: (
        <p>
          Click below to actually assign every point and move every centroid to its new mean —
          watch the basins on the right slide to follow.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
      controls: actionBtn("Assign + move centroids (1 iteration)", lloydOneIteration),
      resetAction: resetLloyd,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "Repeat until it stops changing",
      body: (
        <p>
          Training is just this same assign-then-move step, over and over. Click below to run it
          automatically until no point changes which centroid it&rsquo;s assigned to.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
      controls: actionBtn("Run until it converges", lloydRunAll),
      resetAction: resetLloyd,
      onAdvance: () => {
        if (lloydHistory.length === 0) lloydRunAll();
      },
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "What \"converged\" means",
      body: (
        <p>
          Inertia dropped to{" "}
          <span className="text-neutral-900 font-mono">{num(lloydHistory.at(-1) ?? 0, 1)}</span>{" "}
          after {lloydIteration} iterations and stopped changing — every centroid is now sitting
          exactly at the bottom of its own basin. That&rsquo;s convergence: the assign-then-move
          step can&rsquo;t improve inertia any further.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
    },
    {
      section: "2. Lloyd's Algorithm",
      title: "So... is that always the best grouping?",
      body: (
        <p>
          Not necessarily. Lloyd&rsquo;s algorithm guarantees inertia can&rsquo;t improve any
          <em>further</em> from here — it says nothing about whether a completely different
          starting point could have found something better. And we haven&rsquo;t even asked how
          many centroids to use. Both turn out to matter a lot.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
      chart: <InertiaSurface3D centroids={lloydCentroids} domain={DOMAIN} />,
    },
    // ------------------------ 3. Choosing k (subsection) ---------------
    {
      section: "3. Choosing k",
      title: "What if we pick the wrong k?",
      body: (
        <p>
          So far we told the algorithm exactly how many groups to look for. In practice, nobody
          hands you that number — you have to choose <Equation tex="k" display={false} /> yourself.
          This data actually has {K_TRUE} true groups. Let&rsquo;s see what happens when we
          guess wrong.
        </p>
      ),
      visual: <ClusteringPlot points={kPoints} centroids={kDisplayCentroids} assignments={kAssignments} />,
    },
    {
      section: "3. Choosing k",
      title: "Try it yourself: drag k",
      body: (
        <p>
          Set k below {K_TRUE} and run — two true groups get merged into one. Set it above{" "}
          {K_TRUE} — a single true group gets needlessly split in two. Both are visibly wrong,
          just in opposite directions.
        </p>
      ),
      visual: <ClusteringPlot points={kPoints} centroids={kDisplayCentroids} assignments={kAssignments} />,
      controls: (
        <div className="space-y-3">
          <Slider label="k (clusters to find)" value={kValue} min={1} max={8} step={1} onChange={(v) => { setKValue(v); resetK(); }} />
          {actionBtn("Run until it converges", kRunToConvergence)}
        </div>
      ),
      resetAction: resetK,
      onAdvance: () => { setKValue(K_TRUE); resetK(); },
    },
    {
      section: "3. Choosing k",
      title: "How do we know what k should be?",
      body: (
        <p>
          Since there&rsquo;s no labeled &ldquo;right answer&rdquo; to check against, we need a
          different kind of evidence. One standard tool: the{" "}
          <Term id="elbow-method">elbow method</Term>.
        </p>
      ),
      visual: <ClusteringPlot points={kPoints} centroids={kDisplayCentroids} assignments={kAssignments} />,
    },
    {
      section: "3. Choosing k",
      title: "The elbow method",
      body: (
        <p>
          Run k-means for every k from 1 to 8 and record the final inertia at each. Inertia
          always falls as k rises (more centroids can only help), but click below and watch
          where it stops falling <em>quickly</em>.
        </p>
      ),
      visual: <ClusteringPlot points={kPoints} centroids={kDisplayCentroids} assignments={kAssignments} />,
      chart: elbowData.length > 0 ? <ElbowChart data={elbowData} /> : undefined,
      controls: actionBtn("Compute inertia for k = 1..8", computeElbow),
      // The next step's narration describes the elbow chart's shape — make
      // sure it's actually been computed, regardless of whether the user
      // clicked the button above.
      onAdvance: () => {
        if (elbowData.length === 0) computeElbow();
      },
    },
    {
      section: "3. Choosing k",
      title: "Reading the elbow",
      body: (
        <p>
          Inertia drops sharply up to k = {K_TRUE}, then flattens out — each additional centroid
          past that buys almost nothing. That bend is the &ldquo;elbow,&rdquo; and it lands
          right on the true number of groups.
        </p>
      ),
      visual: <ClusteringPlot points={kPoints} centroids={kDisplayCentroids} assignments={kAssignments} />,
      chart: elbowData.length > 0 ? <ElbowChart data={elbowData} /> : undefined,
    },
    {
      section: "3. Choosing k",
      title: "k is a judgment call",
      body: (
        <p>
          The elbow method is a heuristic, not a guarantee — real data often doesn&rsquo;t have
          such a clean bend. It&rsquo;s one useful piece of evidence among several (another
          common one is called the silhouette score), not a formula that hands you the answer.
        </p>
      ),
      visual: <ClusteringPlot points={kPoints} centroids={kDisplayCentroids} assignments={kAssignments} />,
    },
    // -------------------- 4. Initialization Matters ----------------------
    {
      section: "4. Initialization Matters",
      title: "Same algorithm, different starting point",
      body: (
        <p>
          Lloyd&rsquo;s algorithm always improves inertia step by step until it stops — but
          &ldquo;stops improving&rdquo; and &ldquo;found the best possible grouping&rdquo; aren&rsquo;t
          the same thing. Where the centroids start can change where they end up.
        </p>
      ),
      visual: <ClusteringPlot points={initPoints} centroids={initDisplayCentroids} assignments={initAssignments} />,
    },
    {
      section: "4. Initialization Matters",
      title: "Try it yourself: re-roll the start",
      body: (
        <p>
          Click below a few times. Each click picks a fresh random starting point and runs to
          convergence. Watch the final inertia — and the grouping itself — change between runs.
        </p>
      ),
      visual: <ClusteringPlot points={initPoints} centroids={initDisplayCentroids} assignments={initAssignments} />,
      controls: (
        <div className="space-y-2">
          {actionBtn("🎲 New random start, run to convergence", initReroll)}
          {initHistory.length > 0 && (
            <p className="text-xs text-neutral-500 font-mono">
              inertia so far: {initHistory.map((v) => v.toFixed(0)).join(", ")}
            </p>
          )}
        </div>
      ),
      resetAction: resetInit,
    },
    {
      section: "4. Initialization Matters",
      title: "Sometimes it gets stuck",
      body: (
        <p>
          If you tried a few times, some runs likely landed on a noticeably higher final inertia
          than others — a <Term id="local-optimum">local optimum</Term> the algorithm couldn&rsquo;t
          escape from, even though a better grouping existed.
        </p>
      ),
      visual: <ClusteringPlot points={initPoints} centroids={initDisplayCentroids} assignments={initAssignments} />,
    },
    {
      section: "4. Initialization Matters",
      title: "Why this happens",
      body: (
        <p>
          Lloyd&rsquo;s algorithm only ever takes moves that help <em>right now</em>. If two
          centroids start crowded into the same true group while another true group gets none,
          assign-then-move alone often can&rsquo;t untangle that — every available move keeps
          things roughly where they are.
        </p>
      ),
      visual: <ClusteringPlot points={initPoints} centroids={initDisplayCentroids} assignments={initAssignments} />,
    },
    {
      section: "4. Initialization Matters",
      title: "A common fix: try multiple times",
      body: (
        <p>
          In practice, k-means is usually run several times from different random starts, keeping
          whichever run reached the lowest inertia. Real implementations (like{" "}
          <span className="text-neutral-800 font-medium">k-means++</span>) also use a smarter
          initialization that spreads the starting centroids out on purpose, making a bad
          starting point far less likely to begin with.
        </p>
      ),
      visual: <ClusteringPlot points={initPoints} centroids={initDisplayCentroids} assignments={initAssignments} />,
    },
    // ---------------------------- 5. Wrap-up ------------------------------
    {
      section: "5. Wrap-up",
      title: "What you just learned",
      body: (
        <div className="space-y-2">
          <p>A quick recap:</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-700">
            <li>Clustering is <em>unsupervised</em> — no labels, only the shape of the data.</li>
            <li>A <Term id="centroid">centroid</Term> is the mean position of its assigned points.</li>
            <li><Term id="inertia">Inertia</Term> measures how tightly points cluster around their centroids.</li>
            <li><Term id="lloyds-algorithm">Lloyd&rsquo;s algorithm</Term> alternates assign and move — no gradient descent needed.</li>
            <li>The <Term id="elbow-method">elbow method</Term> helps choose k when there&rsquo;s no labeled answer.</li>
            <li>Different starting points can converge to different <Term id="local-optimum">local optima</Term> — worth trying more than once.</li>
          </ul>
        </div>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
    },
    {
      section: "5. Wrap-up",
      title: "Now it's your turn",
      body: (
        <p>
          Everything you just learned is now unlocked below as a free-play sandbox. Set k way too
          high. Re-roll the start until you catch it getting stuck. See it for yourself.
        </p>
      ),
      visual: <ClusteringPlot points={lloydPoints} centroids={lloydCentroids} assignments={lloydDisplayAssignments} />,
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
                  ↺ Undo / reset this step
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
