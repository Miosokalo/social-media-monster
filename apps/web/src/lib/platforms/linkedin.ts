import type { PlatformPublisher, PublishInput } from "@/lib/platforms/types";

/** LinkedIn UGC Posts API — minimal text share (organization or member URN in token scope). */
export const linkedinPublisher: PlatformPublisher = {
  async publish(input: PublishInput) {
    const text = [input.snapshot.headline, input.snapshot.body]
      .filter(Boolean)
      .join("\n\n");
    const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: input.externalAccountId ?? "urn:li:person:UNKNOWN",
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });
    const json = (await res.json()) as { id?: string; message?: string };
    if (!res.ok) {
      throw new Error(json.message ?? `linkedin_error:${res.status}`);
    }
    return json.id ?? "linkedin_ok";
  },
};
