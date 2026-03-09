import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import Barbershop from "@/lib/models/Barbershop";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const [total, byPlan] = await Promise.all([
    Barbershop.countDocuments(),
    Barbershop.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
  ]);
  const plans: Record<string, number> = {};
  byPlan.forEach((p: { _id: string; count: number }) => {
    plans[p._id] = p.count;
  });
  return NextResponse.json({
    totalBarbershops: total,
    byPlan: plans,
  });
}
