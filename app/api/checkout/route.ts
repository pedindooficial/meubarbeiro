import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Barbershop from "@/lib/models/Barbershop";
import User from "@/lib/models/User";
import { stripe, PLANS } from "@/lib/stripe";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenantId = (session.user as { tenantId?: string | null }).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 403 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 });
  }

  const body = await req.json();
  const planKey = body.plan as keyof typeof PLANS;
  if (!planKey || planKey === "free" || !PLANS[planKey] || !PLANS[planKey].priceId) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  await connectDB();
  const barbershop = await Barbershop.findById(tenantId).lean();
  if (!barbershop) return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 404 });

  let customerId = (barbershop as { stripeCustomerId?: string }).stripeCustomerId;
  const user = await User.findById((session.user as { id?: string }).id).lean() as { email?: string } | null;
  if (!customerId && user) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: (barbershop as { name?: string }).name,
      metadata: { barbershopId: tenantId },
    });
    customerId = customer.id;
    await Barbershop.updateOne(
      { _id: tenantId },
      { $set: { stripeCustomerId: customerId } }
    );
  }
  if (!customerId) {
    return NextResponse.json({ error: "Cliente Stripe não encontrado" }, { status: 500 });
  }

  const priceId = PLANS[planKey].priceId!;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const sessionStripe = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?success=1`,
    cancel_url: `${baseUrl}/dashboard/planos`,
    metadata: { barbershopId: tenantId, plan: planKey },
    subscription_data: { metadata: { barbershopId: tenantId, plan: planKey } },
  });

  return NextResponse.json({ url: sessionStripe.url });
}
