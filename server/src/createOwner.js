import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import User from "./models/User.js";

// Create the first owner locally; new worker accounts are created from the app.
const prompt = createInterface({ input, output });
try {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/bookedup",
  );
  if (await User.exists({ role: "owner" })) {
    console.log("An owner account already exists.");
  } else {
    const name = (await prompt.question("Owner name: ")).trim();
    const email = (await prompt.question("Owner email: ")).trim().toLowerCase();
    const password = await prompt.question(
      "Password (at least 8 characters): ",
    );
    if (!name || !email || password.length < 8)
      throw new Error(
        "Enter a name, email, and password with at least 8 characters.",
      );
    await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "owner",
    });
    console.log(`Owner account created for ${email}.`);
  }
} catch (error) {
  console.error("Owner setup failed:", error.message);
  process.exitCode = 1;
} finally {
  prompt.close();
  await mongoose.disconnect();
}
