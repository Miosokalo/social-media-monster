import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { connectedAccounts } from "@/db/schema";
import { encryptSecret } from "@/lib/crypto/tokens";
import {
  deleteOAuthSession,
  loadMetaPendingForWorkspace,
} from "@/lib/oauth-meta-pending";
import { requireWorkspace } from "@/lib/workspace-context";

const bodySchema = z.object({
  sessionId: z.string().min(1),
  pageId: z.string().min(1),
});

export async function POST(req: Request) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const loaded = await loadMetaPendingForWorkspace(
    parsed.data.sessionId,
    w.workspace.id,
  );
  if (!loaded) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });
  }
  const page = loaded.payload.pages.find((p) => p.id === parsed.data.pageId);
  if (!page) {
    return NextResponse.json({ error: "page_not_found" }, { status: 404 });
  }
  await db.insert(connectedAccounts).values({
    brandEntityId: loaded.brandEntityId,
    platform: "meta_facebook",
    label: page.name,
    externalAccountId: page.id,
    accessTokenEnc: encryptSecret(page.access_token),
    expiresAt: null,
  });
  await deleteOAuthSession(parsed.data.sessionId);
  return NextResponse.json({ ok: true });
}
