import { count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contentProjects } from "@/db/schema";
import { getEffectiveLimits } from "@/lib/limits";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET() {
  const ctx = await requireWorkspace();
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(contentProjects)
    .where(eq(contentProjects.workspaceId, ctx.workspace.id))
    .orderBy(desc(contentProjects.updatedAt));
  return NextResponse.json({ projects: rows });
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  brandEntityId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const ctx = await requireWorkspace();
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }
  const limits = getEffectiveLimits({
    isFounderService: ctx.isFounderService,
    subscriptionStatus: ctx.workspace.subscriptionStatus,
  });
  const countRows = await db
    .select({ c: count() })
    .from(contentProjects)
    .where(eq(contentProjects.workspaceId, ctx.workspace.id));
  const projectCount = Number(countRows[0]?.c ?? 0);
  if (projectCount >= limits.maxProjects) {
    return NextResponse.json({ error: "project_limit" }, { status: 402 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const [p] = await db
    .insert(contentProjects)
    .values({
      workspaceId: ctx.workspace.id,
      brandEntityId: parsed.data.brandEntityId ?? null,
      title: parsed.data.title,
    })
    .returning();
  return NextResponse.json({ project: p });
}
