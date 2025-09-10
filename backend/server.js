// backend/server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/authRoutes.js";
import { profileRouter } from "./routes/profileRoutes.js";
import { initSockets } from "./sockets/index.js";

/* ---------------- env + paths ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env that lives in backend/
dotenv.config({ path: path.join(__dirname, ".env") });
console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fni";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev_secret_change_me";

/* ---------------- app ---------------- */
const app = express();
app.use(express.json());
app.use(cookieParser());

/* ---------------- sessions (Mongo) ---------------- */
const sessionMiddleware = session({
  name: "sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,                 // set true if you serve over https
    maxAge: 1000 * 60 * 60 * 12    // 12h
  },
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    mongoOptions: { dbName: "fni" },
    collectionName: "sessions"
  })
});

app.use(sessionMiddleware);

/* ---------------- routes ---------------- */
app.use("/auth", authRouter);
app.use("/api/profile", profileRouter);

// optional health endpoint
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* ---------------- static frontend ---------------- */
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");
app.use("/", express.static(FRONTEND_DIR));

/* ---------------- http + sockets ---------------- */
const server = http.createServer(app);
const io = new Server(server, { /* same-origin by default */ });

// make io available in controllers
app.set("io", io);

// bind session to sockets + auth guard
initSockets(io, sessionMiddleware);

/* ---------------- start ---------------- */
connectDB(MONGO_URI)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Server running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });
