import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { analyticsSnapshots } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

const ingestSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  metrics: z.record(z.unknown()),
});

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
    .limit(90);
  return NextResponse.json({ snapshots: rows });
}

/** Manual ingest — restricted to founder service accounts (testing). */
export async function POST(req: Request) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  if (!w.isFounderService) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = ingestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const [s] = await db
    .insert(analyticsSnapshots)
    .values({
      workspaceId: w.workspace.id,
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
      metrics: parsed.data.metrics,
    })
    .returning();
  return NextResponse.json({ snapshot: s });
}
