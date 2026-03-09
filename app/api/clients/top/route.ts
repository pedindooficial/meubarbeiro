import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import Appointment from "@/lib/models/Appointment";
import Client from "@/lib/models/Client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "3", 10), 1), 20);
  await connectDB();
  const tenantId = auth.tenantId;

  const topClientIds = await Appointment.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: "completed" } },
    { $group: { _id: "$clientId", count: { $sum: 1 }, total: { $sum: { $ifNull: ["$total", 0] } } } },
    { $sort: { count: -1, total: -1 } },
    { $limit: limit },
    { $project: { clientId: "$_id", count: 1, total: 1 } },
  ]);

  if (topClientIds.length === 0) {
    return NextResponse.json([]);
  }

  const ids = topClientIds.map((r: { clientId: mongoose.Types.ObjectId }) => r.clientId);
  const clients = await Client.find({ _id: { $in: ids }, tenantId })
    .lean();
  const clientMap = new Map(clients.map((c: { _id: mongoose.Types.ObjectId; name?: string; phone?: string }) => [c._id.toString(), c]));

  const result = topClientIds
    .map((r: { clientId: mongoose.Types.ObjectId; count: number; total: number }) => {
      const client = clientMap.get(r.clientId.toString());
      if (!client) return null;
      return { ...client, completedCount: r.count, totalRevenue: r.total };
    })
    .filter(Boolean);

  return NextResponse.json(result);
}
