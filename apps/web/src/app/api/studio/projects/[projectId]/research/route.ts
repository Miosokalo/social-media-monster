import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentProjects } from "@/db/schema";
import { fetchUrlSafe } from "@/lib/research/fetch-safe";
import { requireWorkspace } from "@/lib/workspace-context";

const bodySchema = z.object({
  url: z.string().url(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const session = await auth();
  const w = await requireWorkspace();
  if (w.error || !session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    const out = await fetchUrlSafe(parsed.data.url);
    return NextResponse.json({
      excerpt: out.text.slice(0, 8000),
      contentType: out.contentType,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch_failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
