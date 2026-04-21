import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { inboxItems } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.workspaceId, w.workspace.id))
    .orderBy(desc(inboxItems.createdAt))
    .limit(200);
  return NextResponse.json({ items: rows });
}
