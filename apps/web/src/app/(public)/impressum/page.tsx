import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-12 text-sm text-zinc-300">
      <h1 className="text-2xl font-semibold">Impressum</h1>
      <p className="text-zinc-500">
        Platzhalter — Angaben gemäß § 5 TMG / § 55 RStV hier eintragen
        (Betreiber, Adresse, Kontakt, USt-ID falls zutreffend).
      </p>
      <Link href="/login" className="text-emerald-400 hover:underline">
        Zur Anmeldung
      </Link>
    </div>
  );
}
