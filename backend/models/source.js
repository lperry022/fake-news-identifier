// backend/models/Source.js
import mongoose from "mongoose";

const SourceSchema = new mongoose.Schema({
  domain: { type: String, unique: true, index: true, trim: true, lowercase: true },
  label: { type: String, enum: ["Trusted", "Untrusted", "Unknown"], default: "Unknown" },
  notes: { type: String, default: "" }
}, { timestamps: true });

export const Source = mongoose.model("Source", SourceSchema);
