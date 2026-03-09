import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import Barbershop from "@/lib/models/Barbershop";
import User from "@/lib/models/User";

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const list = await Barbershop.find()
    .populate("ownerId", "name email")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(list);
}
