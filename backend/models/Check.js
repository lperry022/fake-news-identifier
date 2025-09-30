// backend/models/Check.js
import mongoose from "mongoose";

const checkSchema = new mongoose.Schema({
  input: { type: String, required: true },
  verdict: { type: String, required: true },
  score: { type: Number, required: true },
  flags: { type: [String], default: [] },
  sourceLabel: { type: String, default: "Unknown" },
  domain: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Check", checkSchema);
