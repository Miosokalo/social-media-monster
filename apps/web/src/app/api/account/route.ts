import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";

const delSchema = z.object({
  confirmEmail: z.string().email(),
});

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = delSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (parsed.data.confirmEmail.toLowerCase() !== session.user.email.toLowerCase()) {
    return NextResponse.json({ error: "email_mismatch" }, { status: 400 });
  }

  const memberships = await db
    .select()
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, session.user.id));

  await db.transaction(async (tx) => {
    for (const m of memberships) {
      const all = await tx
        .select()
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, m.workspaceId));
      if (all.length <= 1) {
        await tx.delete(workspaces).where(eq(workspaces.id, m.workspaceId));
      } else {
        await tx.delete(workspaceMembers).where(eq(workspaceMembers.id, m.id));
      }
    }
    await tx.delete(users).where(eq(users.id, session.user.id));
  });

  return NextResponse.json({ ok: true });
}
