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

import fakeNewsRoutes from "./routes/fakeNewsRoutes.js";
import authRouter from "./routes/authRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import { analyzeRouter } from "./routes/analyzeRoutes.js";
import { initSockets } from "./sockets/initSockets.js";
//import userRoutes from "./routes/user.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Build an Express app. In tests we skip MongoStore (MemoryStore is fine).
 * @param {object} opts
 * @param {boolean} [opts.useMemorySession=false]
 * @returns {{app: import('express').Express, attachSockets:(server:import('http').Server)=>void}}
 */
export function buildApp({ useMemorySession = false } = {}) {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
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
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
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

  // --- Static frontend ----
  const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
  app.use("/frontend", express.static(FRONTEND_DIR, {
    index: "index.html",
    extensions: ["html"],
    cacheControl: false,
    etag: false,
  }));
  app.get("/", (_req, res) => res.redirect("/frontend/"));
  app.use(cors({ origin: "http://127.0.0.1:5500" }));

  // --- API routes ---
  app.use("/auth", authRouter);
  app.use("/profile", profileRouter);
  app.use("/api/analyze", analyzeRouter);
  //app.use("/user", userRoutes);
  app.use("/api/fakenews", fakeNewsRoutes);

  // Optional sockets
  const attachSockets = (server) => {
    const io = new Server(server, { cors: { origin: true, credentials: true } });
    initSockets?.(io, sessionMiddleware);
    app.set("io", io);
  };

  // SPA fallback
  app.get("*", (_req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));

  return { app, attachSockets };
}

