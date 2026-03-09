import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Client from "@/lib/models/Client";

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
  const doc = await Client.findOne({ _id: id, tenantId: auth.tenantId }).lean();
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
  const doc = await Client.findOneAndUpdate(
    { _id: id, tenantId: auth.tenantId },
    {
      name: body.name,
      phone: body.phone,
      email: body.email,
      notes: body.notes,
      preferenciaCorte: body.preferenciaCorte,
      tipoCabelo: body.tipoCabelo,
    },
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
  const result = await Client.deleteOne({ _id: id, tenantId: auth.tenantId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
