import { and, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsSnapshots, scheduledPosts } from "@/db/schema";
import { env } from "@/env";
import { log } from "@/lib/logger";

/** Aggregates published posts per workspace into one snapshot row per run. */
export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const published = await db
    .select()
    .from(scheduledPosts)
    .where(
      and(
        eq(scheduledPosts.status, "published"),
        isNotNull(scheduledPosts.externalPostId),
      ),
    )
    .limit(2000);

  const byWs = new Map<string, number>();
  for (const p of published) {
    byWs.set(p.workspaceId, (byWs.get(p.workspaceId) ?? 0) + 1);
  }

  let n = 0;
  for (const [workspaceId, postsWithInsights] of byWs) {
    await db.insert(analyticsSnapshots).values({
      workspaceId,
      connectedAccountId: null,
      periodStart: start,
      periodEnd: end,
      metrics: {
        source: "cron_aggregate",
        publishedPostsWithExternalId: postsWithInsights,
      },
    });
    n += 1;
  }
  log.info("cron_analytics_ingest", { workspaces: n });
  return NextResponse.json({ workspaces: n });
}
