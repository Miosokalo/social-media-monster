import { Queue } from "bullmq";
import { eq } from "drizzle-orm";
import { getRedis } from "@/lib/redis";
import { db } from "@/db";
import { scheduledPosts } from "@/db/schema";
import { processPublishJob } from "@/lib/publish-runner";

const QUEUE = "publish";
const DLQ = "publish_dlq";

let queue: Queue | null = null;
let dlq: Queue | null = null;

function getQueue(): Queue | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!queue) {
    queue = new Queue(QUEUE, { connection: redis });
  }
  return queue;
}

function getDlq(): Queue | null {
  const redis = getRedis();
  if (!redis) return null;
  if (!dlq) {
    dlq = new Queue(DLQ, { connection: redis });
  }
  return dlq;
}

export async function enqueuePublish(
  scheduledPostId: string,
  opts?: { delayMs?: number },
) {
  const q = getQueue();
  if (!q) {
    await processPublishJob({ scheduledPostId });
    return;
  }
  const delay = Math.max(0, opts?.delayMs ?? 0);
  await q.add(
    "publish",
    { scheduledPostId },
    {
      removeOnComplete: true,
      attempts: 5,
      backoff: { type: "exponential", delay: 8000 },
      delay,
    },
  );
}

/** Record permanent failure for observability (DLQ). */
export async function enqueueDlq(scheduledPostId: string, reason: string) {
  const q = getDlq();
  if (!q) return;
  await q.add(
    "failed_publish",
    { scheduledPostId, reason },
    { removeOnComplete: 100 },
  );
}

export async function markPublishingAndEnqueue(
  scheduledPostId: string,
  opts?: { delayMs?: number },
) {
  await db
    .update(scheduledPosts)
    .set({
      status: "queued",
      updatedAt: new Date(),
    })
    .where(eq(scheduledPosts.id, scheduledPostId));
  await enqueuePublish(scheduledPostId, opts);
}

export async function getPublishQueueMetrics(): Promise<{
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
} | null> {
  const q = getQueue();
  if (!q) return null;
  const [waiting, active, delayed, failed] = await Promise.all([
    q.getWaitingCount(),
    q.getActiveCount(),
    q.getDelayedCount(),
    q.getFailedCount(),
  ]);
  return { waiting, active, delayed, failed };
}

export async function getDlqWaitingCount(): Promise<number | null> {
  const q = getDlq();
  if (!q) return null;
  return q.getWaitingCount();
}
