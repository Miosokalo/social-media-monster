import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET(req: Request) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") ?? "50")),
  );
  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, w.workspace.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
  return NextResponse.json({ logs: rows });
}
