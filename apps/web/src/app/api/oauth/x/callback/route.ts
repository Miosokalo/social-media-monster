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
  if (!code || !state || !env.X_CLIENT_ID || !env.X_CLIENT_SECRET) {
    return NextResponse.json({ error: "invalid_callback" }, { status: 400 });
  }
  let st: {
    brandEntityId: string;
    provider?: string;
    code_verifier?: string;
  };
  try {
    st = await verifyOAuthState(state);
  } catch {
    return NextResponse.json({ error: "bad_state" }, { status: 400 });
  }
  if (st.provider !== "x" || !st.code_verifier) {
    return NextResponse.json({ error: "bad_state" }, { status: 400 });
  }
  const base = env.AUTH_URL ?? url.origin;
  const redirectUri = `${base}/api/oauth/x/callback`;
  const basic = Buffer.from(
    `${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`,
  ).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: st.code_verifier,
    client_id: env.X_CLIENT_ID,
  });
  const tr = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
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
      {
        error:
          tj.error_description ?? tj.error ?? "token_exchange_failed",
      },
      { status: 400 },
    );
  }
  const meRes = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=name,username",
    {
      headers: { Authorization: `Bearer ${tj.access_token}` },
    },
  );
  const meJson = (await meRes.json()) as {
    data?: { id: string; name?: string; username?: string };
  };
  const un = meJson.data?.username;
  const label = un ? `@${un}` : meJson.data?.name ?? "X (Twitter)";
  const [be] = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.id, st.brandEntityId))
    .limit(1);
  if (!be) {
    return NextResponse.json({ error: "brand_not_found" }, { status: 404 });
  }
  const expiresAt =
    typeof tj.expires_in === "number"
      ? new Date(Date.now() + tj.expires_in * 1000)
      : null;
  await db.insert(connectedAccounts).values({
    brandEntityId: st.brandEntityId,
    platform: "x",
    label: `@${label}`,
    externalAccountId: meJson.data?.id ?? null,
    accessTokenEnc: encryptSecret(tj.access_token),
    refreshTokenEnc: tj.refresh_token
      ? encryptSecret(tj.refresh_token)
      : null,
    expiresAt,
  });
  return NextResponse.redirect(new URL("/settings?oauth=x_ok", url.origin));
}
