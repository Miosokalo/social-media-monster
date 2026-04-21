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
  if (!parsed.success || !env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "invalid_query_or_linkedin_not_configured" },
      { status: 400 },
    );
  }
  const base = env.AUTH_URL ?? url.origin;
  const redirectUri = `${base}/api/oauth/linkedin/callback`;
  const state = await signOAuthState({
    brandEntityId: parsed.data.brandEntityId,
    provider: "linkedin",
  });
  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.LINKEDIN_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", "openid profile email w_member_social");
  return NextResponse.redirect(authUrl.toString());
}
