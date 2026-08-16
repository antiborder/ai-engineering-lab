const TONE_CLASSES = {
  default: { border: "border-neutral-800 bg-neutral-900", text: "text-neutral-100" },
  warn: { border: "border-amber-800 bg-amber-950/30", text: "text-amber-400" },
  good: { border: "border-emerald-800 bg-emerald-950/30", text: "text-emerald-400" },
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
