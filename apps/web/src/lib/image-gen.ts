import { env } from "@/env";

/** 1×1 transparent PNG */
export const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/**
 * Hero image for Meta post: DALL·E when configured, otherwise a tiny placeholder PNG.
 */
export async function generateHeroImage(opts: {
  title: string;
  excerpt: string;
}): Promise<Buffer> {
  if (!env.OPENAI_API_KEY) {
    return PLACEHOLDER_PNG;
  }
  try {
    const { experimental_generateImage } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");
    const { image } = await experimental_generateImage({
      model: openai.image("dall-e-3"),
      prompt: [
        "Editorial social media hero image, no text overlay, clean composition.",
        "Topic:",
        opts.title,
        opts.excerpt.slice(0, 400),
      ].join(" "),
      size: "1024x1024",
    });
    return Buffer.from(image.uint8Array);
  } catch {
    return PLACEHOLDER_PNG;
  }
}
