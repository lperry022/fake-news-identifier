// backend/scripts/seedKeywords.js
import mongoose from "mongoose";
import Keyword from "../models/Keyword.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fni"; // adjust DB name if needed

const KEYWORDS = [
  { word: "breaking", severity: "high" },
  { word: "shocking", severity: "high" },
  { word: "secret", severity: "medium" },
  { word: "exposed", severity: "high" },
  { word: "banned", severity: "medium" },
  { word: "miracle", severity: "high" },
  { word: "guaranteed", severity: "medium" },
  { word: "you won't believe", severity: "high" },
  { word: "truth", severity: "low" },
  { word: "debunked", severity: "medium" },
  { word: "cover-up", severity: "high" },
  { word: "leaked", severity: "medium" },
  { word: "exclusive", severity: "medium" },
  { word: "click here", severity: "high" },
  { word: "miraculous", severity: "high" },
  { word: "unbelievable", severity: "high" },
  { word: "alert", severity: "medium" },
  { word: "must read", severity: "medium" },
  { word: "urgent", severity: "high" },
  { word: "scandal", severity: "medium" }
];

async function seed() {
  try {
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ MongoDB connected:", mongoose.connection.name);

    // Upsert each keyword (safe if you run seed multiple times)
    const ops = KEYWORDS.map(k => ({
      updateOne: {
        filter: { word: k.word.toLowerCase().trim() },
        update: { $set: { category: k.category || "sensational", severity: k.severity || "low" } },
        upsert: true
      }
    }));

    if (ops.length) {
      const bulk = await Keyword.bulkWrite(ops);
      // Count how many unique docs exist now (optional)
      const total = await Keyword.countDocuments();
      console.log(`✅ Seed complete. Keywords upserted (bulkWrite):`, bulk.nUpserted ?? bulk.upsertedCount ?? 0);
      console.log(`Total keywords in DB: ${total}`);
    } else {
      console.log("No keywords to seed.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
