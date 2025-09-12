// backend/controllers/authController.js
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

// Register
export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() }).lean();
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    // create session
    req.session.userId = user._id.toString();
    res.status(201).json({ ok: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}

// Login
export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user._id.toString();
    res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Internal error" });
  }
}

// Logout
export async function logout(req, res) {
  req.session?.destroy(() => {});
  res.clearCookie?.("connect.sid");
  res.json({ ok: true });
}

// Me
export async function me(req, res) {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await User.findById(req.session.userId).lean();
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email } });
}
