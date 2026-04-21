import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  contentProjects,
  workingDocumentRevisions,
} from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

const patchSchema = z.object({
  contentMd: z.string().max(500000),
});

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const session = await auth();
  const w = await requireWorkspace();
  if (w.error || !session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [p] = await db
    .select()
    .from(contentProjects)
    .where(
      and(
        eq(contentProjects.id, projectId),
        eq(contentProjects.workspaceId, w.workspace.id),
      ),
    )
    .limit(1);
  if (!p) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const [latest] = await db
    .select()
    .from(workingDocumentRevisions)
    .where(eq(workingDocumentRevisions.projectId, projectId))
    .orderBy(desc(workingDocumentRevisions.revision))
    .limit(1);
  const nextRev = (latest?.revision ?? 0) + 1;
  const [rev] = await db
    .insert(workingDocumentRevisions)
    .values({
      projectId,
      contentMd: parsed.data.contentMd,
      revision: nextRev,
      createdBy: session.user.id,
    })
    .returning();
  await db
    .update(contentProjects)
    .set({ updatedAt: new Date() })
    .where(eq(contentProjects.id, projectId));
  return NextResponse.json({ revision: rev });
}
