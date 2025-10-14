import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const CheckSchema = new Schema({
  userId: { type: String, required: false },
  inputType: { type: String, enum: ["url", "headline"], default: "headline" },
  inputText: { type: String, default: "" },
  inputUrl: { type: String, default: "" },
  score: { type: Number, required: true },
  flags: { type: [String], default: [] },
  sourceLabel: { type: String, default: "Unknown" },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
});

export default models.Check || model("Check", CheckSchema);
