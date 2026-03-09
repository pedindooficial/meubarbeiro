import mongoose from "mongoose";

const CutSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", required: true },
    name: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    price: { type: Number, required: true },
    category: { type: String },
  },
  { timestamps: true }
);

CutSchema.index({ tenantId: 1 });

export default mongoose.models.Cut || mongoose.model("Cut", CutSchema);
