import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import FinancialRecord from "@/lib/models/FinancialRecord";

export async function GET(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  await connectDB();
  const tenantId = auth.tenantId;
  let filter: Record<string, unknown> = { tenantId };
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    filter = {
      tenantId,
      $or: [
        { date: { $gte: fromDate, $lte: toDate } },
        { date: { $lte: toDate }, recurrence: { $in: ["weekly", "biweekly", "monthly"] } },
      ],
    };
  } else if (from) {
    filter = { tenantId, $or: [{ date: { $gte: new Date(from) } }, { recurrence: { $in: ["weekly", "biweekly", "monthly"] } }] };
  } else if (to) {
    filter = { tenantId, date: { $lte: new Date(to) } };
  }
  const list = await FinancialRecord.find(filter).sort({ date: -1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const body = await req.json();
  const recurrence = ["unique", "weekly", "biweekly", "monthly"].includes(body.recurrence)
    ? body.recurrence
    : "unique";
  const doc = await FinancialRecord.create({
    tenantId: auth.tenantId,
    type: body.type,
    amount: body.amount,
    description: body.description ?? undefined,
    date: new Date(body.date),
    category: body.category ?? undefined,
    relatedId: body.relatedId ?? undefined,
    recurrence,
    isFixedExpense: !!body.isFixedExpense,
  });
  return NextResponse.json(doc);
}
