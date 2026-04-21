"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type PageOpt = { id: string; name: string };

export default function OAuthMetaPickPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const session = sp.get("session");
  const [pages, setPages] = useState<PageOpt[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!session) {
      setErr("missing_session");
      return;
    }
    void (async () => {
      const res = await fetch(
        `/api/oauth/meta/pending?session=${encodeURIComponent(session)}`,
      );
      if (!res.ok) {
        setErr("Sitzung ungültig oder abgelaufen.");
        return;
      }
      const j = (await res.json()) as {
        sessionId: string;
        pages: PageOpt[];
      };
      setSessionId(j.sessionId);
      setPages(j.pages);
    })();
  }, [session]);

  async function pick(pageId: string) {
    if (!sessionId) return;
    setPending(true);
    const res = await fetch("/api/oauth/meta/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, pageId }),
    });
    setPending(false);
    if (!res.ok) {
      setErr("Verbindung fehlgeschlagen.");
      return;
    }
    router.replace("/settings?oauth=meta_ok");
  }

  if (err) {
    return (
      <div className="mx-auto max-w-lg p-8 text-sm text-red-400">{err}</div>
    );
  }

  if (pages.length === 0 && !err) {
    return (
      <div className="mx-auto max-w-lg p-8 text-sm text-zinc-500">Laden…</div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-8">
      <h1 className="text-xl font-semibold">Facebook-Seite wählen</h1>
      <p className="text-sm text-zinc-500">
        Mehrere Seiten gefunden — bitte eine verbinden.
      </p>
      <ul className="space-y-2">
        {pages.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              disabled={pending}
              className="w-full rounded-lg border border-zinc-700 px-4 py-3 text-left text-sm hover:bg-zinc-900 disabled:opacity-50"
              onClick={() => void pick(p.id)}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
