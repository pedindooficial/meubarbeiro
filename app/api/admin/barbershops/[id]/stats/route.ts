import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import Barbershop from "@/lib/models/Barbershop";
import Client from "@/lib/models/Client";
import Appointment from "@/lib/models/Appointment";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  await connectDB();
  const exists = await Barbershop.findById(id).lean();
  if (!exists) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  const tenantId = new mongoose.Types.ObjectId(id);
  const [clientsCount, appointmentsCount, appointmentsCompleted] = await Promise.all([
    Client.countDocuments({ tenantId }),
    Appointment.countDocuments({ tenantId }),
    Appointment.countDocuments({ tenantId, status: "completed" }),
  ]);
  return NextResponse.json({
    clientsCount,
    appointmentsCount,
    appointmentsCompleted,
  });
}
