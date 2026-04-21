import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import {
  listBrandEntities,
  requireWorkspace,
} from "@/lib/workspace-context";

export async function GET() {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const brands = await listBrandEntities(w.workspace.id);
  const brandIds = brands.map((b) => b.id);
  const accounts =
    brandIds.length === 0
      ? []
      : await db
          .select()
          .from(connectedAccounts)
          .where(inArray(connectedAccounts.brandEntityId, brandIds));
  return NextResponse.json({
    workspaceId: w.workspace.id,
    role: w.role,
    brands,
    connectedAccounts: accounts,
  });
}
