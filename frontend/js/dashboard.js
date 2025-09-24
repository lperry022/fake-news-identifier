// dashboard.js – fancy dashboard with cards, filters, and summaries
console.log("DASHBOARD.JS LOADED");

let ALL_ITEMS = [];
let CURRENT_FILTER = { text: "", source: "all" };
let PAGE_SIZE = 12;    // render 12 cards at a time
let renderedCount = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await loadHistory();

  // wire filters
  document.getElementById('filter-text')?.addEventListener('input', (e) => {
    CURRENT_FILTER.text = (e.target.value || "").toLowerCase();
    rerender();
  });

  document.querySelectorAll('.source-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.source-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      CURRENT_FILTER.source = chip.dataset.src || "all";
      rerender();
    });
  });

  document.getElementById('btn-load-more')?.addEventListener('click', () => {
    renderNextPage();
  });
});

async function loadHistory() {
  try {
    const res = await fetch('/user/history?limit=200', { credentials: 'include' });
    if (res.status === 401) {
      M.toast({ html: 'Please log in to view your dashboard', classes: 'red darken-2' });
      setTimeout(() => (window.location.href = '/frontend/login.html?redirect=dashboard.html'), 800);
      return;
    }
    const data = await res.json();
    ALL_ITEMS = data?.items || [];

    updateSummary(ALL_ITEMS);
    rerender();
  } catch (err) {
    console.error(err);
    M.toast({ html: 'Failed to load history', classes: 'red darken-2' });
  }
}

function rerender() {
  // reset grid
  const grid = document.getElementById('history-grid');
  grid.innerHTML = "";
  renderedCount = 0;

  const list = applyFilters(ALL_ITEMS, CURRENT_FILTER);
  if (!list.length) {
    document.getElementById('history-empty').style.display = '';
    document.getElementById('btn-load-more').style.display = 'none';
    return;
  }
  document.getElementById('history-empty').style.display = 'none';

  // render first page
  renderNextPage(list);
}

function renderNextPage(list = applyFilters(ALL_ITEMS, CURRENT_FILTER)) {
  const grid = document.getElementById('history-grid');
  const end = Math.min(renderedCount + PAGE_SIZE, list.length);
  const slice = list.slice(renderedCount, end);
  slice.forEach(item => {
    grid.insertAdjacentHTML('beforeend', renderCard(item));
  });
  renderedCount = end;

  const btn = document.getElementById('btn-load-more');
  btn.style.display = (renderedCount < list.length) ? '' : 'none';
  if (M?.AutoInit) M.AutoInit();
}

// ---- Rendering helpers ----
function renderCard(item) {
  const when = new Date(item.createdAt);
  const niceWhen = when.toLocaleString();
  const rel = timeAgo(when);

  const title = item.inputType === "url"
    ? (item.inputUrl || "(URL)")
    : (item.inputText || "(headline)");

  const flags = (item.flags || []);
  const label = item.sourceLabel || "Unknown";
  const score = (item.score ?? 0);

  const scoreClr = scoreToColor(score);
  const perc = clamp(score, 0, 100);

  return `
    <div class="col s12 m6 l4">
      <div class="card card-check">
        <div class="card-content white-text">
          <span class="card-title truncate">
            <i class="material-icons left">flag</i>
            ${escapeHtml(title)}
          </span>

          <div class="score-row">
            <span class="score-badge ${scoreClr}">${perc}</span>
            <div class="progress scorebar">
              <div class="determinate ${scoreClr}" style="width:${perc}%"></div>
            </div>
          </div>

          <div class="chips-row">
            ${sourceChip(label)}
            ${flags.length ? flags.map(f => `<div class="chip chip-flag">${escapeHtml(f)}</div>`).join('') : `<span class="grey-text">No flags</span>`}
          </div>

          <p class="grey-text lighten-2" style="margin-top:6px;">
            <i class="material-icons tiny">schedule</i>
            <span title="${niceWhen}">${rel}</span>
          </p>
        </div>
      </div>
    </div>
  `;
}

function sourceChip(label) {
  const cls = label.toLowerCase();
  return `<div class="chip chip-source ${cls}">${label}</div>`;
}

function scoreToColor(s) {
  if (s >= 70) return 'green';
  if (s >= 50) return 'amber';
  return 'red';
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

function timeAgo(date) {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return `just now`;
  const minutes = diff/60;
  if (minutes < 60) return `${Math.floor(minutes)} min ago`;
  const hours = minutes/60;
  if (hours < 24) return `${Math.floor(hours)} hr ago`;
  const days = hours/24;
  if (days < 7) return `${Math.floor(days)} day${days>=2?'s':''} ago`;
  return date.toLocaleDateString();
}

function escapeHtml(s) {
  if (!s) return "";
  return s.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

// ---- Filters & summary ----
function applyFilters(items, filter) {
  const text = (filter.text || "").trim();
  const src = (filter.source || "all");
  return items.filter(it => {
    const okSrc = (src === 'all') || ((it.sourceLabel || 'Unknown') === src);
    if (!okSrc) return false;
    if (!text) return true;

    const hay = [
      it.inputText || "",
      it.inputUrl || "",
      (it.flags || []).join(" "),
      (it.sourceLabel || "")
    ].join(" ").toLowerCase();

    return hay.includes(text);
  });
}

function updateSummary(items) {
  const total = items.length;
  const avg = total ? Math.round(items.reduce((a, b) => a + (b.score || 0), 0) / total) : null;
  const trusted = items.filter(i => i.sourceLabel === "Trusted").length;
  const ratio = total ? Math.round((trusted / total) * 100) : null;

  document.getElementById('sum-total').textContent = total;
  document.getElementById('sum-avg').textContent = (avg ?? '—');
  document.getElementById('sum-trusted').textContent = (ratio !== null ? `${ratio}%` : '—');
}
