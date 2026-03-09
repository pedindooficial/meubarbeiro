import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Client from "@/lib/models/Client";
import Barbershop from "@/lib/models/Barbershop";
import { PLANS } from "@/lib/stripe";

export async function GET(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const query: Record<string, unknown> = { tenantId: auth.tenantId };
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { name: regex },
      { phone: regex },
      { email: regex },
    ];
  }
  const list = await Client.find(query)
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const barbershop = await Barbershop.findById(auth.tenantId).lean();
  const planKey = ((barbershop as { plan?: string } | null)?.plan || "free") as keyof typeof PLANS;
  const limit = PLANS[planKey] ? PLANS[planKey].maxClients : PLANS.free.maxClients;
  if (limit >= 0) {
    const count = await Client.countDocuments({ tenantId: auth.tenantId });
    if (count >= limit) {
      return NextResponse.json(
        { error: "Limite de clientes do plano atingido. Faça upgrade." },
        { status: 403 }
      );
    }
  }
  const body = await req.json();
  const doc = await Client.create({
    tenantId: auth.tenantId,
    name: body.name,
    phone: body.phone ?? undefined,
    email: body.email ?? undefined,
    notes: body.notes ?? undefined,
    preferenciaCorte: body.preferenciaCorte ?? undefined,
    tipoCabelo: body.tipoCabelo ?? undefined,
  });
  return NextResponse.json(doc);
}
