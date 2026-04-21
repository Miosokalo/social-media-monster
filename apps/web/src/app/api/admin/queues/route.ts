import { NextResponse } from "next/server";
import { env } from "@/env";
import {
  getDlqWaitingCount,
  getPublishQueueMetrics,
} from "@/lib/publish-queue";

/** Inspect BullMQ metrics (Bearer CRON_SECRET). */
export async function GET(req: Request) {
  const secret = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const publish = await getPublishQueueMetrics();
  const dlqWaiting = await getDlqWaitingCount();
  return NextResponse.json({
    publish,
    dlqWaiting,
  });
}
