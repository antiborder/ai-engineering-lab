import { Breadcrumbs } from "@/components/Breadcrumbs";
import { QuantizationLab } from "@/features/inference/quantization/QuantizationLab";

export const metadata = { title: "Quantization" };

export default function QuantizationPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Inference", href: "/inference" }, { label: "Quantization" }]} />
      <h1 className="text-2xl font-semibold mb-1">Quantization</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Trading precision for memory and speed — the same model, stored with fewer bits per
        number, and what that costs in output quality.
      </p>
      <QuantizationLab />
    </div>
  );
}
