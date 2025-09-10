import { User } from "../models/User.js";

export async function getProfile(req, res) {
  const user = await User.findById(req.session.userId).select("name email createdAt");
  res.json({ profile: user });
}

export async function updateProfile(req, res) {
  const { name } = req.body || {};
  const user = await User.findByIdAndUpdate(
    req.session.userId,
    { ...(name ? { name } : {}) },
    { new: true, runValidators: true, select: "name email createdAt" }
  );

  // Push a realtime event to this user via sockets
  const io = req.app.get("io");
  io.to(`user:${req.session.userId}`).emit("profile:update", { name: user.name });

  res.json({ profile: user });
}
