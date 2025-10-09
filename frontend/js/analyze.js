// frontend/js/analyze.js — FINAL FIXED VERSION (for logged-in + logged-out users)

const $ = (s) => document.querySelector(s);
const toast = (msg) => (window.M && M.toast) ? M.toast({ html: msg }) : alert(msg);
const show = (el, v = true) => { if (el) el.style.display = v ? "" : "none"; };

// ✅ Backend endpoint (always port 5000)
const API_BASE = "http://localhost:5000";

const elInput    = $('#newsInput');
const elBtn      = $('#analyzeBtn');
const elLoader   = $('#loader');
const elResult   = $('#result');
const elScoreBar = $('#scoreBar');
const elScoreTxt = $('#scoreText');
const elVerdict  = $('#verdictBadge');
const elSource   = $('#sourceBadge');
const elFlags    = $('#flagsList');

let debounceId;
const debounce = (fn, ms = 400) => { clearTimeout(debounceId); debounceId = setTimeout(fn, ms); };

function scoreClass(n) {
  if (n >= 70) return 'green';
  if (n >= 40) return 'amber';
  return 'red';
}
function verdictFromScore(n) {
  if (n >= 70) return 'Likely Trustworthy';
  if (n >= 40) return 'Needs Caution';
  return 'Potentially Misleading';
}

// 🧠 Centralized API call
async function callAnalyze(input) {
  const payload = {
    input,
    type: /^https?:\/\//i.test(input) ? 'url' : 'headline'
  };

  console.log("🔹 Sending analysis request:", payload);

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ✅ ensures cookie/session sent when logged in
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.error("❌ Backend returned:", res.status, res.statusText);
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  console.log("✅ Received analysis data:", data);
  return data;
}

function renderScore(score) {
  const cls = scoreClass(score);
  elScoreBar.style.width = `${score}%`;
  elScoreBar.className = `determinate ${cls}`;
  elScoreTxt.textContent = `Score: ${score}/100`;
  elVerdict.textContent = verdictFromScore(score);
  elVerdict.className = `chip ${cls}`;
}

function renderSource(source) {
  const label = source?.label || 'Unknown';
  elSource.textContent = `Source: ${label}`;
  elSource.className = 'chip ' + (
    label === 'Trusted'   ? 'green' :
    label === 'Untrusted' ? 'red'   : 'grey'
  );
}

function renderFlags(flags = [], facts = []) {
  elFlags.innerHTML = '';
  const items = [];

  if (flags.length) {
    items.push({ icon: 'flag', text: `${flags.length} keyword(s) flagged` });
    flags.forEach(f => items.push({ icon: 'label', text: `${f.term || f} (${f.severity || 'low'})` }));
  }
  if (facts.length) {
    facts.forEach(f => items.push({ icon: 'verified', text: `${f.source}: ${f.label}` }));
  }
  if (!items.length) items.push({ icon: 'check', text: 'No flags identified by the analyzer.' });

  for (const i of items) {
    const li = document.createElement('li');
    li.className = 'collection-item';
    li.innerHTML = `<i class="material-icons left">${i.icon}</i>${i.text}`;
    elFlags.appendChild(li);
  }
}

let chart;

async function analyzeNow() {
  const val = (elInput.value || '').trim();
  if (!val) {
    toast('Please enter a headline or URL.');
    elInput.focus();
    return;
  }

  console.log("🟢 analyzeNow() triggered. Input:", val);

  show(elLoader, true);
  show(elResult, false);
  elBtn.disabled = true;

  try {
    const data = await callAnalyze(val);

    renderScore(data.score ?? 0);
    renderSource(data.source);
    renderFlags(data.flags || [], data.facts || []);
    show(elResult, true);

    // Pie chart: fake vs real
    const score = data.score ?? 0;
    const fakePart = 100 - score;
    const realPart = score;

    const ctx = document.getElementById("headlineChart").getContext("2d");
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Fake %", "Real %"],
        datasets: [{
          data: [fakePart, realPart],
          backgroundColor: ["#e53935", "#43a047"]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Credibility Score Breakdown" }
        }
      }
    });

  } catch (err) {
    console.error("❌ ANALYZE_ERROR:", err);
    toast('Unable to analyze at the moment. Please try again.');
  } finally {
    show(elLoader, false);
    elBtn.disabled = false;
    await loadRecentChecks();
  }
}

// --- Events ---
elBtn?.addEventListener('click', analyzeNow);
elInput?.addEventListener('input', () => debounce(() => {
  const v = (elInput.value || '').trim();
  if (v.length >= 8) analyzeNow();
}, 600));

// --- Recent checks ---
async function loadRecentChecks() {
  try {
    console.log("📡 Loading recent checks...");
    const res = await fetch(`${API_BASE}/api/analyze/recent`, {
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();

    const table = document.getElementById("recentTable");
    table.innerHTML = "";

    if (!items.length) {
      table.innerHTML = `<tr><td colspan="4" class="grey-text center-align">No recent checks yet.</td></tr>`;
      return;
    }

    for (const r of items) {
      const tr = document.createElement("tr");
      const d = new Date(r.createdAt).toLocaleString();
      tr.innerHTML = `
        <td>${d}</td>
        <td>${r.input}</td>
        <td>${r.score}</td>
        <td>${r.source}</td>
      `;
      table.appendChild(tr);
    }
  } catch (err) {
    console.error("RECENT_CHECKS_ERROR:", err);
  }
}

// 🔹 Quick session test (to verify login)
(async () => {
  try {
    const res = await fetch(`${API_BASE}/profile/session`, { credentials: 'include' });
    if (res.ok) {
      const user = await res.json();
      console.log("👤 Session user detected:", user?.email || "(anonymous)");
    } else {
      console.log("👤 No active session detected.");
    }
  } catch {
    console.log("👤 Session check skipped (endpoint not found).");
  }
})();

loadRecentChecks();
