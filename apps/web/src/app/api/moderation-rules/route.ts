import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { moderationRules } from "@/db/schema";
import { canRole } from "@/lib/limits";
import { requireWorkspace } from "@/lib/workspace-context";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  matchType: z.enum(["contains", "regex"]),
  pattern: z.string().min(1).max(500),
  action: z.enum(["flag", "hide_suggested"]),
});

export async function GET() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(moderationRules)
    .where(eq(moderationRules.workspaceId, w.workspace.id));
  return NextResponse.json({ rules: rows });
}

export async function POST(req: Request) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  if (!canRole(w.role, "moderate")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const [r] = await db
    .insert(moderationRules)
    .values({
      workspaceId: w.workspace.id,
      name: parsed.data.name,
      matchType: parsed.data.matchType,
      pattern: parsed.data.pattern,
      action: parsed.data.action,
    })
    .returning();
  return NextResponse.json({ rule: r });
}
