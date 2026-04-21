import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { studioChatModeSchema } from "@smm/shared";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  chatMessages,
  contentProjects,
  workingDocumentRevisions,
} from "@/db/schema";
import { env } from "@/env";
import { writeAuditLog } from "@/lib/audit";
import { assertQuota } from "@/lib/quota";
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
    return new Response("unauthorized", { status: 401 });
  }
  const q = await assertQuota({
    workspaceId: w.workspace.id,
    subscriptionStatus: w.workspace.subscriptionStatus,
    isFounderService: w.isFounderService,
    kind: "studio_message",
  });
  if (!q.ok) {
    return new Response(q.code, { status: 402 });
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
    return new Response("not_found", { status: 404 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return new Response("invalid_body", { status: 400 });
  }
  if (!env.OPENAI_API_KEY) {
    return new Response("llm_not_configured", { status: 503 });
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
  const system = [
    "Du bist ein Social-Media-Stratege. Working Doc (Markdown):\n---\n",
    workingDoc || "(leer)",
    "\n---\nModus: antworte knapp im Chat; Doc-Updates separat im nicht-streaming Flow.",
  ].join("\n");

  const mode = parsed.data.mode;
  const result = streamText({
    model: openai(env.OPENAI_MODEL),
    system,
    messages: history.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    temperature: 0.5,
    onFinish: async ({ text }) => {
      await db.insert(chatMessages).values({
        projectId,
        role: "assistant",
        content: text,
        mode,
      });
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
    },
  });

  return result.toTextStreamResponse();
}
