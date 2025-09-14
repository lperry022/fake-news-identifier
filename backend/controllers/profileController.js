// backend/controllers/profileController.js
import { User } from "../models/User.js";

export async function getProfile(req, res) {
  const id = req.session?.userId;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const user = await User.findById(id).lean();
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: { id: user._id, name: user.name, email: user.email } });
}

export async function updateProfile(req, res) {
  const id = req.session?.userId;
  if (!id) return res.status(401).json({ error: "Unauthorized" });
  const { name } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: "Name required" });

  const user = await User.findByIdAndUpdate(
    id,
    { $set: { name: name.trim() } },
    { new: true, projection: { name: 1, email: 1 } }
  ).lean();

  // 🔔 push realtime event to this user’s room
  const io = req.app.get("io");
  io?.to(`user:${id}`).emit("profile:update", { name: user.name });

  res.json({ ok: true, user: { id, name: user.name, email: user.email } });
}
