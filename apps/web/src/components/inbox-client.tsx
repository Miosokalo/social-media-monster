"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";

type Item = {
  id: string;
  platform: string;
  snippet: string | null;
  status: string;
};

export function InboxClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await fetch("/api/inbox");
    if (!res.ok) return;
    const j = await res.json();
    setItems(j.items ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  async function reply(id: string) {
    const text = replyText[id]?.trim();
    if (!text) return;
    const res = await fetch(`/api/inbox/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Antwort fehlgeschlagen");
      return;
    }
    setReplyText((m) => ({ ...m, [id]: "" }));
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Unified Inbox</h1>
      <p className="text-sm text-zinc-500">
        Eingehende Kommentare — Demo-Antworten für Plattform{" "}
        <code className="text-zinc-400">demo</code>; andere Netzwerke folgen.
      </p>
      {items.length === 0 ? (
        <EmptyState title="Noch keine Nachrichten">
          In Entwicklung: Webhooks/Polling füllen diese Liste automatisch.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="rounded-lg border border-zinc-800 px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                <span>{it.platform}</span>
                <span>{it.status}</span>
              </div>
              <p className="mt-1 text-zinc-300">{it.snippet}</p>
              {it.platform === "demo" ? (
                <div className="mt-2 flex gap-2">
                  <input
                    className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
                    placeholder="Antwort (Demo)"
                    value={replyText[it.id] ?? ""}
                    onChange={(e) =>
                      setReplyText((m) => ({ ...m, [it.id]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => void reply(it.id)}
                    className="rounded border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-800"
                  >
                    Senden
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
