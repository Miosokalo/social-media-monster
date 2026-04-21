import { NextResponse } from "next/server";
import { loadMetaPendingForWorkspace } from "@/lib/oauth-meta-pending";
import { requireWorkspace } from "@/lib/workspace-context";

export async function GET(req: Request) {
  const w = await requireWorkspace();
  if (w.error) {
    return NextResponse.json({ error: w.error }, { status: 401 });
  }
  const sessionId = new URL(req.url).searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ error: "missing_session" }, { status: 400 });
  }
  const loaded = await loadMetaPendingForWorkspace(sessionId, w.workspace.id);
  if (!loaded) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });
  }
  return NextResponse.json({
    sessionId,
    pages: loaded.payload.pages.map((p) => ({ id: p.id, name: p.name })),
  });
}
