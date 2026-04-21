import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { brandEntities, connectedAccounts } from "@/db/schema";
import { env } from "@/env";
import { encryptSecret } from "@/lib/crypto/tokens";
import { createMetaPendingSession } from "@/lib/oauth-meta-pending";
import { verifyOAuthState } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(new URL("/settings?oauth=error", url.origin));
  }
  if (!code || !state || !env.META_APP_SECRET || !env.META_APP_ID) {
    return NextResponse.json({ error: "invalid_callback" }, { status: 400 });
  }
  let st: { brandEntityId: string; provider?: string };
  try {
    st = await verifyOAuthState(state);
  } catch {
    return NextResponse.json({ error: "bad_state" }, { status: 400 });
  }
  const base = env.AUTH_URL ?? url.origin;
  const redirectUri = `${base}/api/oauth/meta/callback`;
  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", env.META_APP_ID);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("client_secret", env.META_APP_SECRET);
  tokenUrl.searchParams.set("code", code);
  const tr = await fetch(tokenUrl.toString());
  const tj = (await tr.json()) as { access_token?: string; error?: { message?: string } };
  if (!tr.ok || !tj.access_token) {
    return NextResponse.json(
      { error: tj.error?.message ?? "token_exchange_failed" },
      { status: 400 },
    );
  }
  const userToken = tj.access_token;
  const accRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?access_token=${encodeURIComponent(userToken)}`,
  );
  const accJson = (await accRes.json()) as {
    data?: { access_token: string; id: string; name: string }[];
  };
  const pages = accJson.data ?? [];
  if (pages.length === 0) {
    return NextResponse.json(
      { error: "no_facebook_page_grant" },
      { status: 400 },
    );
  }

  const [be] = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.id, st.brandEntityId))
    .limit(1);
  if (!be) {
    return NextResponse.json({ error: "brand_not_found" }, { status: 404 });
  }

  if (pages.length === 1) {
    const page = pages[0]!;
    await db.insert(connectedAccounts).values({
      brandEntityId: st.brandEntityId,
      platform: "meta_facebook",
      label: page.name ?? "Facebook Page",
      externalAccountId: page.id,
      accessTokenEnc: encryptSecret(page.access_token),
      expiresAt: null,
    });
    return NextResponse.redirect(new URL("/settings?oauth=meta_ok", url.origin));
  }

  const sessionId = await createMetaPendingSession(
    st.brandEntityId,
    pages.map((p) => ({
      id: p.id,
      name: p.name ?? "Page",
      access_token: p.access_token,
    })),
  );
  return NextResponse.redirect(
    new URL(
      `/settings/oauth-meta-pick?session=${encodeURIComponent(sessionId)}`,
      url.origin,
    ),
  );
}
