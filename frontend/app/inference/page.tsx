import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Inference — AI Engineering Lab" };

export default async function InferencePage({ searchParams }: PageProps<"/inference">) {
  const params = await searchParams;
  return (
    <ModulePlaceholder
      label="Inference"
      href="/inference"
      tagline="Serve models efficiently: vLLM, KV cache, continuous batching, quantization."
      purpose="Benchmark and select inference configurations for an artifact before deployment."
      artifact={{
        artifactId: typeof params.artifactId === "string" ? params.artifactId : undefined,
        artifactName: typeof params.artifactName === "string" ? params.artifactName : undefined,
        artifactVersion: typeof params.artifactVersion === "string" ? params.artifactVersion : undefined,
      }}
    />
  );
}
