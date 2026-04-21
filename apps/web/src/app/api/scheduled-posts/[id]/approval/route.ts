import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { scheduledPosts } from "@/db/schema";
import { enqueuePublish, markPublishingAndEnqueue } from "@/lib/publish-queue";
import { getRedis } from "@/lib/redis";
import { requireWorkspace } from "@/lib/workspace-context";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
});

function canApprove(role: string) {
  return role === "owner" || role === "admin";
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  if (!canApprove(w.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const [row] = await db
    .select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.id, id))
    .limit(1);
  if (!row || row.workspaceId !== w.workspace.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (parsed.data.action === "reject") {
    await db
      .update(scheduledPosts)
      .set({
        approvalStatus: "rejected",
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(scheduledPosts.id, id));
    return NextResponse.json({ ok: true });
  }
  await db
    .update(scheduledPosts)
    .set({
      approvalStatus: "approved",
      status: "scheduled",
      updatedAt: new Date(),
    })
    .where(eq(scheduledPosts.id, id));
  const due =
    row.scheduledFor && row.scheduledFor.getTime() <= Date.now();
  if (due) {
    await markPublishingAndEnqueue(id);
  } else if (getRedis() && row.scheduledFor) {
    await enqueuePublish(id, {
      delayMs: row.scheduledFor.getTime() - Date.now(),
    });
  }
  return NextResponse.json({ ok: true });
}
