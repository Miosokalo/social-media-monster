import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  chatMessages,
  contentProjects,
  workingDocumentRevisions,
} from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
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
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.projectId, projectId))
    .orderBy(chatMessages.createdAt);
  const [rev] = await db
    .select()
    .from(workingDocumentRevisions)
    .where(eq(workingDocumentRevisions.projectId, projectId))
    .orderBy(desc(workingDocumentRevisions.revision))
    .limit(1);
  return NextResponse.json({
    project: p,
    messages,
    document: rev ?? null,
  });
}
