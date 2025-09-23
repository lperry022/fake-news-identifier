// backend/models/Keyword.js
import mongoose from "mongoose";

const KeywordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true, trim: true },
  category: { type: String, default: "sensational" }, // optional: category label
  notes: { type: String, default: "" },               // optional notes
  severity: { type: Number, default: 1 }               // optional (higher = more severe)
}, { timestamps: true });

KeywordSchema.index({ word: 1 });

export const Keyword = mongoose.model("Keyword", KeywordSchema);
