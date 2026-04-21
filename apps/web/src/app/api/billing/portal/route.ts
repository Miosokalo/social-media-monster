import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { env } from "@/env";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 501 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { workspaceId } = (await req.json().catch(() => ({}))) as {
    workspaceId?: string;
  };
  if (!workspaceId) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!ws?.stripeCustomerId) {
    return NextResponse.json({ error: "no_customer" }, { status: 400 });
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const base = env.AUTH_URL ?? new URL(req.url).origin;
  const portal = await stripe.billingPortal.sessions.create({
    customer: ws.stripeCustomerId,
    return_url: `${base}/settings`,
  });
  return NextResponse.json({ url: portal.url });
}
