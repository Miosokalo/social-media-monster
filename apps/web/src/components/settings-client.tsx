"use client";

import { useEffect, useState } from "react";

type Brand = { id: string; name: string; slug: string };
type Conn = {
  id: string;
  brandEntityId: string;
  platform: string;
  label: string;
};

export function SettingsClient() {
  const [rules, setRules] = useState<unknown[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [connections, setConnections] = useState<Conn[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [billingHint, setBillingHint] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/moderation-rules");
      if (res.ok) {
        const j = await res.json();
        setRules(j.rules ?? []);
      }
      const s = await fetch("/api/settings/summary");
      if (s.ok) {
        const j = (await s.json()) as {
          workspaceId: string;
          brands: Brand[];
          connectedAccounts: Conn[];
        };
        setWorkspaceId(j.workspaceId);
        setBrands(j.brands ?? []);
        setConnections(j.connectedAccounts ?? []);
      }
      const u = await fetch("/api/usage/summary").catch(() => null);
      if (u?.ok) {
        const j = await u.json();
        setBillingHint(
          typeof j.summary === "string" ? j.summary : JSON.stringify(j),
        );
      }
    })();
  }, []);

  const firstBrandId = brands[0]?.id;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">
          Konten verbinden
        </h2>
        {!firstBrandId ? (
          <p className="text-sm text-zinc-500">
            Keine Marke im Workspace — zuerst Onboarding abschließen.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-zinc-500">
              Marke: <span className="text-zinc-300">{brands[0]?.name}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                className="rounded-md border border-zinc-700 px-3 py-2 hover:bg-zinc-900"
                href={`/api/oauth/meta/start?brandEntityId=${firstBrandId}`}
              >
                Meta (Facebook)
              </a>
              <a
                className="rounded-md border border-zinc-700 px-3 py-2 hover:bg-zinc-900"
                href={`/api/oauth/linkedin/start?brandEntityId=${firstBrandId}`}
              >
                LinkedIn
              </a>
              <a
                className="rounded-md border border-zinc-700 px-3 py-2 hover:bg-zinc-900"
                href={`/api/oauth/x/start?brandEntityId=${firstBrandId}`}
              >
                X (Twitter)
              </a>
            </div>
            <p className="text-xs text-zinc-600">
              Instagram, TikTok, YouTube: API-Anbindung folgt (Publisher noch
              nicht aktiv).
            </p>
          </div>
        )}
        {connections.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-zinc-500">
            {connections.map((c) => (
              <li key={c.id}>
                {c.platform}: {c.label}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-400">
          Moderationsregeln
        </h2>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-zinc-800 p-4 text-xs text-zinc-500">
          {JSON.stringify(rules, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-sm font-medium text-zinc-400">Billing</h2>
        <div className="mt-2 space-y-3 text-sm text-zinc-500">
          <p>
            <button
              type="button"
              className="rounded-md border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900"
              onClick={() => void billingAction("checkout", workspaceId)}
            >
              Upgrade / Checkout
            </button>{" "}
            <button
              type="button"
              className="ml-2 rounded-md border border-zinc-700 px-3 py-2 text-zinc-300 hover:bg-zinc-900"
              onClick={() => void billingAction("portal", workspaceId)}
            >
              Abo verwalten
            </button>
          </p>
          {billingHint && (
            <pre className="whitespace-pre-wrap rounded-lg border border-zinc-800 p-3 text-xs">
              {billingHint}
            </pre>
          )}
          <p className="text-xs">
            Webhook: <code className="text-zinc-400">/api/stripe/webhook</code>
          </p>
        </div>
      </section>
    </div>
  );
}

async function billingAction(
  kind: "checkout" | "portal",
  workspaceId: string | null,
) {
  if (!workspaceId) {
    alert("Kein Workspace");
    return;
  }
  const priceId =
    kind === "checkout"
      ? window.prompt("Stripe Price-ID (price_…) — leer = Server-Default", "")
      : null;
  if (kind === "checkout" && priceId === null) return;
  const res = await fetch(`/api/billing/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      kind === "checkout"
        ? { workspaceId, priceId }
        : { workspaceId },
    ),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    alert((j as { error?: string }).error ?? "Billing nicht verfügbar");
    return;
  }
  const j = (await res.json()) as { url?: string };
  if (j.url) window.location.href = j.url;
}
