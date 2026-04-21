import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { env } from "@/env";
import { charCount, isMetaLengthOk } from "@/lib/meta-length";

const metaSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

export async function generateMetaPost(opts: {
  sourceMarkdown: string;
  sectionLabel?: string | null;
}) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }

  let source = opts.sourceMarkdown;
  if (opts.sectionLabel) {
    const lines = opts.sourceMarkdown.split("\n");
    const idx = lines.findIndex((l) =>
      l.toLowerCase().includes(opts.sectionLabel!.toLowerCase()),
    );
    source =
      idx >= 0
        ? lines.slice(idx).join("\n")
        : `# ${opts.sectionLabel}\n\n${opts.sourceMarkdown}`;
  }

  const { object: first } = await generateObject({
    model: openai(env.OPENAI_MODEL),
    schema: metaSchema,
    prompt: [
      "Erzeuge einen tiefgehenden Meta-Post (Facebook/Instagram langer Fließtext).",
      "Der body soll ca. 4000 Zeichen haben (Unicode-Zeichen, nicht Bytes). Zielbereich 3800–4200.",
      "Schreibstil: sachlich, klar, mit Zwischenüberschriften im Fließtext erlaubt (Markdown **fett**).",
      "Quelle / Kontext:\n---\n",
      source,
      "\n---",
    ].join("\n"),
    temperature: 0.55,
  });

  const title = first.title;
  let body = first.body;
  let guard = 0;
  while (!isMetaLengthOk(body) && guard < 4) {
    const n = charCount(body);
    const { text } = await generateText({
      model: openai(env.OPENAI_MODEL),
      prompt:
        n < 3800
          ? `Verlängere den folgenden Text auf ca. 4000 Zeichen (min 3800, max 4200 Unicode-Zeichen). Behalte Ton und Aussagen bei, ergänze sinnvoll.\n\n${body}`
          : `Kürze den folgenden Text auf ca. 4000 Zeichen (min 3800, max 4200 Unicode-Zeichen). Inhaltlich gleiche Kernaussagen.\n\n${body}`,
      temperature: 0.3,
    });
    body = text.trim();
    guard += 1;
  }

  return { title, body, characterCount: charCount(body) };
}
