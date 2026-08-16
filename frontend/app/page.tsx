import Link from "next/link";
import { MODULES } from "@/lib/modules";

const LIFECYCLE = ["Build", "Evaluate", "Optimize", "Deploy", "Monitor", "Improve"];

export default function Home() {
  return (
    <div>
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl font-semibold mb-3">AI Engineering Lab</h1>
        <p className="text-neutral-400">
          One integrated lab, five connected modules. Everything you build shares a single{" "}
          <strong className="text-neutral-200 font-medium">AI Artifact</strong> lifecycle — build
          it, evaluate it, optimize it, deploy it, monitor it, and improve it, all on the same
          system.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-14 text-sm">
        {LIFECYCLE.map((stage, i) => (
          <div key={stage} className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300">
              {stage}
            </span>
            {i < LIFECYCLE.length - 1 && <span className="text-neutral-700">→</span>}
          </div>
        ))}
        <span className="text-neutral-700">↺</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((module, i) => (
          <Link
            key={module.id}
            href={`/${module.slug}`}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 hover:border-neutral-600 transition-colors"
          >
            <div className="text-xs text-neutral-500 mb-1">
              {i + 1}. {module.lifecycleStage}
            </div>
            <div className="font-medium text-neutral-100">{module.label}</div>
            <p className="text-sm text-neutral-400 mt-1">{module.tagline}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
