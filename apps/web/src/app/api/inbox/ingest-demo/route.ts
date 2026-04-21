import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { inboxItems } from "@/db/schema";
import { applyModerationRules } from "@/lib/inbox/moderation-engine";
import { requireWorkspace } from "@/lib/workspace-context";

/** Dev helper: creates a sample inbox item and runs moderation rules. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const snippet = "Test comment with keyword spam-offer";
  const [item] = await db
    .insert(inboxItems)
    .values({
      workspaceId: w.workspace.id,
      platform: "demo",
      externalId: nanoid(),
      kind: "comment",
      snippet,
      payload: { demo: true },
    })
    .returning();
  if (!item) {
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }
  await applyModerationRules(w.workspace.id, item.id, snippet);
  return NextResponse.json({ item });
}
