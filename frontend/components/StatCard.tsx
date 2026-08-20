const TONE_CLASSES = {
  default: { border: "border-neutral-200 bg-white", text: "text-neutral-900" },
  warn: { border: "border-amber-300 bg-amber-50", text: "text-amber-800" },
  good: { border: "border-emerald-300 bg-emerald-50", text: "text-emerald-700" },
} as const;

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <div className={`rounded-md border px-3 py-2 ${t.border}`}>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`text-lg font-mono ${t.text}`}>{value}</div>
    </div>
  );
}
