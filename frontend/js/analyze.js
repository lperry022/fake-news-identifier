// frontend/js/analyze.js — FINAL VERSION (with Highlight Feature for homepage)

const $ = (s) => document.querySelector(s);
const toast = (msg) => (window.M && M.toast) ? M.toast({ html: msg }) : alert(msg);
const show  = (el, v = true) => { if (el) el.style.display = v ? "" : "none"; };

const elInput   = $('#newsInput');
const elBtn     = $('#analyzeBtn');
const elLoader  = $('#loader');
const elResult  = $('#result');
const elScoreBar= $('#scoreBar');
const elScoreTxt= $('#scoreText');
const elVerdict = $('#verdictBadge');
const elSource  = $('#sourceBadge');
const elFlags   = $('#flagsList');
const elHighlight = $('#highlightedText');   // 👈 add a div/span in HTML to display highlighted text

// ✨ Highlight section (added)
const elHighlightSection = document.getElementById("highlightSection");
const elHighlightedText  = document.getElementById("highlightedText");

let debounceId;
const debounce = (fn, ms=400)=>{ clearTimeout(debounceId); debounceId=setTimeout(fn, ms); };

function scoreClass(n){
  if (n >= 70) return 'green';
  if (n >= 40) return 'amber';
  return 'red';
}
function verdictFromScore(n){
  if (n >= 70) return 'Likely Trustworthy';
  if (n >= 40) return 'Needs Caution';
  return 'Potentially Misleading';
}

async function callAnalyze(input){
  const payload = { input, type: /^https?:\/\//i.test(input) ? 'url' : 'headline' };
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderScore(score){
  const cls = scoreClass(score);
  elScoreBar.style.width = `${score}%`;
  elScoreBar.className = `determinate ${cls}`;
  elScoreBar.parentElement.setAttribute('aria-valuenow', String(score));
  elScoreTxt.textContent = `Score: ${score}/100`;
  elScoreTxt.className = `grey-text text-lighten-1`;
  elVerdict.textContent = verdictFromScore(score);
  elVerdict.className = `chip ${cls}`;
}

function renderSource(source){
  const label = source?.label || 'Unknown';
  elSource.textContent = `Source: ${label}`;
  elSource.className = 'chip ' + (
    label === 'Trusted'   ? 'green' :
    label === 'Untrusted' ? 'red'   : 'grey'
  );
}

function renderFlags(keywords=[], facts=[]){
  elFlags.innerHTML = '';
  const items = [];
  if (keywords.length){
    items.push({ icon:'flag', text:`${keywords.length} keyword(s) flagged` });
    keywords.forEach(k => items.push({ icon:'label', text:`${k.term || k} (${k.severity||'low'})` }));
  }
  if (facts.length){
    facts.forEach(f => items.push({ icon:'verified', text:`${f.source}: ${f.label}` }));
  }
  if (!items.length){
    items.push({ icon:'check', text:'No flags identified by the analyzer.' });
  }
  items.forEach(i => {
    const li = document.createElement('li');
    li.className = 'collection-item';
    li.innerHTML = `<i class="material-icons left">${i.icon}</i>${i.text}`;
    elFlags.appendChild(li);
  });
}

// 🟡 Keyword highlighting logic
function highlightKeywords(text) {
  if (!text) return '';
  const keywords = [
    'shocking', 'secret', 'breaking', 'miracle', 'banned', 'revealed',
    'hidden', 'truth', 'warning', 'alert', 'scandal', 'hoax', 'exposed'
  ];
  const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

let chart;

async function analyzeNow(){
  const val = (elInput.value || '').trim();
  if (!val){ toast('Please enter a headline or URL.'); elInput.focus(); return; }

  show(elLoader, true);
  show(elResult, false);
  elBtn.disabled = true;

  try{
    const data = await callAnalyze(val);
    renderScore(data.score ?? 0);
    renderSource(data.source);
    renderFlags(data.flags || [], data.facts || []);

    // ✅ Highlight keywords from input
    if (elHighlightedText && elHighlightSection) {
      elHighlightedText.innerHTML = highlightKeywords(val);
      show(elHighlightSection, true);
    }

    show(elResult, true);
  }catch(err){
    console.error(err);
    toast('Unable to analyze at the moment. Please try again.');
  }finally{
    show(elLoader, false);
    elBtn.disabled = false;
  }
}

// events
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

// 🔹 Quick session test
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
