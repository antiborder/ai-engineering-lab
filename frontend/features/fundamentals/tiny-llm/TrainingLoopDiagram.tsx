const PURPLE = "#7c3aed";
const CYAN = "#0891b2";
const ORANGE = "#ea580c";
const NEUTRAL = "#a1a1aa";

/** Schematic "big picture" of one training step, mirroring
 * GenerationLoopDiagram's role in the Generating Text chapter: text goes
 * in, the model predicts, a loss comes out, and the loop feeds back into
 * itself — but here the loop updates the model's weights instead of the
 * token sequence. Matches tiny_llm_session.py's `train_steps()`: sample a
 * batch (`_sample_batch`), forward pass with targets (`self.model(x, y)`),
 * `loss.backward()`, `optimizer.step()`, repeat. */
export function TrainingLoopDiagram() {
  const width = 340;
  const height = 336;

  const boxX = 40;
  const boxW = 210;
  const midX = boxX + boxW / 2;
  const loopX = 300;

  const corpusY = 14;
  const corpusH = 32;

  const sampleY = corpusY + corpusH + 18; // 64
  const sampleH = 32;

  const modelY = sampleY + sampleH + 18; // 114
  const modelH = 32;

  const lossY = modelY + modelH + 18; // 164
  const lossH = 32;

  const backpropY = lossY + lossH + 18; // 214
  const backpropH = 32;

  const updateY = backpropY + backpropH + 18; // 264
  const updateH = 32;

  const arrow = (y1: number, y2: number) => (
    <>
      <line x1={midX} y1={y1} x2={midX} y2={y2 - 4} stroke={NEUTRAL} strokeWidth={2} />
      <polygon points={`${midX - 4},${y2 - 4} ${midX + 4},${y2 - 4} ${midX},${y2 + 2}`} fill={NEUTRAL} />
    </>
  );

  const box = (y: number, h: number, label: string, color: string, fill: string) => (
    <>
      <rect x={boxX} y={y} width={boxW} height={h} rx={6} fill={fill} stroke={color} strokeWidth={2} />
      <text x={midX} y={y + h / 2 + 4} fontSize={12} textAnchor="middle" fill="#3f3f46">
        {label}
      </text>
    </>
  );

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="bg-white rounded-md border border-neutral-200 w-full h-auto">
        {box(corpusY, corpusH, "Training text (corpus)", NEUTRAL, "rgba(161,161,170,0.12)")}
        {arrow(corpusY + corpusH, sampleY)}
        {box(sampleY, sampleH, "Sample input → target chunk", CYAN, "rgba(8,145,178,0.1)")}
        {arrow(sampleY + sampleH, modelY)}
        {box(modelY, modelH, "Model predicts next character", CYAN, "rgba(8,145,178,0.1)")}
        {arrow(modelY + modelH, lossY)}
        {box(lossY, lossH, "Loss: how wrong was it?", ORANGE, "rgba(234,88,12,0.1)")}
        {arrow(lossY + lossH, backpropY)}
        {box(backpropY, backpropH, "Backprop: compute gradients", PURPLE, "rgba(124,58,237,0.1)")}
        {arrow(backpropY + backpropH, updateY)}
        {box(updateY, updateH, "Update every weight a little", PURPLE, "rgba(124,58,237,0.1)")}

        <path
          d={`M ${boxX + boxW} ${updateY + updateH / 2} C ${loopX} ${updateY + updateH / 2}, ${loopX} ${sampleY + sampleH / 2}, ${boxX + boxW} ${sampleY + sampleH / 2}`}
          fill="none"
          stroke={ORANGE}
          strokeWidth={2}
        />
        <polygon
          points={`${boxX + boxW + 8},${sampleY + sampleH / 2 - 4} ${boxX + boxW + 8},${sampleY + sampleH / 2 + 4} ${boxX + boxW},${sampleY + sampleH / 2}`}
          fill={ORANGE}
        />
        <text
          x={loopX + 8}
          y={(updateY + updateH / 2 + sampleY + sampleH / 2) / 2}
          fontSize={12}
          textAnchor="middle"
          fill={ORANGE}
          transform={`rotate(90 ${loopX + 8} ${(updateY + updateH / 2 + sampleY + sampleH / 2) / 2})`}
        >
          repeat, thousands of times
        </text>
      </svg>
      <p className="text-xs text-neutral-500 mt-1 text-center">
        One trip around this loop is one training step. Everything in it — attention, the
        feed-forward network, layer norm — is exactly the mechanism from Transformers; only the
        weights were fixed there. Here they actually move.
      </p>
    </div>
  );
}
