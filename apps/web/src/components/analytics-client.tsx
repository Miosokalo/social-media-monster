"use client";

import { useEffect, useState } from "react";

type Row = { day: string; count: number };

export function AnalyticsClient() {
  const [series, setSeries] = useState<Row[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/analytics/dashboard?days=30");
      if (!res.ok) return;
      const j = await res.json();
      setSeries(j.series ?? []);
    })();
  }, []);

  const max = Math.max(1, ...series.map((s) => s.count));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <p className="text-sm text-zinc-500">
        Veröffentlichte Posts pro Tag (letzte 30 Tage).
      </p>
      <div className="flex h-48 items-end gap-1 border-b border-zinc-800 pb-2">
        {series.map((s) => (
          <div
            key={s.day}
            title={`${s.day}: ${s.count}`}
            className="min-w-[8px] flex-1 rounded-t bg-emerald-600/80"
            style={{ height: `${(s.count / max) * 100}%` }}
          />
        ))}
      </div>
      {series.length === 0 ? (
        <p className="text-sm text-zinc-500">Noch keine Daten.</p>
      ) : null}
      <p>
        <a
          href="/api/analytics/export"
          className="text-sm text-emerald-400 hover:underline"
        >
          CSV exportieren
        </a>
      </p>
    </div>
  );
}
