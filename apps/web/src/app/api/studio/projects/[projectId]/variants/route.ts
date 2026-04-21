import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { platformSchema } from "@smm/shared";
import { db } from "@/db";
import {
  channelVariants,
  contentProjects,
  metaPosts,
} from "@/db/schema";
import { generateChannelVariants } from "@/lib/variants-generate";
import { requireWorkspace } from "@/lib/workspace-context";

const bodySchema = z.object({
  metaPostId: z.string().uuid(),
  platforms: z.array(platformSchema).min(1).max(12),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
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
  const [m] = await db
    .select()
    .from(metaPosts)
    .where(
      and(
        eq(metaPosts.id, parsed.data.metaPostId),
        eq(metaPosts.projectId, projectId),
      ),
    )
    .limit(1);
  if (!m) {
    return NextResponse.json({ error: "meta_not_found" }, { status: 404 });
  }

  try {
    const gen = await generateChannelVariants({
      metaTitle: m.title,
      metaBody: m.body,
      platforms: parsed.data.platforms,
    });
    const rows = await db.transaction(async (tx) => {
      const out: (typeof channelVariants.$inferSelect)[] = [];
      for (const v of gen) {
        const [row] = await tx
          .insert(channelVariants)
          .values({
            metaPostId: m.id,
            platform: v.platform,
            payload: v.payload,
            status: "draft",
          })
          .returning();
        if (row) out.push(row);
      }
      return out;
    });
    return NextResponse.json({ variants: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "llm_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "variants_failed", detail: msg }, { status: 500 });
  }
}
