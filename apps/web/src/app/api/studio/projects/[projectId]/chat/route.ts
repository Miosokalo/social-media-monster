import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { studioChatModeSchema } from "@smm/shared";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  chatMessages,
  contentProjects,
  workingDocumentRevisions,
} from "@/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { assertQuota } from "@/lib/quota";
import { runStudioTurn } from "@/lib/studio-ai";
import { incrementStudioMessages } from "@/lib/usage";
import { requireWorkspace } from "@/lib/workspace-context";

const bodySchema = z.object({
  message: z.string().min(1).max(32000),
  mode: studioChatModeSchema,
});

export async function POST(
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
  const q = await assertQuota({
    workspaceId: w.workspace.id,
    subscriptionStatus: w.workspace.subscriptionStatus,
    isFounderService: w.isFounderService,
    kind: "studio_message",
  });
  if (!q.ok) {
    return NextResponse.json({ error: q.code }, { status: 402 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await db.insert(chatMessages).values({
    projectId,
    role: "user",
    content: parsed.data.message,
    mode: parsed.data.mode,
  });

  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.projectId, projectId))
    .orderBy(chatMessages.createdAt);

  const [latest] = await db
    .select()
    .from(workingDocumentRevisions)
    .where(eq(workingDocumentRevisions.projectId, projectId))
    .orderBy(desc(workingDocumentRevisions.revision))
    .limit(1);

  const workingDoc = latest?.contentMd ?? "";
  const convo = history.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("assistant" as const),
    content: m.content,
  }));

  try {
    const out = await runStudioTurn({
      mode: parsed.data.mode,
      workingDocument: workingDoc,
      messages: convo,
    });
    await db.insert(chatMessages).values({
      projectId,
      role: "assistant",
      content: out.chat,
      mode: parsed.data.mode,
    });

    let revision = latest;
    if (
      out.documentMarkdown !== undefined &&
      out.documentMarkdown !== workingDoc
    ) {
      const nextRev = (latest?.revision ?? 0) + 1;
      const [r] = await db
        .insert(workingDocumentRevisions)
        .values({
          projectId,
          contentMd: out.documentMarkdown,
          revision: nextRev,
          createdBy: session.user.id,
        })
        .returning();
      revision = r;
    }

    await db
      .update(contentProjects)
      .set({ updatedAt: new Date() })
      .where(eq(contentProjects.id, projectId));

    await incrementStudioMessages(w.workspace.id);
    await writeAuditLog({
      workspaceId: w.workspace.id,
      userId: session.user.id,
      action: "studio.chat_turn",
      entityType: "content_project",
      entityId: projectId,
    });

    return NextResponse.json({
      reply: out.chat,
      documentMarkdown: out.documentMarkdown ?? workingDoc,
      revision,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "llm_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "llm_failed", detail: msg }, { status: 500 });
  }
}
