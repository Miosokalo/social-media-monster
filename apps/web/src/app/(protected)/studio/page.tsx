import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateProjectButton } from "@/components/create-project-button";
import { db } from "@/db";
import { contentProjects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireWorkspace } from "@/lib/workspace-context";

export default async function StudioIndexPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const ctx = await requireWorkspace();
  if (ctx.error === "no_workspace") {
    return (
      <p className="text-zinc-400">
        Kein Workspace — bitte zuerst registrieren.
      </p>
    );
  }
  if (ctx.error) redirect("/login");

  const projects = await db
    .select()
    .from(contentProjects)
    .where(eq(contentProjects.workspaceId, ctx.workspace.id))
    .orderBy(desc(contentProjects.updatedAt));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Creation Studio</h1>
        <CreateProjectButton />
      </div>
      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id}>
            <Link
              href={`/studio/${p.id}`}
              className="block rounded-lg border border-zinc-800 px-4 py-3 hover:border-zinc-600"
            >
              <span className="font-medium">{p.title}</span>
              <span className="ml-2 text-xs text-zinc-500">{p.status}</span>
            </Link>
          </li>
        ))}
        {projects.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Noch keine Projekte — eines anlegen.
          </p>
        ) : null}
      </ul>
    </div>
  );
}
