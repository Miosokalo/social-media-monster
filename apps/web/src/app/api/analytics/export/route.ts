import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsSnapshots } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(analyticsSnapshots)
    .where(eq(analyticsSnapshots.workspaceId, w.workspace.id))
    .orderBy(desc(analyticsSnapshots.periodEnd))
    .limit(500);
  const header = [
    "id",
    "period_start",
    "period_end",
    "metrics_json",
  ].join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      r.periodStart.toISOString(),
      r.periodEnd.toISOString(),
      JSON.stringify(r.metrics ?? {}).replaceAll(",", ";"),
    ].join(","),
  );
  const csv = [header, ...lines].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analytics-${w.workspace.slug}.csv"`,
    },
  });
}
