// backend/scripts/seedSources.js
import "dotenv/config";
import { connectDB } from "../config/db.js";
import { Source } from "../models/source.js";

const seeds = [
  { domain: "bbc.com", label: "Trusted", notes: "Major news outlet" },
  { domain: "theonion.com", label: "Untrusted", notes: "Satire; not factual" },
  { domain: "example.com", label: "Unknown" }
];

async function run() {
  await connectDB(process.env.MONGO_URI);
  for (const s of seeds) {
    await Source.updateOne({ domain: s.domain }, s, { upsert: true });
  }
  console.log("✅ Seeded Source collection");
  process.exit(0);
}
run().catch(err => { console.error(err); process.exit(1); });
