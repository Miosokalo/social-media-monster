import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import {
  brandEntities,
  users,
  workspaceMembers,
  workspaces,
} from "@/db/schema";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  workspaceName: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { email, password, name, workspaceName } = parsed.data;
  const normalized = email.toLowerCase().trim();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }
  const passwordHash = await hash(password, 12);
  const slug = `${workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${nanoid(6)}`;

  const userId = await db.transaction(async (tx) => {
    const [u] = await tx
      .insert(users)
      .values({
        email: normalized,
        name: name ?? null,
        passwordHash,
        isFounderService: false,
      })
      .returning({ id: users.id });
    if (!u) throw new Error("user_insert");
    const [w] = await tx
      .insert(workspaces)
      .values({
        name: workspaceName,
        slug,
        subscriptionStatus: "none",
      })
      .returning({ id: workspaces.id });
    if (!w) throw new Error("workspace_insert");
    await tx.insert(workspaceMembers).values({
      workspaceId: w.id,
      userId: u.id,
      role: "owner",
    });
    await tx.insert(brandEntities).values({
      workspaceId: w.id,
      name: "Default brand",
      slug: `default-${nanoid(6)}`,
    });
    return u.id;
  });

  return NextResponse.json({ ok: true, userId });
}
