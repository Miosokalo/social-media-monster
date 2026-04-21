import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-zinc-200">
      <h1 className="text-xl font-semibold">Projekt nicht gefunden</h1>
      <p className="text-sm text-zinc-500">Prüfe die ID in der URL oder die Einträge in config/projects.yaml.</p>
      <Link href="/" className="text-indigo-400 hover:text-indigo-300">
        Zur Übersicht
      </Link>
    </div>
  );
}
