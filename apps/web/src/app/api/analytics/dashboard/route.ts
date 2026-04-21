import { and, eq, gte, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { scheduledPosts } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET(req: Request) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const url = new URL(req.url);
  const days = Math.min(90, Number(url.searchParams.get("days") ?? "30"));
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);

  const posts = await db
    .select({ publishedAt: scheduledPosts.publishedAt })
    .from(scheduledPosts)
    .where(
      and(
        eq(scheduledPosts.workspaceId, w.workspace.id),
        eq(scheduledPosts.status, "published"),
        isNotNull(scheduledPosts.publishedAt),
        gte(scheduledPosts.publishedAt, since),
      ),
    );

  const map = new Map<string, number>();
  for (const p of posts) {
    if (!p.publishedAt) continue;
    const day = p.publishedAt.toISOString().slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  const series = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));

  return NextResponse.json({ series });
}
