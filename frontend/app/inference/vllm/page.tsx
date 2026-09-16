import { Breadcrumbs } from "@/components/Breadcrumbs";
import { VllmLab } from "@/features/inference/vllm/VllmLab";

export const metadata = { title: "vLLM" };

export default function VllmPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Inference", href: "/inference" }, { label: "vLLM" }]} />
      <h1 className="text-2xl font-semibold mb-1">vLLM</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Why a naive server wastes GPU memory and time, and three of the real tricks — PagedAttention,
        prefix caching, and speculative decoding — that let vLLM serve far more traffic on the
        same hardware.
      </p>
      <VllmLab />
    </div>
  );
}
