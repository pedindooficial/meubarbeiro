import mongoose from "mongoose";

export type UserRole = "barber" | "admin";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    name: { type: String },
    image: { type: String },
    role: { type: String, enum: ["barber", "admin"], default: "barber" },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Barbershop", default: null },
    emailVerified: { type: Date },
    stripeCustomerId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
