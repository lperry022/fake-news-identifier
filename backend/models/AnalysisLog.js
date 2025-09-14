// backend/models/AnalysisLog.js
import mongoose from "mongoose";

const AnalysisLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
  input: { type: String, required: true },
  inputType: { type: String, enum: ["url","headline"], required: true },
  domain: { type: String },
  sourceLabel: { type: String, enum: ["Trusted","Untrusted","Unknown"], default: "Unknown" },
  verdict: { type: String, required: true },
  score:   { type: Number, min:0, max:100, required: true },
  flags:   { type: [String], default: [] }
}, { timestamps: true });

export const AnalysisLog = mongoose.model("AnalysisLog", AnalysisLogSchema);
