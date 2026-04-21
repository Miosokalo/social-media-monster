import type { PlatformPublisher, PublishInput } from "@/lib/platforms/types";

/**
 * Publishes a text post to a Facebook Page via Graph API.
 * Requires a Page access token with pages_manage_posts.
 */
export const metaFacebookPublisher: PlatformPublisher = {
  async publish(input: PublishInput) {
    const pageId = input.externalAccountId;
    if (!pageId) {
      throw new Error("meta_missing_page_id");
    }
    const message = [input.snapshot.headline, input.snapshot.body]
      .filter(Boolean)
      .join("\n\n");
    const url = new URL(`https://graph.facebook.com/v21.0/${pageId}/feed`);
    url.searchParams.set("message", message.slice(0, 8000));
    url.searchParams.set("access_token", input.accessToken);
    const res = await fetch(url.toString(), { method: "POST" });
    const json = (await res.json()) as { id?: string; error?: { message?: string } };
    if (!res.ok || json.error) {
      throw new Error(
        json.error?.message ?? `meta_feed_error:${res.status}`,
      );
    }
    if (!json.id) throw new Error("meta_no_post_id");
    return json.id;
  },
};
