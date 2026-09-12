export type PipelineStageId = "artifact" | "dataset" | "run" | "evaluation" | "score" | "comparison";

const DIM = 0.22;

/** The evaluation pipeline drawn as a real flowchart, not six equal
 * pills: Run, Evaluation, and Comparison are the actual operations
 * (boxes). Artifact and Dataset are the two inputs Run needs (drawn as
 * pills merging into it); Score is the number Evaluation hands to
 * Comparison (drawn as a pill on that arrow, not a box of its own) —
 * data flowing between steps, not steps themselves. Reused across
 * Chapter 2's Steps with different `highlight` sets — same dim/highlight
 * technique every other reused diagram in this app uses, so a reader
 * recognizes the same picture zooming in on a different part of itself
 * each time. */
export function PipelineDiagram({ highlight }: { highlight?: PipelineStageId[] }) {
  const noHighlight = !highlight || highlight.length === 0;
  const active = (id: PipelineStageId) => noHighlight || highlight!.includes(id);
  const op = (id: PipelineStageId) => (active(id) ? 1 : DIM);

  const width = 280;
  const height = 250;

  const boxW = 116;
  const boxX = (width - boxW) / 2;
  const boxH = 32;
  const centerX = width / 2;

  const runY = 54;
  const evalY = 132;
  const compY = 210;

  const pillW = 84;
  const pillH = 24;
  const artifactX = 12;
  const datasetX = width - pillW - 12;
  const pillY = 4;

  const scoreW = 62;
  const scoreH = 22;
  const scoreY = (evalY + boxH + compY) / 2 - scoreH / 2;

  const box = (id: PipelineStageId, y: number, label: string) => (
    <g opacity={op(id)}>
      <rect x={boxX} y={y} width={boxW} height={boxH} rx={6} fill="rgba(234,88,12,0.08)" stroke="#ea580c" strokeWidth={1.5} />
      <text x={centerX} y={y + boxH / 2 + 4} fontSize={15} textAnchor="middle" fontWeight={600} fill="#3f3f46">
        {label}
      </text>
    </g>
  );

  const pill = (id: PipelineStageId, x: number, y: number, w: number, h: number, label: string) => (
    <g opacity={op(id)}>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="rgba(8,145,178,0.08)" stroke="#0891b2" strokeWidth={1.5} />
      <text x={x + w / 2} y={y + h / 2 + 4} fontSize={15} textAnchor="middle" fontWeight={600} fill="#0e7490">
        {label}
      </text>
    </g>
  );

  return (
    <div className="w-full max-w-72 mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {pill("artifact", artifactX, pillY, pillW, pillH, "Artifact")}
        {pill("dataset", datasetX, pillY, pillW, pillH, "Dataset")}

        <path
          d={`M ${artifactX + pillW / 2} ${pillY + pillH} L ${boxX + 22} ${runY}`}
          stroke="#a3a3a3"
          strokeWidth={1.5}
          fill="none"
          opacity={Math.min(op("artifact"), op("run"))}
        />
        <path
          d={`M ${datasetX + pillW / 2} ${pillY + pillH} L ${boxX + boxW - 22} ${runY}`}
          stroke="#a3a3a3"
          strokeWidth={1.5}
          fill="none"
          opacity={Math.min(op("dataset"), op("run"))}
        />

        {box("run", runY, "Run")}

        <line x1={centerX} y1={runY + boxH} x2={centerX} y2={evalY - 4} stroke="#a3a3a3" strokeWidth={1.5} opacity={Math.min(op("run"), op("evaluation"))} />
        <polygon points={`${centerX - 4},${evalY - 4} ${centerX + 4},${evalY - 4} ${centerX},${evalY + 2}`} fill="#a3a3a3" opacity={op("evaluation")} />

        {box("evaluation", evalY, "Evaluation")}

        <line x1={centerX} y1={evalY + boxH} x2={centerX} y2={compY - 4} stroke="#a3a3a3" strokeWidth={1.5} opacity={Math.min(op("evaluation"), op("comparison"))} />
        <polygon points={`${centerX - 4},${compY - 4} ${centerX + 4},${compY - 4} ${centerX},${compY + 2}`} fill="#a3a3a3" opacity={op("comparison")} />
        {pill("score", centerX - scoreW / 2, scoreY, scoreW, scoreH, "Score")}

        {box("comparison", compY, "Comparison")}
      </svg>
    </div>
  );
}
