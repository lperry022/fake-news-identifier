import mongoose from "mongoose";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    dbName: "fni",
    serverSelectionTimeoutMS: 20000, 
    socketTimeoutMS: 45000,          
    retryWrites: true
  });
  console.log("MongoDB connected");
}
