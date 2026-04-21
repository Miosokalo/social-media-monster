import type { PlatformPublisher, PublishInput } from "@/lib/platforms/types";

/** X API v2 create tweet — needs OAuth2 user context with tweet.write */
export const xPublisher: PlatformPublisher = {
  async publish(input: PublishInput) {
    const text = [input.snapshot.headline, input.snapshot.body]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 280);
    const res = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
    const json = (await res.json()) as {
      data?: { id: string };
      errors?: { detail?: string }[];
    };
    if (!res.ok) {
      throw new Error(
        json.errors?.[0]?.detail ?? `x_error:${res.status}`,
      );
    }
    if (!json.data?.id) throw new Error("x_no_id");
    return json.data.id;
  },
};
