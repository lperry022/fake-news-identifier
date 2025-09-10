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

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(express.json());
app.use(cookieParser());

// Sessions (Mongo store)
const sessionMiddleware = session({
  name: "sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 1000 * 60 * 60 * 12 },
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, dbName: "fni", collectionName: "sessions" })
});

app.use(sessionMiddleware);

// API routes
app.use("/auth", authRouter);
app.use("/api/profile", profileRouter);

// Serve frontend
app.use("/", express.static(path.join(__dirname, "../frontend")));

// HTTP + Sockets
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.set("io", io);
initSockets(io, sessionMiddleware);

// Start
const PORT = process.env.PORT || 3000;
connectDB(process.env.MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`Server http://localhost:${PORT}`)))
  .catch((e) => console.error(e));
