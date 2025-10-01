// backend/models/Keyword.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const KeywordSchema = new Schema({
  word: {
    type: String,
    required: true,
    unique: true,        // unique index on 'word' (prevents duplicates)
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    default: "sensational", // optional: e.g. 'sensational', 'clickbait', 'political'
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  }
}, { timestamps: true });

// NOTE: Do NOT call schema.index({ word: 1 }) if you already use unique:true above,
// that was giving the "Duplicate schema index" warning in your earlier run.

export default model("Keyword", KeywordSchema);
