import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NeuralNetworkLab } from "@/features/fundamentals/neural-networks/NeuralNetworkLabClientOnly";

export const metadata = { title: "Neural Networks — AI Engineering Lab" };

export default function NeuralNetworksPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Fundamentals", href: "/fundamentals" }, { label: "Neural Networks" }]} />
      <h1 className="text-2xl font-semibold mb-1">Neural Networks</h1>
      <p className="text-neutral-400 mb-8 max-w-2xl">
        Same dataset as Classification, same gradient-descent loop — but now the model is a
        stack of neurons instead of one polynomial. Change the architecture and watch the
        network diagram: edge color is weight sign, edge thickness is weight magnitude, and
        node brightness is how strongly each neuron activates on average.
      </p>
      <NeuralNetworkLab />
    </div>
  );
}
