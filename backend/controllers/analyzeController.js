import { Source } from "../models/source.js";
import { AnalysisLog } from "../models/AnalysisLog.js";
import Check from "../models/Check.js";

const SENSATIONAL = [
  "breaking","shocking","secret","exposed","banned","miracle",
  "guaranteed","you won't believe","truth","debunked","cover-up","leaked"
];

// --- Helper: extract domain ---
function extractDomain(input) {
  if (!input) return null;
  const raw = String(input).trim();

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      return u.hostname.replace(/^m\./i,"").replace(/^www\./i,"").toLowerCase();
    } catch { return null; }
  }

  if (!/\s/.test(raw) && raw.includes(".")) {
    try {
      const u = new URL(`https://${raw}`);
      return u.hostname.replace(/^m\./i,"").replace(/^www\./i,"").toLowerCase();
    } catch { return null; }
  }

  return null;
}

// --- Helper: find sensational keywords ---
function keywordFlags(text) {
  const t = (text || "").toLowerCase();
  return SENSATIONAL.filter(k => t.includes(k)).map(k => `Contains keyword: "${k}"`);
}

// --- Helper: scoring & verdict ---
function scoreFrom(sourceLabel, flagsCount) {
  let s = 50;
  if (sourceLabel === "Trusted") s += 30;
  else if (sourceLabel === "Untrusted") s -= 30;
  s -= Math.min(flagsCount * 6, 24);
  return Math.max(0, Math.min(100, s));
}

function verdictFrom(score) {
  if (score < 40) return "Likely Fake / Misleading";
  if (score < 60) return "Needs Verification";
  return "Likely Credible";
}

// --- MAIN: analyze route ---
export async function analyze(req, res) {
  try {
    const inputRaw = (req.body?.input || "").trim();
    if (!inputRaw) return res.status(400).json({ error: "Missing input" });

    const domain = extractDomain(inputRaw);

    // check source credibility
    let sourceLabel = "Unknown";
    if (domain) {
      const src = await Source.findOne({ domain }).lean();
      sourceLabel = src?.label || "Unknown";
    }

    const flags = keywordFlags(inputRaw);
    const score = scoreFrom(sourceLabel, flags.length);
    const verdict = verdictFrom(score);

    // log in AnalysisLog (for everyone)
    try {
      const log = await AnalysisLog.create({
        userId: req.session?.userId || undefined,
        input: inputRaw,
        inputType: domain ? "url" : "headline",
        domain,
        sourceLabel,
        verdict,
        score,
        flags
      });
      console.log(
        ` Saved AnalysisLog: new ObjectId('${log._id}') | "${inputRaw}" | Score: ${score} | Verdict: ${verdict}`
      );
    } catch (e) {
      console.error(" AnalysisLog save failed:", e);
    }

    // log in Check (for user dashboard)
    if (req.session?.userId) {
      try {
        const check = await Check.create({
          userId: req.session.userId,
          inputType: domain ? "url" : "headline",
          inputText: domain ? "" : inputRaw,
          inputUrl: domain ? inputRaw : "",
          score,
          flags,
          sourceLabel,
          meta: { domain, verdict }
        });
        console.log(
          `👤 Saved Check for user ${req.session.userId}: new ObjectId('${check._id}') | "${inputRaw}"`
        );
      } catch (e) {
        console.error("Check save failed:", e);
      }
    }

    return res.json({ verdict, score, sourceLabel, flags, domain });
  } catch (err) {
    console.error(" ANALYZE_ERROR:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

// --- DASHBOARD DATA ROUTE ---
export async function getRecentChecks(req, res) {
  try {
    const userId = req.session?.userId;
    let rows;

    if (userId) {
      rows = await Check.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("createdAt inputText inputUrl score sourceLabel flags meta")
        .lean();
    } else {
      rows = await AnalysisLog.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .select("createdAt input score sourceLabel flags verdict")
        .lean();
    }

    const items = rows.map(r => {
      const headline =
        (r.inputText && r.inputText.trim()) ||
        (r.inputUrl && r.inputUrl.trim()) ||
        (r.input && r.input.trim()) ||
        "(headline)";

      return {
        createdAt: r.createdAt,
        input: headline,
        score: r.score ?? 0,
        source: r.sourceLabel || "Unknown",
        flags: r.flags || [],
        verdict: r.meta?.verdict || r.verdict || "—"
      };
    });

    console.log(`Sent ${items.length} dashboard items${userId ? ` for user ${userId}` : ""}`);
    res.json(items);
  } catch (err) {
    console.error("RECENT_CHECKS_ERROR:", err);
    res.status(500).json({ error: "Could not fetch recent checks" });
  }
}
