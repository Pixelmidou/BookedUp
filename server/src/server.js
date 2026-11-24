import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Appointment from "./models/Appointment.js";
import User from "./models/User.js";
import { requireOwner, requireUser } from "./middleware/auth.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

// Restrict browser requests to the local client or configured production domains.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("This website is not allowed to access the API."));
    },
  }),
);
app.use(express.json());
const statuses = [
  "Pending",
  "Approved",
  "Arrived",
  "Done",
  "Rejected",
  "Cancelled",
];
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});
const makeToken = (user) =>
  jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || "local-dev-only-change-me",
    { expiresIn: "7d" },
  );

// Authentication and worker account routes.
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.post("/api/auth/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email });
    if (
      !user ||
      !(await bcrypt.compare(
        String(req.body.password || ""),
        user.passwordHash,
      ))
    )
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (error) {
    next(error);
  }
});
app.get("/api/auth/me", requireUser, (req, res) =>
  res.json({ user: safeUser(req.user) }),
);
app.post(
  "/api/auth/workers",
  requireUser,
  requireOwner,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (!name?.trim() || !email?.trim() || !password)
        return res
          .status(400)
          .json({ message: "Name, email, and password are required." });
      if (password.length < 8)
        return res
          .status(400)
          .json({ message: "Use a password with at least 8 characters." });
      const worker = await User.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "worker",
      });
      res.status(201).json({ user: safeUser(worker) });
    } catch (error) {
      if (error.code === 11000)
        return res
          .status(409)
          .json({ message: "An account with that email already exists." });
      next(error);
    }
  },
);

// All appointment routes require a valid signed-in user.
app.get("/api/appointments", requireUser, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.status && req.query.status !== "All")
      filter.status = req.query.status;
    const appointments = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .populate("createdBy", "name role")
      .populate("updatedBy", "name role");
    res.json(appointments);
  } catch (error) {
    next(error);
  }
});
app.post("/api/appointments", requireUser, async (req, res, next) => {
  try {
    const { customer, service, date, time, phone = "", note = "" } = req.body;
    if (
      ![customer, service, date, time].every(
        (value) => typeof value === "string" && value.trim(),
      )
    )
      return res
        .status(400)
        .json({ message: "Customer, service, date, and time are required." });
    // Owner-created appointments are confirmed; worker-created ones need review.
    const status = req.user.role === "owner" ? "Approved" : "Pending";
    const appointment = await Appointment.create({
      customer,
      service,
      date,
      time,
      phone,
      note,
      status,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    res.status(201).json(
      await appointment.populate([
        { path: "createdBy", select: "name role" },
        { path: "updatedBy", select: "name role" },
      ]),
    );
  } catch (error) {
    next(error);
  }
});
app.patch("/api/appointments/:id", requireUser, async (req, res, next) => {
  try {
    if (!statuses.includes(req.body.status))
      return res
        .status(400)
        .json({ message: "Choose a valid appointment status." });
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });
    const canWorkerMove =
      req.user.role === "worker" &&
      ["Approved", "Arrived"].includes(appointment.status) &&
      ["Arrived", "Done"].includes(req.body.status);
    if (req.user.role !== "owner" && !canWorkerMove)
      return res.status(403).json({
        message: "Workers can update approved appointments to Arrived or Done.",
      });
    appointment.status = req.body.status;
    appointment.updatedBy = req.user._id;
    await appointment.save();
    res.json(
      await appointment.populate([
        { path: "createdBy", select: "name role" },
        { path: "updatedBy", select: "name role" },
      ]),
    );
  } catch (error) {
    next(error);
  }
});
app.delete(
  "/api/appointments/:id",
  requireUser,
  requireOwner,
  async (req, res, next) => {
    try {
      const appointment = await Appointment.findByIdAndDelete(req.params.id);
      if (!appointment)
        return res.status(404).json({ message: "Appointment not found." });
      res.json({ message: "Appointment removed." });
    } catch (error) {
      next(error);
    }
  },
);
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.name === "ValidationError" ? 400 : 500).json({
    message:
      error.name === "ValidationError"
        ? error.message
        : "Something went wrong. Please try again.",
  });
});

const port = process.env.PORT || 5000;
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("Set JWT_SECRET in the production environment.");
}

try {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookedup",
  );
  console.log("Connected to MongoDB");
  app.listen(port, "0.0.0.0", () =>
    console.log(`BookedUp API listening on port ${port}`),
  );
} catch (error) {
  console.error(
    "Could not connect to MongoDB. Check MONGODB_URI.",
    error.message,
  );
  process.exit(1);
}
