import Link from "next/link";
import { Cpu, ChevronRight } from "lucide-react";
import type { SystemOverview } from "@/lib/system-metrics";
import { MetricBar } from "@/app/components/MetricBar";

export function SystemMiniBar({ overview }: { overview: SystemOverview }) {
  const ram = overview.memory.usedPercent;
  const disk = overview.primaryDisk?.usedPercent;

  return (
    <Link
      href="/system"
      className="group flex items-center gap-3 rounded-lg border border-zinc-800/90 bg-zinc-900/50 px-3 py-2.5 transition hover:border-zinc-700 hover:bg-zinc-900/80"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-zinc-300 group-hover:text-white">
        <Cpu className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            System · {overview.hostname}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-400" />
        </div>
        <div className="flex flex-wrap items-end gap-4 sm:gap-6">
          <MetricBar label="RAM" percent={ram} tone="indigo" className="min-w-[120px] max-w-[200px]" />
          {disk != null ? (
            <MetricBar
              label={
                overview.primaryDisk
                  ? `FS ${overview.primaryDisk.label}`
                  : "Dateisystem"
              }
              percent={disk}
              tone="emerald"
              className="min-w-[120px] max-w-[200px]"
            />
          ) : (
            <p className="text-[11px] text-zinc-600">FS: n. z.</p>
          )}
        </div>
      </div>
    </Link>
  );
}
