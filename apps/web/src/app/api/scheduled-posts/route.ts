import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  channelVariants,
  contentProjects,
  metaPosts,
  scheduledPosts,
} from "@/db/schema";
import { enqueuePublish, markPublishingAndEnqueue } from "@/lib/publish-queue";
import { writeAuditLog } from "@/lib/audit";
import { assertQuota } from "@/lib/quota";
import { getRedis } from "@/lib/redis";
import { requireWorkspace } from "@/lib/workspace-context";

const createSchema = z.object({
  channelVariantId: z.string().uuid(),
  scheduledFor: z.string().datetime().optional(),
  publishNow: z.boolean().optional(),
  /** If true, stays draft until admin approves via approval API. */
  submitForReview: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const [v] = await db
    .select({
      variant: channelVariants,
      meta: metaPosts,
      project: contentProjects,
    })
    .from(channelVariants)
    .innerJoin(metaPosts, eq(metaPosts.id, channelVariants.metaPostId))
    .innerJoin(contentProjects, eq(contentProjects.id, metaPosts.projectId))
    .where(eq(channelVariants.id, parsed.data.channelVariantId))
    .limit(1);

  if (!v || v.project.workspaceId !== w.workspace.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const quota = await assertQuota({
    workspaceId: w.workspace.id,
    subscriptionStatus: w.workspace.subscriptionStatus,
    isFounderService: w.isFounderService,
    kind: "publish",
  });
  if (!quota.ok) {
    return NextResponse.json({ error: quota.code }, { status: 402 });
  }

  const payload = v.variant.payload as { body?: string; headline?: string };
  const scheduledFor = parsed.data.publishNow
    ? new Date()
    : parsed.data.scheduledFor
      ? new Date(parsed.data.scheduledFor)
      : new Date();

  const needsReview = parsed.data.submitForReview === true;
  const postStatus = needsReview
    ? "draft"
    : parsed.data.publishNow
      ? "queued"
      : "scheduled";
  const approvalStatus = needsReview ? "pending_review" : "approved";

  const [sp] = await db
    .insert(scheduledPosts)
    .values({
      workspaceId: w.workspace.id,
      brandEntityId: v.project.brandEntityId,
      channelVariantId: v.variant.id,
      connectedAccountId: v.variant.connectedAccountId,
      platform: v.variant.platform,
      contentSnapshot: {
        headline: payload.headline,
        body: payload.body,
      },
      scheduledFor,
      status: postStatus,
      idempotencyKey: nanoid(24),
      approvalStatus,
    })
    .returning();

  if (!sp) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  const now = Date.now();
  const due = scheduledFor.getTime() <= now;
  if (!needsReview && (parsed.data.publishNow || due)) {
    await markPublishingAndEnqueue(sp.id);
  } else if (!needsReview && getRedis() && !due) {
    await enqueuePublish(sp.id, {
      delayMs: scheduledFor.getTime() - now,
    });
  }

  if (session?.user?.id) {
    await writeAuditLog({
      workspaceId: w.workspace.id,
      userId: session.user.id,
      action: "post.schedule",
      entityType: "scheduled_post",
      entityId: sp.id,
    });
  }

  return NextResponse.json({ scheduledPost: sp });
}

export async function GET() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.workspaceId, w.workspace.id));
  return NextResponse.json({ scheduledPosts: rows });
}
