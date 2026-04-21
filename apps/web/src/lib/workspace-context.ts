import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  brandEntities,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { auth } from "@/auth";

const COOKIE = "smm_workspace_id";

export async function getActiveWorkspaceId(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE)?.value ?? null;
}

export async function setActiveWorkspaceId(workspaceId: string) {
  const c = await cookies();
  c.set(COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function requireWorkspace() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "unauthorized" as const };
  }
  let workspaceId = await getActiveWorkspaceId();
  const membership = workspaceId
    ? await db
        .select({ workspaceId: workspaceMembers.workspaceId, role: workspaceMembers.role })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.userId, session.user.id),
            eq(workspaceMembers.workspaceId, workspaceId),
          ),
        )
        .limit(1)
    : [];

  if (!workspaceId || membership.length === 0) {
    const first = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, session.user.id))
      .limit(1);
    if (first.length === 0) {
      return { error: "no_workspace" as const };
    }
    workspaceId = first[0]!.workspaceId;
  }

  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!ws) {
    return { error: "no_workspace" as const };
  }

  const [m] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  return {
    userId: session.user.id,
    isFounderService: session.user.isFounderService,
    workspace: ws,
    role: m?.role ?? "editor",
  };
}

export async function listWorkspacesForUser(userId: string) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      slug: workspaces.slug,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId));
}

export async function listBrandEntities(workspaceId: string) {
  return db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.workspaceId, workspaceId));
}
