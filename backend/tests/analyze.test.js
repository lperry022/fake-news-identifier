// backend/tests/analyze.test.js
import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { buildApp } from "../app.js";
import { Source } from "../models/source.js";
import { AnalysisLog } from "../models/AnalysisLog.js";

let mongod;
let app; // Express instance

before(async () => {
  // Start in-memory Mongo and connect mongoose
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, { dbName: "fni" });

  // Build app with memory session (no MongoStore)
  ({ app } = buildApp({ useMemorySession: true }));
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Clean DB before each test
beforeEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  );
});

test("POST /api/analyze → 400 when input is missing", async () => {
  const res = await request(app)
    .post("/api/analyze")
    .send({}) // no input
    .expect(400);

  assert.match(res.body.error || "", /input/i);
});

test("POST /api/analyze → flags sensational keywords in headline", async () => {
  const body = { input: "BREAKING: Miracle cure LEAKED to the public" };
  const res = await request(app).post("/api/analyze").send(body).expect(200);

  assert.equal(typeof res.body.score, "number");
  assert.ok(Array.isArray(res.body.flags));
  assert.ok(res.body.flags.length >= 2, "should flag multiple sensational words");
  assert.ok(["Likely Fake / Misleading", "Needs Verification", "Likely Credible"].includes(res.body.verdict));
  assert.equal(res.body.sourceLabel, "Unknown");

  // AnalysisLog should be recorded
  const count = await AnalysisLog.countDocuments();
  assert.equal(count, 1);
});

test("POST /api/analyze → uses domain reputation (Trusted source)", async () => {
  // Seed a trusted source
  await Source.create({ domain: "bbc.com", label: "Trusted", notes: "BBC News" });

  const res = await request(app)
    .post("/api/analyze")
    .send({ input: "https://www.bbc.com/news/world-123" })
    .expect(200);

  assert.equal(res.body.sourceLabel, "Trusted");
  assert.equal(typeof res.body.score, "number");
  assert.ok(res.body.score > 60, "Trusted source should generally yield higher score");
  assert.equal(res.body.verdict, "Likely Credible");
});

test("POST /api/analyze → uses domain reputation (Untrusted source)", async () => {
  // Seed an untrusted source
  await Source.create({ domain: "badexample.com", label: "Untrusted", notes: "Seed list" });

  const res = await request(app)
    .post("/api/analyze")
    .send({ input: "http://m.badexample.com/sensational-article" })
    .expect(200);

  assert.equal(res.body.sourceLabel, "Untrusted");
  assert.equal(typeof res.body.score, "number");
  assert.ok(res.body.score < 60, "Untrusted source should generally yield lower score");
  assert.ok(
    ["Likely Fake / Misleading", "Needs Verification"].includes(res.body.verdict),
    "Verdict should be cautious for untrusted domains"
  );
});
