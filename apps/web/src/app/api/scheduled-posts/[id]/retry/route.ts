import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledPosts } from "@/db/schema";
import { markPublishingAndEnqueue } from "@/lib/publish-queue";
import { requireWorkspace } from "@/lib/workspace-context";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const { id } = await ctx.params;
  const [row] = await db
    .select()
    .from(scheduledPosts)
    .where(eq(scheduledPosts.id, id))
    .limit(1);
  if (!row || row.workspaceId !== w.workspace.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (row.status !== "failed" && row.status !== "cancelled") {
    return NextResponse.json(
      { error: "invalid_status_for_retry" },
      { status: 400 },
    );
  }
  await db
    .update(scheduledPosts)
    .set({
      lastError: null,
      attemptCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(scheduledPosts.id, id));
  await markPublishingAndEnqueue(id);
  return NextResponse.json({ ok: true });
}
