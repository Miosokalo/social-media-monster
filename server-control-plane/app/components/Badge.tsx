import { clsx } from "clsx";
import type { CiTone } from "@/lib/ci-status";

const toneClass: Record<CiTone, string> = {
  neutral: "bg-zinc-800 text-zinc-200 ring-zinc-600",
  good: "bg-emerald-950/80 text-emerald-200 ring-emerald-700",
  bad: "bg-red-950/80 text-red-200 ring-red-800",
  progress: "bg-amber-950/80 text-amber-200 ring-amber-700",
};

export function Badge({ children, tone }: { children: React.ReactNode; tone: CiTone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        toneClass[tone]
      )}
    >
      {children}
    </span>
  );
}
