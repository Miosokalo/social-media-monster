import { eq } from "drizzle-orm";
import { db } from "@/db";
import { connectedAccounts, scheduledPosts } from "@/db/schema";
import { decryptSecret } from "@/lib/crypto/tokens";
import { publishForPlatform } from "@/lib/platforms/registry";
import { log } from "@/lib/logger";
import { incrementPublishedPosts } from "@/lib/usage";

export async function processPublishJob(opts: { scheduledPostId: string }) {
  const [row] = await db
    .select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.id, opts.scheduledPostId))
    .limit(1);
  if (!row) return;

  if (row.status === "published" && row.externalPostId) {
    log.info("publish_skip_already_done", {
      scheduledPostId: row.id,
      externalPostId: row.externalPostId,
    });
    return;
  }

  if (row.status === "scheduled") {
    await db
      .update(scheduledPosts)
      .set({ status: "queued", updatedAt: new Date() })
      .where(eq(scheduledPosts.id, row.id));
  }

  if (row.approvalStatus !== "approved") {
    await db
      .update(scheduledPosts)
      .set({
        status: "failed",
        lastError: "not_approved",
        updatedAt: new Date(),
      })
      .where(eq(scheduledPosts.id, row.id));
    return;
  }

  await db
    .update(scheduledPosts)
    .set({ status: "publishing", updatedAt: new Date() })
    .where(eq(scheduledPosts.id, row.id));

  try {
    let accessToken = "";
    let externalAccountId: string | null = null;

    if (row.connectedAccountId) {
      const [acc] = await db
        .select()
        .from(connectedAccounts)
        .where(eq(connectedAccounts.id, row.connectedAccountId))
        .limit(1);
      if (acc?.accessTokenEnc) {
        accessToken = decryptSecret(acc.accessTokenEnc);
      }
      externalAccountId = acc?.externalAccountId ?? null;
    }

    if (row.platform !== "demo" && !accessToken) {
      throw new Error("missing_access_token");
    }

    const externalPostId = await publishForPlatform(row.platform, {
      snapshot: row.contentSnapshot as { body?: string; headline?: string },
      accessToken: accessToken || "unused",
      externalAccountId,
    });

    await db
      .update(scheduledPosts)
      .set({
        status: "published",
        externalPostId,
        lastError: null,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(scheduledPosts.id, row.id));
    await incrementPublishedPosts(row.workspaceId);
    log.info("publish_ok", { scheduledPostId: row.id, externalPostId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    log.error("publish_fail", { scheduledPostId: row.id, error: msg });
    await db
      .update(scheduledPosts)
      .set({
        status: "failed",
        lastError: msg,
        attemptCount: row.attemptCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(scheduledPosts.id, row.id));
  }
}
