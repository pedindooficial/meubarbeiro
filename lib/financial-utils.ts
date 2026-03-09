/**
 * Calcula o valor efetivo de um lançamento recorrente no período [from, to].
 * Para recorrência "unique", retorna amount se date está no período, senão 0.
 */
export function effectiveAmountInPeriod(
  amount: number,
  recordDate: Date,
  recurrence: string,
  from: Date,
  to: Date
): number {
  const d = recordDate instanceof Date ? recordDate : new Date(recordDate);
  const f = from instanceof Date ? from : new Date(from);
  const t = to instanceof Date ? to : new Date(to);
  if (d > t) return 0;
  const start = d > f ? d : f;

  switch (recurrence) {
    case "weekly": {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      let count = 0;
      let cur = new Date(d);
      while (cur <= t) {
        if (cur >= f) count++;
        cur.setTime(cur.getTime() + msPerWeek);
      }
      return amount * count;
    }
    case "biweekly": {
      const msPerTwoWeeks = 14 * 24 * 60 * 60 * 1000;
      let count = 0;
      let cur = new Date(d);
      while (cur <= t) {
        if (cur >= f) count++;
        cur.setTime(cur.getTime() + msPerTwoWeeks);
      }
      return amount * count;
    }
    case "monthly": {
      let count = 0;
      const day = d.getDate();
      let cur = new Date(d.getFullYear(), d.getMonth(), Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
      while (cur <= t) {
        if (cur >= f) count++;
        const nextMonth = cur.getMonth() + 1;
        const lastDay = new Date(cur.getFullYear(), nextMonth + 1, 0).getDate();
        cur = new Date(cur.getFullYear(), nextMonth, Math.min(day, lastDay));
      }
      return amount * count;
    }
    case "unique":
    default:
      return d >= f && d <= t ? amount : 0;
  }
}
