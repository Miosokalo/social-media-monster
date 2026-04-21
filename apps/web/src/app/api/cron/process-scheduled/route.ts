import { and, eq, isNotNull, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledPosts } from "@/db/schema";
import { env } from "@/env";
import { enqueuePublish } from "@/lib/publish-queue";
import { log } from "@/lib/logger";

/** Call from Vercel Cron / external scheduler with Authorization: Bearer CRON_SECRET */
export async function POST(req: Request) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const due = await db
    .select()
    .from(scheduledPosts)
    .where(
      and(
        eq(scheduledPosts.status, "scheduled"),
        isNotNull(scheduledPosts.scheduledFor),
        lte(scheduledPosts.scheduledFor, now),
      ),
    )
    .limit(100);
  let n = 0;
  for (const row of due) {
    await enqueuePublish(row.id);
    n += 1;
  }
  log.info("cron_process_scheduled", { count: n });
  return NextResponse.json({ processed: n });
}
