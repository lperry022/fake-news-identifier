// backend/server.js
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";

// ROUTES (ESM default exports expected)
import authRouter from "./routes/authRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import { analyzeRouter } from "./routes/analyzeRoutes.js";

// SOCKETS (optional)
import { initSockets } from "./sockets/initSockets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: true } });

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "change_me";

// ---------- DB ----------
const MONGO_URI = process.env.MONGO_URI; // may be undefined; connectDB has fallback
await connectDB(MONGO_URI); // logs success/failure

// ---------- Security & parsers ----------
app.use(helmet({
  // keep CSP off in dev to avoid blocking CDN scripts/styles
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow CDN fonts/css
}));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.use(express.json());
app.use(cookieParser());

// ---------- Sessions ----------
const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,                // set true behind HTTPS in prod
    maxAge: 1000 * 60 * 60 * 8,   // 8h
  },
  // Use the already-open mongoose client (reliable with fallback URIs)
  store: MongoStore.create({
    client: mongoose.connection.getClient(),
    dbName: "fni",
    collectionName: "sessions",
    stringify: false,
    autoRemove: "interval",
    autoRemoveInterval: 10, // minutes
  }),
});
app.use(sessionMiddleware);

// ---------- Static frontend ----------
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// serve /frontend/* files (matches your <base href="/frontend/">)
app.use("/frontend", express.static(FRONTEND_DIR, {
  index: "index.html",
  extensions: ["html"],
  cacheControl: false,
  etag: false,
}));

// Optional: make / redirect to /frontend/
app.get("/", (_req, res) => res.redirect("/frontend/"));

// ---------- SPA/HTML fallback, but ONLY for paths without an extension
// i.e. don't hijack real assets like .css, .js, .png
app.get(/^\/frontend(?!.*\.\w+$).*/, (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});


// Small asset sanity check (visit http://localhost:3000/_asset-check)
app.get("/_asset-check", (req, res) => {
  res.json({
    ok: true,
    hasAppJs: !!req.app && true,
    staticDir: FRONTEND_DIR,
  });
});

// ---------- API routes ----------
app.use("/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/analyze", analyzeRouter);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState === 1,
    time: new Date().toISOString(),
  });
});

// ---------- Sockets (optional) ----------
initSockets?.(io, sessionMiddleware);
app.set("io", io);

// ---------- SPA fallback ----------
app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ---------- Start ----------
server.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
