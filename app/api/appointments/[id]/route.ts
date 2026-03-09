import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Appointment from "@/lib/models/Appointment";
import FinancialRecord from "@/lib/models/FinancialRecord";

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
  const doc = await Appointment.findOne({ _id: id, tenantId: auth.tenantId })
    .populate("clientId", "name phone email")
    .populate("cutId", "name durationMinutes price")
    .lean();
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
  const update: Record<string, unknown> = {};
  if (body.clientId != null) update.clientId = body.clientId;
  if (body.cutId != null) update.cutId = body.cutId;
  if (body.scheduledAt != null) update.scheduledAt = new Date(body.scheduledAt);
  if (body.status != null) update.status = body.status;
  if (body.total != null) update.total = body.total;
  if (body.completionNote != null) update.completionNote = body.completionNote;
  if (body.cancelReason != null) update.cancelReason = body.cancelReason;

  const previous = await Appointment.findOne({ _id: id, tenantId: auth.tenantId }).lean();
  if (!previous) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const doc = await Appointment.findOneAndUpdate(
    { _id: id, tenantId: auth.tenantId },
    update,
    { new: true }
  )
    .populate("clientId", "name phone email")
    .populate("cutId", "name durationMinutes price")
    .lean();
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (
    previous.status !== "completed" &&
    doc.status === "completed" &&
    doc.total != null &&
    typeof doc.total === "number"
  ) {
    const scheduledAt = doc.scheduledAt instanceof Date ? doc.scheduledAt : new Date(doc.scheduledAt);
    await FinancialRecord.create({
      tenantId: auth.tenantId,
      type: "receita",
      amount: doc.total,
      description: "Atendimento concluído",
      date: scheduledAt,
      relatedId: doc._id,
    });
  }

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
  const result = await Appointment.deleteOne({ _id: id, tenantId: auth.tenantId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
