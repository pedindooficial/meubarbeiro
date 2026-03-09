import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Appointment from "@/lib/models/Appointment";

export async function GET(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  await connectDB();
  const filter: { tenantId: string; scheduledAt?: { $gte?: Date; $lte?: Date }; status?: string } = {
    tenantId: auth.tenantId,
  };
  if (from || to) {
    filter.scheduledAt = {};
    if (from) filter.scheduledAt.$gte = new Date(from);
    if (to) filter.scheduledAt.$lte = new Date(to);
  }
  if (status) filter.status = status;
  const list = await Appointment.find(filter)
    .populate("clientId", "name phone email")
    .populate("cutId", "name durationMinutes price")
    .sort({ scheduledAt: 1 })
    .lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const body = await req.json();
  const doc = await Appointment.create({
    tenantId: auth.tenantId,
    clientId: body.clientId,
    cutId: body.cutId ?? undefined,
    scheduledAt: new Date(body.scheduledAt),
    status: body.status ?? "scheduled",
    total: body.total ?? undefined,
  });
  const populated = await Appointment.findById(doc._id)
    .populate("clientId", "name phone email")
    .populate("cutId", "name durationMinutes price")
    .lean();
  return NextResponse.json(populated);
}
