"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateProjectButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    const res = await fetch("/api/studio/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Neues Projekt ${new Date().toLocaleString("de-DE")}`,
      }),
    });
    setPending(false);
    if (!res.ok) return;
    const j = await res.json();
    if (j.project?.id) {
      router.push(`/studio/${j.project.id}`);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void create()}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
    >
      {pending ? "…" : "Neues Projekt"}
    </button>
  );
}
