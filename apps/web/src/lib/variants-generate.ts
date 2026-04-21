import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { Platform } from "@smm/shared";
import { channelVariantPayloadSchema } from "@smm/shared";
import { env } from "@/env";

const batchSchema = z.object({
  variants: z
    .array(
      z.object({
        platform: z.enum([
          "meta_facebook",
          "meta_instagram",
          "linkedin",
          "x",
          "tiktok",
          "youtube",
          "demo",
        ]),
        payload: channelVariantPayloadSchema,
      }),
    )
    .min(1),
});

export async function generateChannelVariants(opts: {
  metaTitle: string;
  metaBody: string;
  platforms: Platform[];
}) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }

  const platformHints: Record<string, string> = {
    meta_facebook:
      "Längerer Fließtext erlaubt, optional erste Zeile als Hook. Keine Hashtag-Wände.",
    meta_instagram:
      "Kürzer, visuell; Emojis sparsam; Hashtags am Ende, max ~12.",
    linkedin: "Professionell, Absätze, optional Bullet-Listen.",
    x: "Kurz; wenn nötig threadParts Array mit mehreren kurzen Teilen.",
    tiktok: "Hook in Zeile 1, rest knapp; Video-Bezug erwähnen.",
    youtube: "Titel + Beschreibung; Timestamps optional in notes.",
    demo: "Freies Format.",
  };

  const { object } = await generateObject({
    model: openai(env.OPENAI_MODEL),
    schema: batchSchema,
    prompt: [
      "Erstelle für jede Zielplattform eine eigene Variante aus dem Meta-Post.",
      "Plattformen:",
      opts.platforms.join(", "),
      "\nMeta-Titel:",
      opts.metaTitle,
      "\nMeta-Body:\n",
      opts.metaBody,
      "\n\nRegeln:",
      ...opts.platforms.map((p) => `${p}: ${platformHints[p] ?? ""}`),
    ].join("\n"),
    temperature: 0.45,
  });

  const allowed = new Set(opts.platforms);
  return object.variants.filter((v) => allowed.has(v.platform as Platform));
}
