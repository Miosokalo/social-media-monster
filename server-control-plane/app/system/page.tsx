import Link from "next/link";
import { ArrowLeft, ChevronDown, Server } from "lucide-react";
import { getEnv } from "@/lib/env";
import {
  getSystemOverview,
  formatBytes,
  formatUptime,
} from "@/lib/system-metrics";
import { MetricBar } from "@/app/components/MetricBar";

export const dynamic = "force-dynamic";

export default async function SystemPage() {
  const { SYSTEM_DISK_PATHS } = getEnv();
  const o = await getSystemOverview(SYSTEM_DISK_PATHS);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <div className="flex items-start gap-4">
            <Link
              href="/"
              className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Projekte
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-950/50">
                <Server className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-50">System</h1>
                <p className="text-sm text-zinc-500">
                  {o.hostname}
                  <span className="mx-2 text-zinc-700">·</span>
                  {o.platform}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-zinc-500">
            <div>Uptime {formatUptime(o.uptimeSeconds)}</div>
            <div className="mt-0.5 font-mono text-xs text-zinc-600">{o.cpus} CPUs</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        {/* Primär: große Karten — 14"-Layout: 2 Spalten */}
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 shadow-xl shadow-black/20">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Arbeitsspeicher
            </h2>
            <p className="mb-6 text-4xl font-light tabular-nums tracking-tight text-zinc-50">
              {o.memory.usedPercent.toFixed(1)}
              <span className="text-2xl text-zinc-500">%</span>
            </p>
            <MetricBar label="Auslastung" percent={o.memory.usedPercent} tone="indigo" />
            <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-5 text-center text-xs">
              <div>
                <dt className="text-zinc-600">Belegt</dt>
                <dd className="mt-1 font-mono text-zinc-300">{formatBytes(o.memory.usedBytes)}</dd>
              </div>
              <div>
                <dt className="text-zinc-600">Frei</dt>
                <dd className="mt-1 font-mono text-zinc-300">{formatBytes(o.memory.freeBytes)}</dd>
              </div>
              <div>
                <dt className="text-zinc-600">Gesamt</dt>
                <dd className="mt-1 font-mono text-zinc-300">{formatBytes(o.memory.totalBytes)}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/80 to-zinc-950 p-6 shadow-xl shadow-black/20">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Dateisystem
            </h2>
            {o.primaryDisk ? (
              <>
                <p className="mb-1 text-sm text-zinc-400">{o.primaryDisk.mountPath}</p>
                <p className="mb-6 text-4xl font-light tabular-nums tracking-tight text-zinc-50">
                  {o.primaryDisk.usedPercent.toFixed(1)}
                  <span className="text-2xl text-zinc-500">%</span>
                </p>
                <MetricBar
                  label={`Belegt (${o.primaryDisk.label})`}
                  percent={o.primaryDisk.usedPercent}
                  tone="emerald"
                />
                <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-zinc-800/80 pt-5 text-center text-xs">
                  <div>
                    <dt className="text-zinc-600">Belegt</dt>
                    <dd className="mt-1 font-mono text-zinc-300">
                      {formatBytes(o.primaryDisk.usedBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Frei</dt>
                    <dd className="mt-1 font-mono text-zinc-300">
                      {formatBytes(o.primaryDisk.freeBytes)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Größe</dt>
                    <dd className="mt-1 font-mono text-zinc-300">
                      {formatBytes(o.primaryDisk.totalBytes)}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-zinc-500">
                Keine Laufwerksdaten (z. B. <code className="text-zinc-400">statfs</code> auf dieser
                Plattform nicht verfügbar oder Pfad ungültig). RAM oben ist weiterhin gültig.
              </p>
            )}
          </article>
        </section>

        {/* Drill-down: wenige Klicks, native Details */}
        <details className="open:[&>summary_svg.chevron]:rotate-180 rounded-xl border border-zinc-800/80 bg-zinc-900/30 open:bg-zinc-900/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-zinc-200 outline-none ring-indigo-500/40 marker:content-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
            <span>CPU &amp; Last</span>
            <ChevronDown className="chevron h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200" aria-hidden />
          </summary>
          <div className="border-t border-zinc-800/80 px-5 pb-5 pt-2">
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-zinc-950/50 px-4 py-3">
                <dt className="text-xs text-zinc-600">Load (1m)</dt>
                <dd className="mt-1 font-mono text-lg text-zinc-200">{o.loadavg[0]?.toFixed(2) ?? "—"}</dd>
              </div>
              <div className="rounded-lg bg-zinc-950/50 px-4 py-3">
                <dt className="text-xs text-zinc-600">Load (5m)</dt>
                <dd className="mt-1 font-mono text-lg text-zinc-200">{o.loadavg[1]?.toFixed(2) ?? "—"}</dd>
              </div>
              <div className="rounded-lg bg-zinc-950/50 px-4 py-3">
                <dt className="text-xs text-zinc-600">Load (15m)</dt>
                <dd className="mt-1 font-mono text-lg text-zinc-200">{o.loadavg[2]?.toFixed(2) ?? "—"}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-zinc-600">
              Load Average: durchschnittliche Run-Queue (Unix). Unter Linux sinnvoll; unter Windows oft
              [0,0,0].
            </p>
          </div>
        </details>

        {o.disks.length > 1 ? (
          <details className="open:[&>summary_svg.chevron]:rotate-180 rounded-xl border border-zinc-800/80 bg-zinc-900/30 open:bg-zinc-900/50">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-zinc-200 outline-none ring-indigo-500/40 marker:content-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
              <span>Weitere Einhängepunkte ({o.disks.length - 1})</span>
              <ChevronDown className="chevron h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200" aria-hidden />
            </summary>
            <div className="border-t border-zinc-800/80 px-5 pb-5 pt-4">
              <ul className="space-y-4">
                {o.disks.slice(1).map((d) => (
                  <li
                    key={d.mountPath}
                    className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-sm text-zinc-300">{d.mountPath}</span>
                      <span className="text-sm tabular-nums text-zinc-500">
                        {d.usedPercent.toFixed(1)}% belegt
                      </span>
                    </div>
                    <MetricBar label={d.label} percent={d.usedPercent} tone="amber" />
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                      <span>Belegt {formatBytes(d.usedBytes)}</span>
                      <span>Frei {formatBytes(d.freeBytes)}</span>
                      <span>Gesamt {formatBytes(d.totalBytes)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ) : null}

        <details className="open:[&>summary_svg.chevron]:rotate-180 rounded-xl border border-zinc-800/80 bg-zinc-900/30 open:bg-zinc-900/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-zinc-200 outline-none ring-indigo-500/40 marker:content-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
            <span>Rohdaten (JSON)</span>
            <ChevronDown className="chevron h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200" aria-hidden />
          </summary>
          <div className="border-t border-zinc-800/80 px-5 pb-5 pt-4">
            <pre className="max-h-[min(50vh,28rem)] overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-[11px] leading-relaxed text-zinc-400">
              {JSON.stringify(
                {
                  hostname: o.hostname,
                  platform: o.platform,
                  uptimeSeconds: o.uptimeSeconds,
                  loadavg: o.loadavg,
                  cpus: o.cpus,
                  memory: o.memory,
                  disks: o.disks,
                },
                null,
                2
              )}
            </pre>
          </div>
        </details>
      </main>
    </div>
  );
}
