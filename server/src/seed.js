import "dotenv/config";
import mongoose from "mongoose";
import Appointment from "./models/Appointment.js";
import User from "./models/User.js";

// Create a small, repeatable demo schedule relative to the current local date.
const today = new Date();
const date = (offset) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const examples = [
  {
    customer: "Maya Bennett",
    service: "Haircut & style",
    date: date(0),
    time: "09:00",
    phone: "+1 202 555 0147",
    note: "First visit",
    status: "Done",
  },
  {
    customer: "Jordan Parker",
    service: "Beard trim",
    date: date(0),
    time: "10:30",
    phone: "+1 202 555 0189",
    note: "",
    status: "Arrived",
  },
  {
    customer: "Avery Morgan",
    service: "Color refresh",
    date: date(0),
    time: "12:00",
    phone: "+1 202 555 0121",
    note: "Use the usual shade",
    status: "Approved",
  },
  {
    customer: "Sam Taylor",
    service: "Consultation",
    date: date(0),
    time: "14:30",
    phone: "+1 202 555 0108",
    note: "Bring reference photos",
    status: "Pending",
  },
  {
    customer: "Casey Brooks",
    service: "Haircut & style",
    date: date(1),
    time: "11:00",
    phone: "",
    note: "",
    status: "Approved",
  },
  {
    customer: "Riley James",
    service: "Beard trim",
    date: date(1),
    time: "15:30",
    phone: "",
    note: "",
    status: "Pending",
  },
];
try {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookedup",
  );
  const owner = await User.findOne({ role: "owner" });
  if (!owner)
    throw new Error(
      "Create an owner account first with npm run create-owner --prefix server.",
    );
  await Appointment.deleteMany({});
  await Appointment.insertMany(
    examples.map((item) => ({
      ...item,
      createdBy: owner._id,
      updatedBy: owner._id,
    })),
  );
  console.log(`Seeded ${examples.length} sample appointments.`);
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
