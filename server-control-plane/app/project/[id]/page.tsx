import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getProjectById } from "@/lib/load-config";
import { buildProjectDetail } from "@/lib/aggregate";
import { describeCi, describeDeployStatus } from "@/lib/ci-status";
import { Badge } from "@/app/components/Badge";
import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  Server,
  ListTodo,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const d = await buildProjectDetail(project);
  const ci = describeCi(d.ci);
  const deploy =
    d.latestDeploy != null ? describeDeployStatus(d.latestDeploy.status) : null;
  const ghBase = `https://github.com/${project.git.owner}/${project.git.repo}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Zur Übersicht
            </Link>
            <span className="text-zinc-700" aria-hidden>
              |
            </span>
            <Link href="/system" className="text-zinc-500 hover:text-zinc-200">
              System
            </Link>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.displayName}</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Branch <span className="text-zinc-300">{project.git.branch}</span> ·{" "}
                <a
                  href={ghBase}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                >
                  {project.git.owner}/{project.git.repo}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={d.health.ok ? "good" : "bad"}>
                {d.health.ok ? "Öffentliche URL erreichbar" : "URL nicht erreichbar"}
              </Badge>
              <Badge tone={ci.tone}>{ci.label}</Badge>
              {deploy ? <Badge tone={deploy.tone}>{deploy.label}</Badge> : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <Server className="h-4 w-4" />
            Live-Version &amp; Erreichbarkeit
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Öffentliche URL</dt>
              <dd>
                <a
                  href={project.urls.public}
                  className="text-indigo-400 hover:text-indigo-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  {project.urls.public}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Health-Check</dt>
              <dd className="text-zinc-200">
                {project.urls.healthCheck ?? project.urls.public}
                <span className="ml-2 text-zinc-500">
                  ({d.health.latencyMs} ms{d.health.error ? ` · ${d.health.error}` : ""})
                </span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-zinc-500">Version-Endpoint (konfiguriert)</dt>
              <dd className="text-zinc-200">
                {project.version?.url ? (
                  <>
                    {project.version.url}
                    {d.liveVersion.ok && d.liveVersion.version ? (
                      <span className="ml-2 text-emerald-400">
                        Commit {d.liveVersion.version.shortCommit ?? d.liveVersion.version.commit ?? "—"}
                        {d.liveVersion.version.buildTime
                          ? ` · Build ${d.liveVersion.version.buildTime}`
                          : ""}
                        {d.liveVersion.version.semver ? ` · ${d.liveVersion.version.semver}` : ""}
                      </span>
                    ) : (
                      <span className="ml-2 text-amber-300/90">
                        {d.liveVersion.error ?? "Konnte Version nicht lesen"}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-500">
                    Kein <code className="text-zinc-400">version.url</code> gesetzt — siehe{" "}
                    <Link href="/docs/version-endpoint" className="text-indigo-400">
                      Doku
                    </Link>
                    .
                  </span>
                )}
              </dd>
            </div>
          </dl>
          {d.ci?.htmlUrl ? (
            <p className="mt-3 text-xs text-zinc-500">
              Letzter Workflow:{" "}
              <a href={d.ci.htmlUrl} className="text-indigo-400 hover:text-indigo-300" target="_blank" rel="noreferrer">
                {d.ci.name ?? "Workflow"}
              </a>
              {d.ci.headSha ? ` @ ${d.ci.headSha.slice(0, 7)}` : ""}
            </p>
          ) : null}
          {d.ciError ? (
            <p className="mt-2 text-xs text-amber-300/90">CI: {d.ciError}</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <GitBranch className="h-4 w-4" />
            Letzte Änderungen (Git)
          </h2>
          {d.commitsError ? (
            <p className="text-sm text-amber-300/90">{d.commitsError}</p>
          ) : (
            <ol className="space-y-2">
              {d.commits.map((c) => (
                <li
                  key={c.sha}
                  className="flex flex-col gap-0.5 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-sm sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="font-mono text-xs text-zinc-500">{c.shortSha}</span>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-200 hover:text-white"
                  >
                    {c.message}
                  </a>
                  <span className="text-xs text-zinc-500">
                    {c.date ? new Date(c.date).toLocaleString() : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <ListTodo className="h-4 w-4" />
            Empfohlene nächste Schritte
          </h2>
          {d.recommendedStepsError ? (
            <p className="text-sm text-amber-300/90">{d.recommendedStepsError}</p>
          ) : d.recommendedSteps ? (
            <article className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-li:text-zinc-300 prose-a:text-indigo-400">
              <ReactMarkdown>{d.recommendedSteps.content}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-zinc-500">
              Keine Datei <code className="text-zinc-400">{project.recommendedStepsPath}</code> im
              Repository (Branch {project.git.branch}).
            </p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            <AlertCircle className="h-4 w-4" />
            Tickets &amp; Feedback
          </h2>
          {d.tickets.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Noch keine Einträge. Apps können per Webhook an{" "}
              <code className="text-zinc-400">POST /api/webhooks/ticket</code> senden.
            </p>
          ) : (
            <ul className="space-y-2">
              {d.tickets.map((t) => (
                <li
                  key={t.id}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100">{t.title}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(t.createdAt).toLocaleString()}
                      {t.severity ? ` · ${t.severity}` : ""}
                    </span>
                  </div>
                  {t.body ? <p className="mt-1 text-zinc-400">{t.body}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Deploy-Events (Webhooks)
          </h2>
          {d.deployEvents.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Keine Deploy-Events. CI-Skripte können{" "}
              <code className="text-zinc-400">POST /api/webhooks/deploy</code> aufrufen.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.deployEvents.slice(0, 15).map((e) => (
                <li key={e.id} className="flex flex-wrap gap-2 text-zinc-300">
                  <Badge tone={describeDeployStatus(e.status).tone}>{e.status}</Badge>
                  <span className="text-zinc-500">{new Date(e.at).toLocaleString()}</span>
                  {e.commit ? <span className="font-mono text-xs">{e.commit}</span> : null}
                  {e.message ? <span className="text-zinc-400">{e.message}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
