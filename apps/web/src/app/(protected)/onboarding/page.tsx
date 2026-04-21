import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { brandEntities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getActiveWorkspaceId } from "@/lib/workspace-context";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const wsId = await getActiveWorkspaceId();
  let firstBrandId: string | null = null;
  if (wsId) {
    const [be] = await db
      .select({ id: brandEntities.id })
      .from(brandEntities)
      .where(eq(brandEntities.workspaceId, wsId))
      .limit(1);
    firstBrandId = be?.id ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Onboarding</h1>
      <ol className="list-decimal space-y-4 pl-5 text-sm text-zinc-300">
        <li className="space-y-1">
          <span className="font-medium text-zinc-200">Workspace</span>
          <p className="text-zinc-500">
            Im{" "}
            <Link href="/dashboard" className="text-emerald-400 hover:underline">
              Dashboard
            </Link>{" "}
            prüfen; bei mehreren Workspaces aktiv setzen.
          </p>
        </li>
        <li className="space-y-1">
          <span className="font-medium text-zinc-200">Konto verbinden</span>
          <p className="text-zinc-500">
            Unter{" "}
            <Link href="/settings" className="text-emerald-400 hover:underline">
              Einstellungen
            </Link>{" "}
            Meta, LinkedIn oder X verbinden
            {firstBrandId ? (
              <>
                {" "}
                — direkt:{" "}
                <Link
                  href={`/api/oauth/meta/start?brandEntityId=${firstBrandId}`}
                  className="text-emerald-400 hover:underline"
                >
                  Meta OAuth
                </Link>
              </>
            ) : (
              " (Marke/Brand wird beim ersten Login angelegt)."
            )}
          </p>
        </li>
        <li className="space-y-1">
          <span className="font-medium text-zinc-200">Creation Studio</span>
          <p className="text-zinc-500">
            <Link href="/studio" className="text-emerald-400 hover:underline">
              Studio öffnen
            </Link>
            , Projekt anlegen, Chat und Dokument nutzen.
          </p>
        </li>
        <li className="space-y-1">
          <span className="font-medium text-zinc-200">Planen</span>
          <p className="text-zinc-500">
            Meta-Post erzeugen, Kanal-Varianten, dann im{" "}
            <Link href="/calendar" className="text-emerald-400 hover:underline">
              Kalender
            </Link>{" "}
            planen.
          </p>
        </li>
        <li className="space-y-1">
          <span className="font-medium text-zinc-200">Worker (optional)</span>
          <p className="text-zinc-500">
            Mit Redis: <code className="text-emerald-400">npm run worker -w web</code>
          </p>
        </li>
      </ol>
    </div>
  );
}
