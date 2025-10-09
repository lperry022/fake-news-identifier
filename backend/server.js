// backend/server.js
import "dotenv/config";
import http from "http";
import { connectDB } from "./config/db.js";
import { buildApp } from "./app.js";

const PORT = process.env.PORT || 5000;

await connectDB(process.env.MONGO_URI);

const { app, attachSockets } = buildApp();
const server = http.createServer(app);
attachSockets(server);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

