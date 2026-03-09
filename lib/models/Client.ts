import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    notes: { type: String },
    preferenciaCorte: { type: String },
    tipoCabelo: { type: String },
  },
  { timestamps: true }
);

ClientSchema.index({ tenantId: 1 });

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);
