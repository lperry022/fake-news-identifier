// backend/app.js
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";

import authRouter from "./routes/authRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import { analyzeRouter } from "./routes/analyzeRoutes.js";
import { initSockets } from "./sockets/initSockets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function buildApp({ useMemorySession = false } = {}) {
  const app = express();

  // ✅ Helmet (relaxed for local dev)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    })
  );

  // ✅ CORS (must come BEFORE sessions)
  app.use(
    cors({
      origin: [
        "http://localhost:5000",    // same-origin access
        "http://127.0.0.1:5000",
        "http://localhost:5500",    // VS Code Live Server
        "http://127.0.0.1:5500",
        "http://localhost:3000"     // optional React dev
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,            // ✅ allow sending cookies
    })
  );

  // ✅ Handle preflight requests
  app.options("*", cors());

  // ✅ JSON, cookies, and rate limit
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));
  app.use(express.json());
  app.use(cookieParser());

  // --- Sessions ---
  const sessionOptions = {
    secret: process.env.SESSION_SECRET || "change_me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,          // ✅ keep false for localhost
      sameSite: "none",       // ✅ allow cookies from other ports (e.g. :5500)
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
  };

  if (!useMemorySession) {
    sessionOptions.store = MongoStore.create({
      client: mongoose.connection.getClient(),
      dbName: "fni",
      collectionName: "sessions",
      stringify: false,
      autoRemove: "interval",
      autoRemoveInterval: 10,
    });
  }

  const sessionMiddleware = session(sessionOptions);
  app.use(sessionMiddleware);

  // --- Static frontend ---
  const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
  app.use(
    "/frontend",
    express.static(FRONTEND_DIR, {
      index: "index.html",
      extensions: ["html"],
      cacheControl: false,
      etag: false,
    })
  );

  app.get("/", (_req, res) => res.redirect("/frontend/"));

  // --- API routes ---
  app.use("/auth", authRouter);
  app.use("/profile", profileRouter);
  app.use("/api/analyze", analyzeRouter);

  // --- Socket setup ---
  const attachSockets = (server) => {
    const io = new Server(server, {
      cors: { origin: true, credentials: true },
    });
    initSockets?.(io, sessionMiddleware);
    app.set("io", io);
  };

  // --- SPA fallback ---
  app.get("*", (_req, res) =>
    res.sendFile(path.join(FRONTEND_DIR, "index.html"))
  );

  return { app, attachSockets };
}
