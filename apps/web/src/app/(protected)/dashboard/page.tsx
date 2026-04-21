import Link from "next/link";
import { auth } from "@/auth";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";

export default async function DashboardPage() {
  const session = await auth();
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Angemeldet als {session?.user?.email}
          {session?.user?.isFounderService ? (
            <span className="ml-2 rounded bg-amber-900/50 px-2 py-0.5 text-amber-200">
              Founder
            </span>
          ) : null}
        </p>
      </div>
      <WorkspaceSwitcher />
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/studio"
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-600"
        >
          <h2 className="font-medium">Creation Studio</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Chat, Working Document, Meta-Post, Kanal-Varianten.
          </p>
        </Link>
        <Link
          href="/calendar"
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-600"
        >
          <h2 className="font-medium">Kalender</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Geplante und veröffentlichte Posts.
          </p>
        </Link>
      </div>
    </div>
  );
}
