import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import ActionPlan from "@/lib/models/ActionPlan";

export async function GET(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  await connectDB();
  const filter: { tenantId: string; status?: string } = { tenantId: auth.tenantId };
  if (status) filter.status = status;
  const list = await ActionPlan.find(filter).sort({ dueDate: 1, createdAt: -1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const body = await req.json();
  const doc = await ActionPlan.create({
    tenantId: auth.tenantId,
    title: body.title,
    description: body.description ?? undefined,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    status: body.status ?? "pending",
    priority: body.priority ?? "medium",
  });
  return NextResponse.json(doc);
}
