import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { inboxItems } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

const bodySchema = z.object({
  text: z.string().min(1).max(8000),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const [row] = await db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.id, id))
    .limit(1);
  if (!row || row.workspaceId !== w.workspace.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (row.platform !== "demo") {
    return NextResponse.json(
      { error: "platform_reply_not_implemented" },
      { status: 501 },
    );
  }
  const payload = (row.payload as Record<string, unknown>) ?? {};
  await db
    .update(inboxItems)
    .set({
      payload: {
        ...payload,
        reply: parsed.data.text,
        repliedAt: new Date().toISOString(),
      },
      status: "done",
      updatedAt: new Date(),
    })
    .where(eq(inboxItems.id, id));
  return NextResponse.json({ ok: true });
}
