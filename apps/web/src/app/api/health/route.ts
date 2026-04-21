import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { getPublishQueueMetrics } from "@/lib/publish-queue";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const redis = getRedis();
  let redisOk: boolean | null = null;
  if (redis) {
    try {
      const pong = await redis.ping();
      redisOk = pong === "PONG";
    } catch {
      redisOk = false;
    }
  }
  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const publish = await getPublishQueueMetrics();
  const ok = dbOk && (redis ? redisOk === true : true);
  return NextResponse.json(
    {
      ok,
      db: dbOk ? "up" : "down",
      redis: redis ? (redisOk ? "up" : "down") : "optional_missing",
      publishQueue: publish,
      ts: new Date().toISOString(),
      instance: nanoid(8),
    },
    { status: ok ? 200 : 503 },
  );
}
