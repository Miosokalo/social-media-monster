"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudioChatMode } from "@smm/shared";
import { messageForApiStatus } from "@/lib/http-error-messages";

type Msg = {
  id: string;
  role: string;
  content: string;
};

export function StudioClient({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [doc, setDoc] = useState("");
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<StudioChatMode>("both");
  const [pending, setPending] = useState(false);
  const [streamPreview, setStreamPreview] = useState<string | null>(null);
  const [useStream, setUseStream] = useState(true);
  const [researchUrl, setResearchUrl] = useState("");
  const [metaTitle, setMetaTitle] = useState<string | null>(null);
  const [metaBody, setMetaBody] = useState<string | null>(null);
  const [metaPostId, setMetaPostId] = useState<string | null>(null);
  const [variants, setVariants] = useState<unknown[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/studio/projects/${projectId}`);
    if (!res.ok) return;
    const j = await res.json();
    setMessages(j.messages ?? []);
    if (j.document?.contentMd) setDoc(j.document.contentMd);
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    if (!input.trim()) return;
    const msg = input;
    setPending(true);
    setStreamPreview(null);
    setInput("");
    if (useStream) {
      const res = await fetch(
        `/api/studio/projects/${projectId}/chat/stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, mode }),
        },
      );
      if (!res.ok) {
        const t = await res.text();
        if (res.status === 402) {
          alert(messageForApiStatus(402, t));
        } else if (res.status === 503) {
          alert(messageForApiStatus(503));
        } else {
          alert(t || "Fehler");
        }
        setPending(false);
        return;
      }
      if (!res.body) {
        setPending(false);
        await load();
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setStreamPreview(acc);
      }
      setStreamPreview(null);
      setPending(false);
      await load();
      return;
    }

    const res = await fetch(`/api/studio/projects/${projectId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, mode }),
    });
    setPending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 402) {
        alert(
          messageForApiStatus(402, (err as { error?: string }).error),
        );
      } else {
        alert((err as { error?: string }).error ?? "Fehler");
      }
      return;
    }
    const j = await res.json();
    if (typeof j.documentMarkdown === "string") setDoc(j.documentMarkdown);
    await load();
  }

  async function fetchResearch() {
    const u = researchUrl.trim();
    if (!u.startsWith("https://")) {
      alert("Nur HTTPS-URLs erlaubt.");
      return;
    }
    setPending(true);
    const res = await fetch(`/api/studio/projects/${projectId}/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: u }),
    });
    setPending(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert((j as { error?: string }).error ?? "Recherche fehlgeschlagen");
      return;
    }
    const j = (await res.json()) as { excerpt?: string; contentType?: string | null };
    const block = [
      "",
      "## Quelle",
      u,
      "",
      (j.excerpt ?? "").slice(0, 8000),
      "",
    ].join("\n");
    setDoc((d) => `${d}\n${block}`);
  }

  async function saveDoc() {
    const res = await fetch(`/api/studio/projects/${projectId}/document`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentMd: doc }),
    });
    if (!res.ok) alert("Speichern fehlgeschlagen");
    else void load();
  }

  async function genMeta() {
    setPending(true);
    const res = await fetch(`/api/studio/projects/${projectId}/meta-post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setPending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error ?? "Meta-Post fehlgeschlagen");
      return;
    }
    const j = await res.json();
    setMetaTitle(j.metaPost?.title ?? null);
    setMetaBody(j.metaPost?.body ?? null);
    setMetaPostId(j.metaPost?.id ?? null);
  }

  async function genVariants() {
    if (!metaPostId) {
      alert("Zuerst Meta-Post erzeugen.");
      return;
    }
    setPending(true);
    const res = await fetch(`/api/studio/projects/${projectId}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metaPostId,
        platforms: ["demo", "meta_instagram", "linkedin", "x"],
      }),
    });
    setPending(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert((err as { error?: string }).error ?? "Varianten fehlgeschlagen");
      return;
    }
    const j = await res.json();
    setVariants(j.variants ?? []);
  }

  async function ensureDemo() {
    await fetch("/api/connections/demo", { method: "POST" });
  }

  async function scheduleFirst() {
    const list = variants as { id?: string; platform?: string }[];
    const v = list.find((x) => x.platform === "demo") ?? list[0];
    if (!v?.id) {
      alert("Keine Variante (Demo empfohlen).");
      return;
    }
    await ensureDemo();
    const res = await fetch("/api/scheduled-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelVariantId: v.id,
        publishNow: true,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(
        (err as { error?: string }).error ??
          messageForApiStatus(res.status, (err as { error?: string }).error),
      );
    } else alert("Geplant / veröffentlicht (Demo).");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <h1 className="text-xl font-semibold">Projekt</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="border-b border-zinc-800 px-3 py-2 text-sm text-zinc-400">
            Chat
          </div>
          <div className="h-64 overflow-y-auto p-3 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "mb-2 text-right text-emerald-300"
                    : "mb-2 text-zinc-300"
                }
              >
                {m.content}
              </div>
            ))}
            {streamPreview ? (
              <div className="mb-2 border-l-2 border-emerald-600 pl-2 text-zinc-200">
                {streamPreview}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 border-t border-zinc-800 p-3">
            <label className="flex items-center gap-2 text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={useStream}
                onChange={(e) => setUseStream(e.target.checked)}
              />
              Streaming (empfohlen)
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as StudioChatMode)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            >
              <option value="both">Chat + Working Doc</option>
              <option value="chat_only">Nur Chat</option>
              <option value="doc_only">Nur Working Doc</option>
            </select>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Thema, Recherche, Fragen…"
              className="min-h-[80px] rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={pending}
              onClick={() => void send()}
              className="rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Senden
            </button>
          </div>
        </div>
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
            <span className="text-sm text-zinc-400">Working Document</span>
            <button
              type="button"
              onClick={() => void saveDoc()}
              className="text-xs text-emerald-400 hover:underline"
            >
              Revision speichern
            </button>
          </div>
          <div className="border-b border-zinc-800 px-3 py-2">
            <p className="mb-1 text-xs text-zinc-500">URL einbinden (HTTPS)</p>
            <div className="flex gap-2">
              <input
                value={researchUrl}
                onChange={(e) => setResearchUrl(e.target.value)}
                placeholder="https://…"
                className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => void fetchResearch()}
                className="rounded border border-zinc-600 px-2 py-1 text-xs hover:bg-zinc-800"
              >
                Abrufen
              </button>
            </div>
          </div>
          <textarea
            value={doc}
            onChange={(e) => setDoc(e.target.value)}
            className="min-h-[280px] flex-1 resize-none bg-transparent p-3 font-mono text-sm text-zinc-200"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void genMeta()}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          Meta-Post (~4000 Zeichen + Bild)
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void genVariants()}
          className="rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          Kanal-Varianten
        </button>
        <button
          type="button"
          onClick={() => void scheduleFirst()}
          className="rounded-lg border border-emerald-700 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-950"
        >
          Demo posten
        </button>
      </div>
      {metaTitle ? (
        <div className="rounded-xl border border-zinc-800 p-4">
          <h2 className="text-sm font-medium text-zinc-400">Meta-Post</h2>
          <h3 className="mt-2 font-semibold">{metaTitle}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">
            {metaBody}
          </p>
        </div>
      ) : null}
      {variants.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 p-4 text-sm">
          <h2 className="font-medium text-zinc-400">Varianten</h2>
          <pre className="mt-2 overflow-x-auto text-xs text-zinc-500">
            {JSON.stringify(variants, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
