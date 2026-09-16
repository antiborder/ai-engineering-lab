import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Inference" };

const UNITS = [
  {
    href: "/inference/model-serving",
    label: "Model Serving",
    description: "Why serving is a different problem from training, and the path every request follows.",
    live: true,
  },
  {
    href: "/inference/gpu",
    label: "GPU",
    description: "Why GPUs, not CPUs, and why GPU memory is the real constraint on what you can serve.",
    live: true,
  },
  {
    href: "/inference/vllm",
    label: "vLLM",
    description: "The serving engine that combines scheduling, continuous batching, KV cache, and GPU memory management.",
    live: true,
  },
  {
    href: "/inference/continuous-batching",
    label: "Continuous Batching",
    description: "Keeping the GPU busy by slotting new requests in as others finish, instead of waiting for a full batch.",
    live: true,
  },
  {
    href: "/inference/quantization",
    label: "Quantization",
    description: "Trading precision for memory and speed — FP16 vs. INT8 vs. INT4.",
    live: true,
  },
  {
    href: "/inference/performance",
    label: "Performance",
    description: "Latency, throughput, and time to first token, read together — then used to decide hosted API vs. self-hosted.",
    live: true,
  },
];

export default async function InferencePage({ searchParams }: PageProps<"/inference">) {
  const params = await searchParams;
  const artifactName = typeof params.artifactName === "string" ? params.artifactName : undefined;
  const artifactVersion = typeof params.artifactVersion === "string" ? params.artifactVersion : undefined;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Inference" }]} />
      <h1 className="text-2xl font-semibold mb-1">Inference</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Serve a model efficiently: the request path, the GPU underneath it, vLLM, continuous
        batching, quantization, and performance and the hosted-vs-self-hosted decision —
        operating on artifacts created in GenAI Systems.
      </p>

      {artifactName && (
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-4 max-w-2xl mb-6">
          <p className="text-base text-cyan-700">
            Selected artifact: <span className="font-mono">{artifactName} {artifactVersion}</span>
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {UNITS.map((s) =>
          s.live ? (
            <Link
              key={s.href}
              href={s.href}
              className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400 transition-colors"
            >
              <div className="font-medium text-neutral-900">{s.label}</div>
              <p className="text-base text-neutral-600 mt-1">{s.description}</p>
            </Link>
          ) : (
            <div
              key={s.href}
              className="rounded-lg border border-dashed border-neutral-200 p-4"
            >
              <div className="flex items-center gap-2">
                <div className="font-medium text-neutral-500">{s.label}</div>
                <span className="text-sm uppercase tracking-wide text-neutral-400 border border-neutral-200 rounded px-1.5 py-0.5">
                  Coming soon
                </span>
              </div>
              <p className="text-base text-neutral-400 mt-1">{s.description}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
