// backend/controllers/analyzeController.js
import { Source } from "../models/source.js";          // ← match file case
import { AnalysisLog } from "../models/AnalysisLog.js";
// ⚠️ You also need a Check model if you want to save history (your folder doesn’t have one now).
// import { Check } from "../models/Check.js";  // create this later if needed

const SENSATIONAL = [
  "breaking","shocking","secret","exposed","banned","miracle",
  "guaranteed","you won't believe","truth","debunked","cover-up","leaked"
];

// Accepts full URLs (http/https), "bbc.com/news", etc.
// Normalizes m./www. and returns hostname; null if not a URL/domain.
function extractDomain(input) {
  if (!input) return null;
  const raw = String(input).trim();

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      return u.hostname.replace(/^m\./i,"").replace(/^www\./i,"").toLowerCase();
    } catch { /* fall through */ }
  }
  if (!/\s/.test(raw) && raw.includes(".")) {
    try {
      const u = new URL(`https://${raw}`);
      return u.hostname.replace(/^m\./i,"").replace(/^www\./i,"").toLowerCase();
    } catch { /* fall through */ }
  }
  return null; // treat as headline
}

function keywordFlags(text) {
  const t = (text || "").toLowerCase();
  return SENSATIONAL.filter(k => t.includes(k)).map(k => `Contains keyword: "${k}"`);
}

// NEW: highlight words in text with <mark>
function highlightKeywords(text, keywords) {
  if (!text) return "";
  let highlighted = text;
  keywords.forEach(k => {
    const regex = new RegExp(`\\b(${k})\\b`, "gi");
    highlighted = highlighted.replace(regex, `<mark>$1</mark>`);
  });
  return highlighted;
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
  try {
    const inputRaw = (req.body?.input || "").trim();
    if (!inputRaw) return res.status(400).json({ error: "Missing input" });

    const domain = extractDomain(inputRaw);

    // look up source reputation
    let sourceLabel = "Unknown";
    if (domain) {
      const src = await Source.findOne({ domain }).lean();
      sourceLabel = src?.label || "Unknown";
    }

    const flags = keywordFlags(inputRaw);
    const keywords = SENSATIONAL.filter(k => inputRaw.toLowerCase().includes(k));
    const highlightedText = highlightKeywords(inputRaw, keywords);

    const score = scoreFrom(sourceLabel, flags.length);
    const verdict = verdictFrom(score);

    // Log every analysis
    try {
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
    } catch (e) {
      console.error("AnalysisLog create failed:", e);
    }

    // Save to user’s history (if Check model exists)
    if (req.session?.userId) {
      try {
        // ⚠️ Only works if you actually have backend/models/Check.js
        await Check.create({
          userId: req.session.userId,
          inputType: domain ? "url" : "headline",
          inputText: domain ? "" : inputRaw,
          inputUrl: domain ? inputRaw : "",
          score,
          flags,
          sourceLabel,
          meta: { domain, verdict }
        });
      } catch (e) {
        console.error("Check create failed:", e);
      }
    }

    return res.json({ 
      verdict, 
      score, 
      sourceLabel, 
      flags, 
      domain, 
      highlightedText  // 👈 send highlighted version
    });
  } catch (err) {
    console.error("ANALYZE_ERROR:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
