import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-12 text-sm text-zinc-300">
      <h1 className="text-2xl font-semibold">Datenschutz</h1>
      <p className="text-zinc-500">
        Platzhalter — Verantwortlicher, Zwecke, Rechtsgrundlagen, Speicherdauer,
        Unterauftragsverzeichnis (Hosting, LLM, Stripe, E-Mail) und Betroffenenrechte
        hier ausfüllen. KI-Verarbeitung: nur nach dokumentiertem Zweck und
        datensparsam.
      </p>
      <p className="text-zinc-500">
        Aufbewahrung Studio-Chats: Standard 90 Tage (siehe technische
        Lösch-Jobs / Cron).
      </p>
      <Link href="/login" className="text-emerald-400 hover:underline">
        Zur Anmeldung
      </Link>
    </div>
  );
}
