import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Verify the bearer token and attach the matching account to the request.
export async function requireUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Please sign in." });
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "local-dev-only-change-me",
    );
    const user = await User.findById(payload.userId).select(
      "_id name email role",
    );
    if (!user)
      return res
        .status(401)
        .json({ message: "Your account is no longer available." });
    req.user = user;
    next();
  } catch {
    res
      .status(401)
      .json({ message: "Your session has expired. Please sign in again." });
  }
}

// Keep owner-only actions protected on the server, not just hidden in React.
export function requireOwner(req, res, next) {
  if (req.user?.role !== "owner")
    return res.status(403).json({ message: "Only the owner can do that." });
  next();
}
