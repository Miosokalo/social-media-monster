import { clsx } from "clsx";

type Tone = "indigo" | "emerald" | "amber";

const toneBar: Record<Tone, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

export function MetricBar({
  label,
  percent,
  tone = "indigo",
  className,
}: {
  label: string;
  percent: number;
  tone?: Tone;
  className?: string;
}) {
  const w = Math.min(100, Math.max(0, percent));
  return (
    <div className={clsx("flex min-w-0 flex-1 flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2 text-[11px] leading-none text-zinc-500">
        <span className="truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-zinc-300">{w.toFixed(0)}%</span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-zinc-800/90"
        role="progressbar"
        aria-valuenow={Math.round(w)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${w.toFixed(0)} Prozent genutzt`}
      >
        <div
          className={clsx("h-full rounded-full transition-[width]", toneBar[tone])}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  );
}
