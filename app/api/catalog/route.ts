import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import CatalogItem from "@/lib/models/CatalogItem";

export async function GET() {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const list = await CatalogItem.find({ tenantId: auth.tenantId })
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const body = await req.json();

  const maxOrder = await CatalogItem.findOne({ tenantId: auth.tenantId })
    .sort({ order: -1 })
    .select("order")
    .lean() as { order?: number } | null;
  const nextOrder = (maxOrder?.order ?? 0) + 1;

  const doc = await CatalogItem.create({
    tenantId: auth.tenantId,
    name: body.name,
    description: body.description ?? undefined,
    price: body.price,
    imageUrl: body.imageUrl ?? undefined,
    category: body.category ?? undefined,
    duration: body.duration ?? undefined,
    featured: body.featured ?? false,
    active: body.active ?? true,
    order: body.order ?? nextOrder,
  });
  return NextResponse.json(doc);
}
