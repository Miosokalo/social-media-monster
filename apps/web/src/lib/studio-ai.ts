import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { StudioChatMode } from "@smm/shared";
import { env } from "@/env";

const chatDocSchema = z.object({
  chat: z.string().describe("Antwort an den Nutzer im Chat."),
  documentMarkdown: z
    .string()
    .optional()
    .describe(
      "Vollständiger Inhalt des Working Documents in Markdown. Leer lassen, wenn nur geantwortet werden soll.",
    ),
});

export async function runStudioTurn(opts: {
  mode: StudioChatMode;
  workingDocument: string;
  messages: { role: "user" | "assistant"; content: string }[];
}) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }

  const modeHint =
    opts.mode === "chat_only"
      ? "Aktualisiere das Working Document NICHT. Lasse documentMarkdown leer oder weglassen."
      : opts.mode === "doc_only"
        ? "Schreibe ausschließlich ins Working Document; chat kann kurz bestätigen."
        : "Du darfst Chat und Working Document aktualisieren.";

  const system = [
    "Du bist ein Social-Media-Stratege und Redakteur.",
    "Das Working Document ist die zentrale Recherche- und Strukturfläche (Markdown).",
    "Halte Fakten vorsichtig: markiere Unsicherheiten und schlage vor, was der Nutzer verifizieren sollte.",
    modeHint,
    "\nAktueller Working-Document-Stand:\n---\n",
    opts.workingDocument || "(leer)",
    "\n---",
  ].join("\n");

  const { object } = await generateObject({
    model: openai(env.OPENAI_MODEL),
    schema: chatDocSchema,
    messages: [
      { role: "system", content: system },
      ...opts.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    temperature: 0.6,
  });

  if (opts.mode === "chat_only") {
    return { chat: object.chat, documentMarkdown: undefined as string | undefined };
  }
  if (opts.mode === "doc_only") {
    return {
      chat: object.chat,
      documentMarkdown: object.documentMarkdown ?? opts.workingDocument,
    };
  }
  return {
    chat: object.chat,
    documentMarkdown:
      object.documentMarkdown !== undefined && object.documentMarkdown !== ""
        ? object.documentMarkdown
        : opts.workingDocument,
  };
}
