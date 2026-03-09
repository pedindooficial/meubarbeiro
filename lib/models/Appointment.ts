import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    cutId: { type: mongoose.Schema.Types.ObjectId, ref: "Cut" },
    scheduledAt: { type: Date, required: true },
    status: { type: String, enum: ["scheduled", "completed", "cancelled", "no_show"], default: "scheduled" },
    total: { type: Number },
    completionNote: { type: String },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

AppointmentSchema.index({ tenantId: 1, scheduledAt: -1 });

export default mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
