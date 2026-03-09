import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import PortfolioItem from "@/lib/models/PortfolioItem";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await connectDB();
  const doc = await PortfolioItem.findOne({ _id: id, tenantId: auth.tenantId }).lean();
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await connectDB();
  const body = await req.json();
  const update: Record<string, unknown> = {
    title: body.title,
    description: body.description,
    imageUrl: body.imageUrl,
    category: body.category,
  };
  if (body.featured !== undefined) update.featured = body.featured;
  if (body.active !== undefined) update.active = body.active;
  if (body.order !== undefined) update.order = body.order;

  const doc = await PortfolioItem.findOneAndUpdate(
    { _id: id, tenantId: auth.tenantId },
    update,
    { new: true }
  ).lean();
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await connectDB();
  const result = await PortfolioItem.deleteOne({ _id: id, tenantId: auth.tenantId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
