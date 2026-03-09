import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getTenantId } from "@/lib/api-auth";
import FinancialRecord from "@/lib/models/FinancialRecord";
import { effectiveAmountInPeriod } from "@/lib/financial-utils";

export async function GET(req: Request) {
  const auth = await getTenantId();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  await connectDB();
  const tenantId = auth.tenantId;

  let match: Record<string, unknown> = { tenantId };
  const from = fromParam ? new Date(fromParam) : null;
  const to = toParam ? new Date(toParam) : null;

  if (from && to) {
    match = {
      tenantId,
      $or: [
        { date: { $gte: from, $lte: to } },
        { date: { $lte: to }, recurrence: { $in: ["weekly", "biweekly", "monthly"] } },
      ],
    };
  } else if (from) {
    match = { tenantId, $or: [{ date: { $gte: from } }, { recurrence: { $in: ["weekly", "biweekly", "monthly"] } }] };
  } else if (to) {
    match = { tenantId, date: { $lte: to } };
  }

  const records = await FinancialRecord.find(match).lean();
  const hasPeriod = from && to;
  const fromDate = from ?? new Date(0);
  const toDate = to ?? new Date(8640000000000000);

  let totalReceita = 0;
  let totalDespesa = 0;
  for (const r of records) {
    const rec = r as unknown as { type: string; amount: number; date: Date; recurrence?: string };
    const recurrence = rec.recurrence ?? "unique";
    const effective = hasPeriod
      ? effectiveAmountInPeriod(rec.amount, rec.date, recurrence, fromDate, toDate)
      : rec.amount;
    if (rec.type === "receita") totalReceita += effective;
    else totalDespesa += effective;
  }

  const safeReceita = isNaN(totalReceita) ? 0 : totalReceita;
  const safeDespesa = isNaN(totalDespesa) ? 0 : totalDespesa;
  return NextResponse.json({
    receita: safeReceita,
    despesa: safeDespesa,
    saldo: safeReceita - safeDespesa,
  });
}
