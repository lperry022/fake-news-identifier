// ----- CONFIG -----
const API_BASE = ""; // leave blank if backend serves the frontend (same origin). Otherwise e.g. "http://localhost:3000"
const ANALYZE_URL = `${API_BASE}/api/analyze`;
const HEALTH_URL  = `${API_BASE}/api/health`;

// Optional: quick mock if backend is down
const USE_MOCK_WHEN_OFFLINE = true;

// ----- DOM -----
const inputEl   = document.getElementById("newsInput");
const btnEl     = document.getElementById("analyzeBtn");
const loaderEl  = document.getElementById("loader");
const resultEl  = document.getElementById("result");
const verdictEl = document.getElementById("verdictBadge");
const sourceEl  = document.getElementById("sourceBadge");
const scoreBar  = document.getElementById("scoreBar");
const scoreText = document.getElementById("scoreText");
const flagsList = document.getElementById("flagsList");

// ----- Helpers -----
function toast(msg) { M.toast({ html: msg }); }

function setLoading(isLoading) {
  loaderEl.style.display = isLoading ? "block" : "none";
  btnEl.disabled = isLoading;
}

function paintVerdict(verdict) {
  verdictEl.textContent = verdict;
  verdictEl.className = "chip";
  if (verdict.includes("Likely Fake")) verdictEl.classList.add("red", "white-text");
  else if (verdict.includes("Needs Verification")) verdictEl.classList.add("amber", "black-text");
  else verdictEl.classList.add("green", "white-text");
}

function paintSource(label) {
  sourceEl.textContent = label || "Unknown";
  sourceEl.className = "chip";
  if (label === "Trusted") sourceEl.classList.add("green", "white-text");
  else if (label === "Untrusted") sourceEl.classList.add("red", "white-text");
  else sourceEl.classList.add("grey", "white-text");
}

function paintScore(score) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  scoreBar.style.width = `${pct}%`;
  scoreText.textContent = `${pct}/100 (higher = more credible)`;
}

function paintFlags(flags) {
  flagsList.innerHTML = "";
  if (!flags || !flags.length) {
    const li = document.createElement("li");
    li.className = "collection-item";
    li.textContent = "No flags detected.";
    flagsList.appendChild(li);
    return;
  }
  flags.forEach(f => {
    const li = document.createElement("li");
    li.className = "collection-item";
    li.textContent = f;
    flagsList.appendChild(li);
  });
}

function showResult({ verdict, score, sourceLabel, flags }) {
  paintVerdict(verdict);
  paintSource(sourceLabel);
  paintScore(score);
  paintFlags(flags);
  resultEl.style.display = "block";
}

// ----- Mock -----
function mockAnalyze(input) {
  const hasWow = /shocking|exposed|secret|miracle|outrage|scandal|urgent|banned/i.test(input);
  const isUrl  = /^https?:\/\//i.test(input);
  const score  = Math.max(0, Math.min(100, 70 - (hasWow ? 25 : 0)));
  return {
    inputType: isUrl ? "url" : "headline",
    score,
    verdict: score < 30 ? "Likely Fake/Misleading" : score < 60 ? "Needs Verification" : "Likely Credible",
    flags: hasWow ? ["Sensational keywords detected"] : [],
    sourceLabel: isUrl ? "Unknown" : "Unknown"
  };
}

// ----- Actions -----
async function checkHealth() {
  try {
    const r = await fetch(HEALTH_URL);
    return r.ok;
  } catch {
    return false;
  }
}

async function analyze(input) {
  if (!input || !input.trim()) {
    toast("Please enter a headline or URL.");
    return;
  }

  setLoading(true);
  resultEl.style.display = "none";

  let data;
  try {
    const res = await fetch(ANALYZE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: input.trim() })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    // fallback if backend is unavailable
    if (USE_MOCK_WHEN_OFFLINE && !(await checkHealth())) {
      toast("Backend not reachable—showing mock result.");
      data = mockAnalyze(input);
    } else {
      toast("Something went wrong. Try again.");
      setLoading(false);
      return;
    }
  }

  showResult(data);
  setLoading(false);
}

// ----- Events -----
btnEl.addEventListener("click", () => analyze(inputEl.value));
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") analyze(inputEl.value);
});
