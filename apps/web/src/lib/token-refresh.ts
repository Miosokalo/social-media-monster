import { and, eq, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import { env } from "@/env";
import { decryptSecret, encryptSecret } from "@/lib/crypto/tokens";
import { log } from "@/lib/logger";

const REFRESH_WITHIN_MS = 7 * 24 * 60 * 60 * 1000;

async function refreshLinkedIn(refreshToken: string) {
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) return null;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.LINKEDIN_CLIENT_ID,
    client_secret: env.LINKEDIN_CLIENT_SECRET,
  });
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!res.ok || !j.access_token) return null;
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token ?? refreshToken,
    expiresIn: j.expires_in,
  };
}

async function refreshX(refreshToken: string) {
  if (!env.X_CLIENT_ID || !env.X_CLIENT_SECRET) return null;
  const basic = Buffer.from(
    `${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`,
  ).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.X_CLIENT_ID,
  });
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const j = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
  };
  if (!res.ok || !j.access_token) return null;
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token ?? refreshToken,
    expiresIn: j.expires_in,
  };
}

export async function runTokenRefreshSweep(): Promise<{ updated: number }> {
  const horizon = new Date(Date.now() + REFRESH_WITHIN_MS);
  const rows = await db
    .select()
    .from(connectedAccounts)
    .where(
      and(
        isNotNull(connectedAccounts.refreshTokenEnc),
        inArray(connectedAccounts.platform, ["linkedin", "x"]),
        or(
          lte(connectedAccounts.expiresAt, horizon),
          isNull(connectedAccounts.expiresAt),
        ),
      ),
    )
    .limit(50);
  let updated = 0;
  for (const row of rows) {
    if (!row.refreshTokenEnc) continue;
    if (row.platform !== "linkedin" && row.platform !== "x") continue;
    let refreshPlain: string;
    try {
      refreshPlain = decryptSecret(row.refreshTokenEnc);
    } catch {
      continue;
    }
    const out =
      row.platform === "linkedin"
        ? await refreshLinkedIn(refreshPlain)
        : await refreshX(refreshPlain);
    if (!out) continue;
    const expiresAt =
      typeof out.expiresIn === "number"
        ? new Date(Date.now() + out.expiresIn * 1000)
        : null;
    await db
      .update(connectedAccounts)
      .set({
        accessTokenEnc: encryptSecret(out.accessToken),
        refreshTokenEnc: encryptSecret(out.refreshToken),
        expiresAt,
      })
      .where(eq(connectedAccounts.id, row.id));
    updated += 1;
    log.info("token_refreshed", { accountId: row.id, platform: row.platform });
  }
  return { updated };
}
