"use client";

import { useCallback, useEffect, useState } from "react";

type Sp = {
  id: string;
  platform: string;
  status: string;
  scheduledFor: string | null;
  createdAt: string;
  lastError: string | null;
  approvalStatus?: string;
};

export function CalendarClient() {
  const [rows, setRows] = useState<Sp[]>([]);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/scheduled-posts");
    if (!res.ok) return;
    const j = await res.json();
    setRows(j.scheduledPosts ?? []);
    const s = await fetch("/api/settings/summary");
    if (s.ok) {
      const sj = (await s.json()) as { role?: string };
      setRole(sj.role ?? null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function retry(id: string) {
    setRetrying(id);
    const res = await fetch(`/api/scheduled-posts/${id}/retry`, {
      method: "POST",
    });
    setRetrying(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Retry fehlgeschlagen");
      return;
    }
    await load();
  }

  const canApprove = role === "owner" || role === "admin";

  async function approval(id: string, action: "approve" | "reject") {
    const res = await fetch(`/api/scheduled-posts/${id}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Aktion fehlgeschlagen");
      return;
    }
    await load();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Kalender</h1>
      <p className="text-sm text-zinc-500">
        Geplante und verarbeitete Posts — bei Fehlern erneut einreihen;
        Freigaben für Owner/Admin.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-zinc-800 px-4 py-3 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-zinc-400">{r.platform}</span>
              <span className="text-zinc-300">{r.status}</span>
              {r.approvalStatus ? (
                <span className="text-xs text-zinc-500">
                  Freigabe: {r.approvalStatus}
                </span>
              ) : null}
              {r.scheduledFor ? (
                <span className="text-zinc-500">
                  {new Date(r.scheduledFor).toLocaleString("de-DE")}
                </span>
              ) : null}
              {(r.status === "failed" || r.status === "cancelled") && (
                <button
                  type="button"
                  disabled={retrying === r.id}
                  className="ml-auto rounded border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-900 disabled:opacity-50"
                  onClick={() => void retry(r.id)}
                >
                  {retrying === r.id ? "…" : "Erneut versuchen"}
                </button>
              )}
              {canApprove &&
                r.approvalStatus === "pending_review" &&
                r.status === "draft" && (
                  <span className="ml-auto flex gap-1">
                    <button
                      type="button"
                      className="rounded border border-emerald-700 px-2 py-1 text-xs text-emerald-300"
                      onClick={() => void approval(r.id, "approve")}
                    >
                      Freigeben
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-800 px-2 py-1 text-xs text-red-300"
                      onClick={() => void approval(r.id, "reject")}
                    >
                      Ablehnen
                    </button>
                  </span>
                )}
            </div>
            {r.lastError ? (
              <p className="mt-1 text-xs text-red-400/90">{r.lastError}</p>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? (
          <p className="text-zinc-500">Noch keine Einträge.</p>
        ) : null}
      </ul>
    </div>
  );
}
