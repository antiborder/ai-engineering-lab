import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GpuLab } from "@/features/inference/gpu/GpuLab";

export const metadata = { title: "GPU" };

export default function GpuPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Inference", href: "/inference" }, { label: "GPU" }]} />
      <h1 className="text-2xl font-semibold mb-1">GPU</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Why GPUs, not CPUs, actually run these models, and why GPU memory — not just speed — is
        the real limit on what you can serve.
      </p>
      <GpuLab />
    </div>
  );
}
