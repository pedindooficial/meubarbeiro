import mongoose from "mongoose";

export type BarbershopPlan = "free" | "basic" | "premium";

const BarbershopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logo: { type: String },
    phone: { type: String },
    addressLogradouro: { type: String },
    addressNumero: { type: String },
    addressComplemento: { type: String },
    addressBairro: { type: String },
    addressCidade: { type: String },
    addressEstado: { type: String },
    addressCep: { type: String },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["free", "basic", "premium"], default: "free" },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    settings: {
      currency: { type: String, default: "BRL" },
      timezone: { type: String, default: "America/Sao_Paulo" },
    },
  },
  { timestamps: true }
);

BarbershopSchema.index({ ownerId: 1 });

export default mongoose.models.Barbershop || mongoose.model("Barbershop", BarbershopSchema);
