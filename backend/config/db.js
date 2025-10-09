// backend/config/db.js
import mongoose from "mongoose";

export async function connectDB(uri) {
  // Fallback if no URI provided (local Mongo)
  const mongoUri = uri ?? "mongodb://127.0.0.1:27017/fni";

  if (mongoose.connection.readyState === 1) {
    console.log("ℹ MongoDB already connected:", mongoose.connection.name);
    return mongoose.connection;
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(mongoUri, { dbName: "fni" });
    console.log("MongoDB connected:", mongoose.connection.name);
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // exit so you don’t run the app in broken state
  }
}
