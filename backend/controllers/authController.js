import bcrypt from "bcrypt";
import { User } from "../models/User.js";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    req.session.userId = user._id.toString();
    req.session.name = user.name;
    res.json({ ok: true, user: { name: user.name, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.userId = user._id.toString();
    req.session.name = user.name;
    res.json({ ok: true, user: { name: user.name, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
}

export async function logout(req, res) {
  req.session?.destroy(() => res.json({ ok: true }));
}

export async function me(req, res) {
  // session-only identity
  res.json({ userId: req.session.userId, name: req.session.name });
}
