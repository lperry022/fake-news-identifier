// backend/scripts/seedKeywords.js
import "dotenv/config";
import { connectDB } from "../config/db.js";
import { Keyword } from "../models/Keyword.js";

const seedList = [
  "breaking",
  "shocking",
  "exclusive",
  "secret",
  "exposed",
  "banned",
  "miracle",
  "guaranteed",
  "you won't believe",
  "truth",
  "debunked",
  "cover-up",
  "leaked",
  "cure",
  "miracle cure",
  "unbelievable",
  "shocker",
  "alert",
  "warning",
  "urgent"
];

async function run() {
  await connectDB(process.env.MONGO_URI);
  for (const w of seedList) {
    try {
      await Keyword.updateOne(
        { word: w },
        { $set: { word: w, category: "sensational" } },
        { upsert: true }
      );
    } catch (err) {
      console.error("Failed to upsert keyword:", w, err);
    }
  }
  console.log(`✅ Seeded ${seedList.length} keywords`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
