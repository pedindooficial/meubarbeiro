import mongoose from "mongoose";

/**
 * Item do portfólio: amostra de trabalho (foto + texto explicativo).
 * Apresentação do trabalho, sem preços.
 */
const PortfolioItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", required: true },
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, required: true },
    category: { type: String },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

PortfolioItemSchema.index({ tenantId: 1, order: 1 });

export default mongoose.models.PortfolioItem || mongoose.model("PortfolioItem", PortfolioItemSchema);
