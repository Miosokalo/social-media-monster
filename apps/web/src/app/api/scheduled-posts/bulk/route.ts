import { NextResponse } from "next/server";
import { z } from "zod";
import { markPublishingAndEnqueue } from "@/lib/publish-queue";
import { requireWorkspace } from "@/lib/workspace-context";
import { db } from "@/db";
import {
  channelVariants,
  contentProjects,
  metaPosts,
  scheduledPosts,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

const bodySchema = z.object({
  channelVariantIds: z.array(z.string().uuid()).min(1).max(50),
  scheduledFor: z.string().datetime().optional(),
  publishNow: z.boolean().optional(),
});

export async function POST(req: Request) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const ids = parsed.data.channelVariantIds;
  const variants = await db
    .select({
      variant: channelVariants,
      meta: metaPosts,
      project: contentProjects,
    })
    .from(channelVariants)
    .innerJoin(metaPosts, eq(metaPosts.id, channelVariants.metaPostId))
    .innerJoin(contentProjects, eq(contentProjects.id, metaPosts.projectId))
    .where(inArray(channelVariants.id, ids));

  const out: string[] = [];
  const scheduledFor = parsed.data.publishNow
    ? new Date()
    : parsed.data.scheduledFor
      ? new Date(parsed.data.scheduledFor)
      : new Date();

  for (const row of variants) {
    if (row.project.workspaceId !== w.workspace.id) continue;
    const payload = row.variant.payload as { body?: string; headline?: string };
    const [sp] = await db
      .insert(scheduledPosts)
      .values({
        workspaceId: w.workspace.id,
        brandEntityId: row.project.brandEntityId,
        channelVariantId: row.variant.id,
        connectedAccountId: row.variant.connectedAccountId,
        platform: row.variant.platform,
        contentSnapshot: {
          headline: payload.headline,
          body: payload.body,
        },
        scheduledFor,
        status: parsed.data.publishNow ? "queued" : "scheduled",
      })
      .returning();
    if (sp?.id) {
      out.push(sp.id);
      if (parsed.data.publishNow || scheduledFor <= new Date()) {
        await markPublishingAndEnqueue(sp.id);
      }
    }
  }

  return NextResponse.json({ scheduledPostIds: out });
}
