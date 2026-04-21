import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { signOAuthState } from "@/lib/oauth-state";

const q = z.object({
  brandEntityId: z.string().uuid(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = q.safeParse({
    brandEntityId: url.searchParams.get("brandEntityId"),
  });
  if (!parsed.success || !env.META_APP_ID) {
    return NextResponse.json(
      { error: "invalid_query_or_meta_not_configured" },
      { status: 400 },
    );
  }
  const base = env.AUTH_URL ?? url.origin;
  const redirectUri = `${base}/api/oauth/meta/callback`;
  const state = await signOAuthState({
    brandEntityId: parsed.data.brandEntityId,
    provider: "meta",
  });
  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", env.META_APP_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set(
    "scope",
    "pages_show_list,pages_manage_posts,business_management",
  );
  authUrl.searchParams.set("response_type", "code");
  return NextResponse.redirect(authUrl.toString());
}
