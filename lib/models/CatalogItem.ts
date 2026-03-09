import mongoose from "mongoose";

const CatalogItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    category: { type: String },
    duration: { type: Number },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

CatalogItemSchema.index({ tenantId: 1, order: 1 });

export default mongoose.models.CatalogItem || mongoose.model("CatalogItem", CatalogItemSchema);
