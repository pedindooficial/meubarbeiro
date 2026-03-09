import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Client from "@/lib/models/Client";
import Appointment from "@/lib/models/Appointment";
import FinancialRecord from "@/lib/models/FinancialRecord";

export async function GET() {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const tenantId = auth.tenantId;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [clientsCount, appointmentsToday, appointmentsUpcoming, financialSummary, nextAppointment] = await Promise.all([
    Client.countDocuments({ tenantId }),
    Appointment.countDocuments({
      tenantId,
      scheduledAt: { $gte: startOfToday, $lte: endOfToday },
      status: "scheduled",
    }),
    Appointment.countDocuments({
      tenantId,
      scheduledAt: { $gt: endOfToday, $lte: endOfWeek },
      status: "scheduled",
    }),
    FinancialRecord.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]),
    Appointment.findOne({
      tenantId,
      status: "scheduled",
      scheduledAt: { $gt: now },
    })
      .sort({ scheduledAt: 1 })
      .limit(1)
      .populate("clientId", "name phone")
      .populate("cutId", "name")
      .lean(),
  ]);

  const receitaRaw = financialSummary.find((s: { _id: string }) => s._id === "receita")?.total;
  const despesaRaw = financialSummary.find((s: { _id: string }) => s._id === "despesa")?.total;
  const receita = typeof receitaRaw === "number" && !isNaN(receitaRaw) ? receitaRaw : 0;
  const despesa = typeof despesaRaw === "number" && !isNaN(despesaRaw) ? despesaRaw : 0;

  return NextResponse.json({
    clientsCount,
    appointmentsToday,
    appointmentsUpcoming,
    receita,
    despesa,
    saldo: receita - despesa,
    nextAppointment: nextAppointment
      ? {
          _id: nextAppointment._id,
          scheduledAt: nextAppointment.scheduledAt,
          client: nextAppointment.clientId && typeof nextAppointment.clientId === "object"
            ? { name: (nextAppointment.clientId as { name?: string }).name, phone: (nextAppointment.clientId as { phone?: string }).phone }
            : null,
          cut: nextAppointment.cutId && typeof nextAppointment.cutId === "object"
            ? (nextAppointment.cutId as { name: string }).name
            : null,
        }
      : null,
  });
}
