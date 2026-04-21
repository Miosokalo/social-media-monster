import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { brandEntities, oauthConnectSessions } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/crypto/tokens";

export type MetaPageOption = {
  id: string;
  name: string;
  access_token: string;
};

export type MetaPendingPayload = {
  pages: MetaPageOption[];
};

const TTL_MS = 15 * 60 * 1000;

export async function createMetaPendingSession(
  brandEntityId: string,
  pages: MetaPageOption[],
): Promise<string> {
  const id = nanoid(24);
  const payload: MetaPendingPayload = { pages };
  const payloadEnc = encryptSecret(JSON.stringify(payload));
  await db.insert(oauthConnectSessions).values({
    id,
    brandEntityId,
    provider: "meta_facebook",
    payloadEnc,
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return id;
}

export async function deleteOAuthSession(sessionId: string) {
  await db.delete(oauthConnectSessions).where(eq(oauthConnectSessions.id, sessionId));
}

export async function loadMetaPendingForWorkspace(
  sessionId: string,
  workspaceId: string,
): Promise<{ payload: MetaPendingPayload; brandEntityId: string } | null> {
  const [row] = await db
    .select({
      session: oauthConnectSessions,
      workspaceId: brandEntities.workspaceId,
    })
    .from(oauthConnectSessions)
    .innerJoin(
      brandEntities,
      eq(brandEntities.id, oauthConnectSessions.brandEntityId),
    )
    .where(eq(oauthConnectSessions.id, sessionId))
    .limit(1);
  if (!row || row.workspaceId !== workspaceId) return null;
  if (row.session.expiresAt.getTime() < Date.now()) return null;
  if (row.session.provider !== "meta_facebook") return null;
  try {
    const payload = JSON.parse(
      decryptSecret(row.session.payloadEnc),
    ) as MetaPendingPayload;
    return { payload, brandEntityId: row.session.brandEntityId };
  } catch {
    return null;
  }
}
