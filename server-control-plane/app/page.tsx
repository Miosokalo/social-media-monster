import Link from "next/link";
import { loadProjectsConfig } from "@/lib/load-config";
import { buildProjectSummary } from "@/lib/aggregate";
import { describeCi, describeDeployStatus } from "@/lib/ci-status";
import { Badge } from "@/app/components/Badge";
import { SystemMiniBar } from "@/app/components/SystemMiniBar";
import { getEnv } from "@/lib/env";
import { getSystemOverview } from "@/lib/system-metrics";
import { Activity, ArrowRight, Globe as GlobeIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { SYSTEM_DISK_PATHS } = getEnv();
  const [configs, systemOverview] = await Promise.all([
    loadProjectsConfig(),
    getSystemOverview(SYSTEM_DISK_PATHS),
  ]);
  const summaries = await Promise.all(configs.map((c) => buildProjectSummary(c)));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-900/40">
              <Activity className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Control Plane</h1>
              <p className="text-sm text-zinc-400">Projekte &amp; Server</p>
            </div>
          </div>
          <Link
            href="/api/health"
            className="self-start text-xs text-zinc-500 hover:text-zinc-300 sm:self-auto"
            prefetch={false}
          >
            API: /api/health
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <section className="mb-6">
          <SystemMiniBar overview={systemOverview} />
        </section>

        <ul className="grid gap-4 sm:grid-cols-2">
          {summaries.map((s) => {
            const ci = describeCi(s.ci);
            const deploy =
              s.latestDeploy != null
                ? describeDeployStatus(s.latestDeploy.status)
                : null;
            const online = s.health.ok;
            return (
              <li key={s.project.id}>
                <Link
                  href={`/project/${s.project.id}`}
                  className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-indigo-600/60 hover:bg-zinc-900"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-zinc-100">{s.project.displayName}</h2>
                      <p className="text-xs text-zinc-500">{s.project.id}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-indigo-400" />
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge tone={online ? "good" : "bad"}>
                      {online ? "Erreichbar" : "Nicht erreichbar"}
                    </Badge>
                    <Badge tone={ci.tone}>{ci.label}</Badge>
                    {deploy ? <Badge tone={deploy.tone}>{deploy.label}</Badge> : null}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <GlobeIcon className="h-3.5 w-3.5" aria-hidden />
                      {s.project.urls.public.replace(/^https?:\/\//, "")}
                    </span>
                    {s.openTicketsCount > 0 ? (
                      <span className="text-amber-300/90">
                        {s.openTicketsCount} Ticket(s)
                      </span>
                    ) : (
                      <span>0 Tickets</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
