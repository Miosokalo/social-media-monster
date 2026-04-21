import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  contentProjects,
  mediaAssets,
  metaPosts,
  workingDocumentRevisions,
} from "@/db/schema";
import { generateHeroImage } from "@/lib/image-gen";
import { generateMetaPost } from "@/lib/meta-generate";
import { saveUploadedBuffer } from "@/lib/storage";
import { requireWorkspace } from "@/lib/workspace-context";

const bodySchema = z.object({
  sectionLabel: z.string().optional(),
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
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const [rev] = await db
    .select()
    .from(workingDocumentRevisions)
    .where(eq(workingDocumentRevisions.projectId, projectId))
    .orderBy(desc(workingDocumentRevisions.revision))
    .limit(1);
  const md = rev?.contentMd ?? "";
  if (!md.trim()) {
    return NextResponse.json({ error: "empty_document" }, { status: 400 });
  }

  try {
    const meta = await generateMetaPost({
      sourceMarkdown: md,
      sectionLabel: parsed.data.sectionLabel,
    });
    const img = await generateHeroImage({
      title: meta.title,
      excerpt: meta.body.slice(0, 800),
    });
    const stored = await saveUploadedBuffer({
      workspaceId: w.workspace.id,
      buffer: img,
      mimeType: "image/png",
    });
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        workspaceId: w.workspace.id,
        storageKey: stored.storageKey,
        mimeType: "image/png",
        byteSize: stored.byteSize,
        width: stored.width ?? null,
        height: stored.height ?? null,
        source: "generated",
        prompt: meta.title,
        thumbnailKey: stored.thumbnailKey ?? null,
      })
      .returning();

    const [m] = await db
      .insert(metaPosts)
      .values({
        projectId,
        title: meta.title,
        body: meta.body,
        characterCount: meta.characterCount,
        primaryMediaId: asset?.id,
        sourceSectionLabel: parsed.data.sectionLabel ?? null,
      })
      .returning();

    return NextResponse.json({ metaPost: m, media: asset });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "llm_not_configured" }, { status: 503 });
    }
    return NextResponse.json({ error: "meta_failed", detail: msg }, { status: 500 });
  }
}
