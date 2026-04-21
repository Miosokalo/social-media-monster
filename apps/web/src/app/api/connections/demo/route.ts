import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { brandEntities, connectedAccounts } from "@/db/schema";
import { requireWorkspace } from "@/lib/workspace-context";

/** Creates a demo connected account on the first brand entity (for local testing without OAuth). */
export async function POST() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const [be] = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.workspaceId, w.workspace.id))
    .limit(1);
  if (!be) {
    return NextResponse.json({ error: "no_brand_entity" }, { status: 400 });
  }
  const [existing] = await db
    .select()
    .from(connectedAccounts)
    .where(eq(connectedAccounts.brandEntityId, be.id))
    .limit(1);
  if (existing) {
    return NextResponse.json({ connectedAccount: existing });
  }
  const [ca] = await db
    .insert(connectedAccounts)
    .values({
      brandEntityId: be.id,
      platform: "demo",
      label: "Demo channel",
      externalAccountId: "demo-local",
    })
    .returning();
  return NextResponse.json({ connectedAccount: ca });
}
