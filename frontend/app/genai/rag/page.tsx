import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RagLab } from "@/features/genai/rag/RagLab";

export const metadata = { title: "RAG — AI Engineering Lab" };

export default function RagPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "GenAI Systems", href: "/genai" }, { label: "RAG" }]} />
      <h1 className="text-2xl font-semibold mb-1">RAG</h1>
      <p className="text-neutral-600 mb-8 max-w-2xl">
        Ask a question, watch retrieval find the relevant chunks by real vector similarity (not
        fabricated scores), and see how chunk size, overlap, top-K, and reranking change what
        the model sees. Save it as an AI Artifact when you&rsquo;re happy with it — that&rsquo;s
        what flows into Evaluation, Inference, and LLMOps next. Requires the backend to be
        running.
      </p>
      <RagLab />
    </div>
  );
}
