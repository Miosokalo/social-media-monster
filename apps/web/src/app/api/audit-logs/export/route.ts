import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, w.workspace.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(2000);
  const header = [
    "created_at",
    "action",
    "entity_type",
    "entity_id",
    "user_id",
  ].join(",");
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      r.action,
      r.entityType,
      r.entityId ?? "",
      r.userId ?? "",
    ].join(","),
  );
  const csv = [header, ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-${w.workspace.slug}.csv"`,
    },
  });
}
