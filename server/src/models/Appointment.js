import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true, trim: true, maxlength: 70 },
    service: { type: String, required: true, trim: true, maxlength: 70 },
    date: { type: String, required: true }, // Local calendar date: YYYY-MM-DD
    time: { type: String, required: true }, // Local time: HH:mm
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    note: { type: String, trim: true, maxlength: 240, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Arrived", "Done", "Rejected", "Cancelled"],
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

appointmentSchema.index({ date: 1, time: 1 });
export default mongoose.model("Appointment", appointmentSchema);
