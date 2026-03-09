import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Cut from "@/lib/models/Cut";

export async function GET() {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const list = await Cut.find({ tenantId: auth.tenantId })
    .sort({ name: 1 })
    .lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const body = await req.json();
  const doc = await Cut.create({
    tenantId: auth.tenantId,
    name: body.name,
    durationMinutes: body.durationMinutes ?? 30,
    price: body.price,
    category: body.category ?? undefined,
  });
  return NextResponse.json(doc);
}
