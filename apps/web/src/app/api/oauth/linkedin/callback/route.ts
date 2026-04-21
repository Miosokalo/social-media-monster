import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { brandEntities, connectedAccounts } from "@/db/schema";
import { env } from "@/env";
import { encryptSecret } from "@/lib/crypto/tokens";
import { verifyOAuthState } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(new URL("/settings?oauth=error", url.origin));
  }
  if (!code || !state || !env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) {
    return NextResponse.json({ error: "invalid_callback" }, { status: 400 });
  }
  let st: { brandEntityId: string; provider?: string };
  try {
    st = await verifyOAuthState(state);
  } catch {
    return NextResponse.json({ error: "bad_state" }, { status: 400 });
  }
  if (st.provider !== "linkedin") {
    return NextResponse.json({ error: "bad_state" }, { status: 400 });
  }
  const base = env.AUTH_URL ?? url.origin;
  const redirectUri = `${base}/api/oauth/linkedin/callback`;
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET,
  });
  const tr = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tj = (await tr.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!tr.ok || !tj.access_token) {
    return NextResponse.json(
      { error: tj.error_description ?? tj.error ?? "token_exchange_failed" },
      { status: 400 },
    );
  }
  const me = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tj.access_token}` },
  });
  const profile = (await me.json()) as { sub?: string; name?: string };
  if (!profile.sub) {
    return NextResponse.json({ error: "linkedin_no_sub" }, { status: 400 });
  }
  const [be] = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.id, st.brandEntityId))
    .limit(1);
  if (!be) {
    return NextResponse.json({ error: "brand_not_found" }, { status: 404 });
  }
  const urn = `urn:li:person:${profile.sub}`;
  const expiresAt =
    typeof tj.expires_in === "number"
      ? new Date(Date.now() + tj.expires_in * 1000)
      : null;
  await db.insert(connectedAccounts).values({
    brandEntityId: st.brandEntityId,
    platform: "linkedin",
    label: profile.name ?? "LinkedIn",
    externalAccountId: urn,
    accessTokenEnc: encryptSecret(tj.access_token),
    refreshTokenEnc: tj.refresh_token
      ? encryptSecret(tj.refresh_token)
      : null,
    expiresAt,
  });
  return NextResponse.redirect(new URL("/settings?oauth=linkedin_ok", url.origin));
}
