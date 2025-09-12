// backend/controllers/analyzeController.js
import { Source } from "../models/source.js";
import { AnalysisLog } from "../models/AnalysisLog.js";

// backend/controllers/analyzeController.js (only the helpers need changing)

const SENSATIONAL = [
  "breaking","shocking","secret","exposed","banned","miracle",
  "guaranteed","you won't believe","truth","debunked","cover-up","leaked"
];

// Accepts full URLs, scheme-less domains like "bbc.com/news",
// and strips m./www. prefixes. Returns null if no domain found.
function extractDomain(input) {
  if (!input) return null;
  const raw = String(input).trim();

  // 1) If it already looks like a URL, parse directly
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      return u.hostname.replace(/^m\./i,"").replace(/^www\./i,"").toLowerCase();
    } catch { /* fall through */ }
  }

  // 2) Scheme-less domain like "bbc.com/news" or "www.theonion.com"
  //    (no spaces and contains a dot = likely a domain)
  if (!/\s/.test(raw) && raw.includes(".")) {
    try {
      const u = new URL(`https://${raw}`);
      return u.hostname.replace(/^m\./i,"").replace(/^www\./i,"").toLowerCase();
    } catch { /* fall through */ }
  }

  // 3) Otherwise, we treat as a headline (no domain)
  return null;
}

function keywordFlags(text) {
  const t = (text || "").toLowerCase();
  return SENSATIONAL.filter(k => t.includes(k)).map(k => `Contains keyword: "${k}"`);
}

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

export async function analyze(req, res) {
  const inputRaw = (req.body?.input || "").trim();
  if (!inputRaw) return res.status(400).json({ error: "Missing input" });

  const domain = extractDomain(inputRaw);

  // source reputation
  let sourceLabel = "Unknown";
  if (domain) {
    const src = await Source.findOne({ domain }).lean();
    sourceLabel = src?.label || "Unknown";
  }

  const flags = keywordFlags(inputRaw);
  const score = scoreFrom(sourceLabel, flags.length);
  const verdict = verdictFrom(score);

  await AnalysisLog.create({
    userId: req.session?.userId || undefined,
    input: inputRaw,
    inputType: domain ? "url" : "headline",
    domain,
    sourceLabel,
    verdict,
    score,
    flags
  });

  return res.json({ verdict, score, sourceLabel, flags });
}
