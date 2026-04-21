import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listWorkspacesForUser } from "@/lib/workspace-context";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const list = await listWorkspacesForUser(session.user.id);
  return NextResponse.json({ workspaces: list });
}
