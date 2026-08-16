import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "Evaluation — AI Engineering Lab" };

export default async function EvaluationPage({ searchParams }: PageProps<"/evaluation">) {
  const params = await searchParams;
  return (
    <ModulePlaceholder
      label="Evaluation"
      href="/evaluation"
      tagline="Measure whether an AI system actually works."
      purpose="Datasets, LLM-as-judge, model comparison, RAG evaluation, regression testing — operating on artifacts created in GenAI Systems."
      artifact={{
        artifactId: typeof params.artifactId === "string" ? params.artifactId : undefined,
        artifactName: typeof params.artifactName === "string" ? params.artifactName : undefined,
        artifactVersion: typeof params.artifactVersion === "string" ? params.artifactVersion : undefined,
      }}
    />
  );
}
