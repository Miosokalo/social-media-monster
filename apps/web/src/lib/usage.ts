import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { usageMonthly } from "@/db/schema";

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function incrementPublishedPosts(workspaceId: string) {
  const mk = monthKey();
  const [existing] = await db
    .select()
    .from(usageMonthly)
    .where(
      and(
        eq(usageMonthly.workspaceId, workspaceId),
        eq(usageMonthly.monthKey, mk),
      ),
    )
    .limit(1);
  if (existing) {
    await db
      .update(usageMonthly)
      .set({
        postsPublished: sql`${usageMonthly.postsPublished} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(usageMonthly.id, existing.id));
  } else {
    await db.insert(usageMonthly).values({
      workspaceId,
      monthKey: mk,
      postsPublished: 1,
      studioMessages: 0,
    });
  }
}

export async function incrementStudioMessages(workspaceId: string) {
  const mk = monthKey();
  const [existing] = await db
    .select()
    .from(usageMonthly)
    .where(
      and(
        eq(usageMonthly.workspaceId, workspaceId),
        eq(usageMonthly.monthKey, mk),
      ),
    )
    .limit(1);
  if (existing) {
    await db
      .update(usageMonthly)
      .set({
        studioMessages: sql`${usageMonthly.studioMessages} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(usageMonthly.id, existing.id));
  } else {
    await db.insert(usageMonthly).values({
      workspaceId,
      monthKey: mk,
      postsPublished: 0,
      studioMessages: 1,
    });
  }
}

export async function getMonthlyUsage(workspaceId: string) {
  const mk = monthKey();
  const [row] = await db
    .select()
    .from(usageMonthly)
    .where(
      and(
        eq(usageMonthly.workspaceId, workspaceId),
        eq(usageMonthly.monthKey, mk),
      ),
    )
    .limit(1);
  return row ?? { postsPublished: 0, studioMessages: 0 };
}
