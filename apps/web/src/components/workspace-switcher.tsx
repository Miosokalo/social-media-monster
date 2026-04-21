"use client";

import { useEffect, useState } from "react";

type Ws = { id: string; name: string; slug: string; role: string };

export function WorkspaceSwitcher() {
  const [list, setList] = useState<Ws[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/workspaces");
      const j = await res.json();
      if (res.ok && j.workspaces?.length) {
        setList(j.workspaces);
        const first = j.workspaces[0] as Ws;
        setActive(first.id);
        await fetch("/api/workspaces/active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: first.id }),
        });
      }
    })();
  }, []);

  async function switchWs(id: string) {
    const res = await fetch("/api/workspaces/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    });
    if (res.ok) {
      setActive(id);
    }
  }

  if (list.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Keine Workspaces geladen.</p>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="text-sm font-medium text-zinc-300">Workspace</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {list.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => switchWs(w.id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              active === w.id
                ? "bg-emerald-700 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {w.name}
          </button>
        ))}
      </div>
    </div>
  );
}
