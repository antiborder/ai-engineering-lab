import { ModulePlaceholder } from "@/components/ModulePlaceholder";

export const metadata = { title: "LLMOps — AI Engineering Lab" };

export default async function LlmOpsPage({ searchParams }: PageProps<"/llmops">) {
  const params = await searchParams;
  const isMonitorView = params.view === "monitor";
  return (
    <ModulePlaceholder
      label="LLMOps"
      href="/llmops"
      tagline="Run it in production: experiment tracking, CI/CD, deployment, monitoring, rollback."
      purpose={
        isMonitorView
          ? "Would show live monitoring for this artifact's deployment: requests, latency, errors, cost, evaluation score."
          : "Both a user-facing production lifecycle and the operational infrastructure the other modules rely on."
      }
      artifact={{
        artifactId: typeof params.artifactId === "string" ? params.artifactId : undefined,
        artifactName: typeof params.artifactName === "string" ? params.artifactName : undefined,
        artifactVersion: typeof params.artifactVersion === "string" ? params.artifactVersion : undefined,
      }}
    />
  );
}
