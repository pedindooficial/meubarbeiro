import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Barbershop from "@/lib/models/Barbershop";
import { PLANS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const tenantId = (session.user as { tenantId?: string | null }).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Barbearia não encontrada" }, { status: 403 });
  }

  await connectDB();
  const barbershop = await Barbershop.findById(tenantId)
    .select("plan")
    .lean() as { plan?: string } | null;

  const planKey = (barbershop?.plan || "free") as keyof typeof PLANS;
  const planConfig = PLANS[planKey] || PLANS.free;

  return NextResponse.json({
    plan: planKey,
    planName: planConfig.name,
    maxClients: planConfig.maxClients,
  });
}
