import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Barbershop from "@/lib/models/Barbershop";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado" }, { status: 500 });
  }
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const barbershopId = sub.metadata?.barbershopId;
    const plan = sub.metadata?.plan as string | undefined;
    if (!barbershopId) return NextResponse.json({ ok: true });

    await connectDB();
    if (event.type === "customer.subscription.deleted") {
      await Barbershop.updateOne(
        { _id: barbershopId },
        { $set: { plan: "free" }, $unset: { stripeSubscriptionId: "" } }
      );
    } else {
      const newPlan = plan && ["basic", "premium"].includes(plan) ? plan : "free";
      await Barbershop.updateOne(
        { _id: barbershopId },
        { $set: { plan: newPlan, stripeSubscriptionId: sub.id } }
      );
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subId = session.subscription as string | null;
    const barbershopId = session.metadata?.barbershopId;
    const plan = session.metadata?.plan as string | undefined;
    if (!barbershopId || !subId) return NextResponse.json({ ok: true });

    await connectDB();
    const newPlan = plan && ["basic", "premium"].includes(plan) ? plan : "free";
    await Barbershop.updateOne(
      { _id: barbershopId },
      { $set: { plan: newPlan, stripeSubscriptionId: subId } }
    );
  }

  return NextResponse.json({ received: true });
}
