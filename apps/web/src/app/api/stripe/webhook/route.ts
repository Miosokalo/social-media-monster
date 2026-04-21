import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/db";
import { workspaces } from "@/db/schema";

export async function POST(req: Request) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 501 });
  }
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    const status = sub.status;
    await db
      .update(workspaces)
      .set({ subscriptionStatus: status })
      .where(eq(workspaces.stripeCustomerId, customerId));
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = sub.customer as string;
    await db
      .update(workspaces)
      .set({ subscriptionStatus: "canceled" })
      .where(eq(workspaces.stripeCustomerId, customerId));
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const wsId = s.metadata?.workspaceId;
    if (wsId && s.subscription) {
      const sub = await stripe.subscriptions.retrieve(s.subscription as string);
      await db
        .update(workspaces)
        .set({ subscriptionStatus: sub.status })
        .where(eq(workspaces.id, wsId));
    }
  }

  if (event.type === "invoice.payment_failed") {
    const inv = event.data.object as Stripe.Invoice;
    const customerId = inv.customer as string | undefined;
    if (customerId) {
      await db
        .update(workspaces)
        .set({ subscriptionStatus: "past_due" })
        .where(eq(workspaces.stripeCustomerId, customerId));
    }
  }

  return NextResponse.json({ received: true });
}
