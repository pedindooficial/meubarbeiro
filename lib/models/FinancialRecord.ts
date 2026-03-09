import mongoose from "mongoose";

export type FinancialType = "receita" | "despesa";
export type RecurrenceType = "unique" | "weekly" | "biweekly" | "monthly";

const FinancialRecordSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", required: true },
    type: { type: String, enum: ["receita", "despesa"], required: true },
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    category: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    /** Recorrência: único (uma vez), semanal, quinzenal ou mensal */
    recurrence: {
      type: String,
      enum: ["unique", "weekly", "biweekly", "monthly"],
      default: "unique",
    },
    /** Marca como gasto fixo (despesa recorrente típica: aluguel, contas, etc.) */
    isFixedExpense: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FinancialRecordSchema.index({ tenantId: 1, date: -1 });

export default mongoose.models.FinancialRecord || mongoose.model("FinancialRecord", FinancialRecordSchema);
