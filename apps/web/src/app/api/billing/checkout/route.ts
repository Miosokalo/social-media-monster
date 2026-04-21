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
  const { workspaceId, priceId } = (await req.json().catch(() => ({}))) as {
    workspaceId?: string;
    priceId?: string;
  };
  const effectivePriceId = priceId ?? env.STRIPE_DEFAULT_PRICE_ID;
  if (!workspaceId || !effectivePriceId) {
    return NextResponse.json(
      { error: "invalid_body_missing_price" },
      { status: 400 },
    );
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!ws) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  let customerId = ws.stripeCustomerId;
  if (!customerId) {
    const c = await stripe.customers.create({
      email: session.user.email ?? undefined,
      metadata: { workspaceId },
    });
    customerId = c.id;
    await db
      .update(workspaces)
      .set({ stripeCustomerId: customerId })
      .where(eq(workspaces.id, workspaceId));
  }
  const base = env.AUTH_URL ?? new URL(req.url).origin;
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: effectivePriceId, quantity: 1 }],
    success_url: `${base}/settings?checkout=success`,
    cancel_url: `${base}/settings?checkout=cancel`,
    metadata: { workspaceId },
  });
  return NextResponse.json({ url: checkout.url });
}
