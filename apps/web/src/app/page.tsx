import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Social Media Monster
        </h1>
        <p className="mt-2 text-zinc-400">
          Creation Studio, Meta-Posts, Kanal-Varianten und geplantes Publishing.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {session?.user ? (
          <Link
            href="/dashboard"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Zum Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Anmelden
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
            >
              Registrieren
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
