import { Worker } from "bullmq";
import { enqueueDlq } from "../lib/publish-queue";
import { getRedis } from "../lib/redis";
import { processPublishJob } from "../lib/publish-runner";

const redis = getRedis();
if (!redis) {
  console.error("REDIS_URL not set — worker exiting.");
  process.exit(1);
}

const worker = new Worker(
  "publish",
  async (job) => {
    const scheduledPostId = job.data?.scheduledPostId as string;
    if (!scheduledPostId) throw new Error("missing scheduledPostId");
    await processPublishJob({ scheduledPostId });
  },
  { connection: redis },
);

worker.on("failed", async (job, err) => {
  console.error("Job failed", job?.id, err);
  const id = job?.data?.scheduledPostId as string | undefined;
  if (id) {
    await enqueueDlq(id, err instanceof Error ? err.message : "failed");
  }
});

console.log("Publish worker started.");
