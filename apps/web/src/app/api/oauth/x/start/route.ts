import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/env";
import { generatePkcePair } from "@/lib/oauth-pkce";
import { signOAuthState } from "@/lib/oauth-state";

const q = z.object({
  brandEntityId: z.string().uuid(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = q.safeParse({
    brandEntityId: url.searchParams.get("brandEntityId"),
  });
  if (!parsed.success || !env.X_CLIENT_ID || !env.X_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "invalid_query_or_x_not_configured" },
      { status: 400 },
    );
  }
  const base = env.AUTH_URL ?? url.origin;
  const redirectUri = `${base}/api/oauth/x/callback`;
  const { verifier, challenge } = generatePkcePair();
  const state = await signOAuthState({
    brandEntityId: parsed.data.brandEntityId,
    provider: "x",
    code_verifier: verifier,
  });
  const scope = ["tweet.read", "tweet.write", "users.read", "offline.access"].join(
    " ",
  );
  const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.X_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  return NextResponse.redirect(authUrl.toString());
}
