"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-zinc-100">
      <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen</h1>
      <p className="max-w-md text-center text-sm text-zinc-400">
        {error.message || "Unbekannter Fehler"}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
