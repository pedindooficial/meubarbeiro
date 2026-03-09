import mongoose from "mongoose";

export type ActionPlanStatus = "pending" | "in_progress" | "done" | "cancelled";

const ActionPlanSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", required: true },
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    status: { type: String, enum: ["pending", "in_progress", "done", "cancelled"], default: "pending" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true }
);

ActionPlanSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.ActionPlan || mongoose.model("ActionPlan", ActionPlanSchema);
