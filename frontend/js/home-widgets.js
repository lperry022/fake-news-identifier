// animate counters
function animateCounts() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = Number(el.dataset.count || 0);
    const dur = 900, start = performance.now();
    function step(t){
      const p = Math.min(1, (t - start)/dur);
      const val = target % 1 ? (target * p).toFixed(1) : Math.floor(target * p);
      el.textContent = Number(val).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// recent checks (uses backend if available; otherwise mock)
async function hydrateRecent() {
  const table = document.getElementById('recentTable');
  if (!table) return;
  try {
    const res = await fetch('/api/logs?limit=6');
    if (!res.ok) throw new Error('bad status');
    const rows = await res.json();
    render(rows.map(r => ({
      ts: new Date(r.ts || r.timestamp || Date.now()),
      input: r.input || r.headline || r.url || '',
      score: Number(r.score ?? 0),
      source: r.sourceLabel || r.source?.label || 'Unknown'
    })));
  } catch {
    const mock = [
      {ts:new Date(), input:'Breaking: New policy shocks markets', score:38, source:'Unknown'},
      {ts:new Date(Date.now()-3600e3), input:'Celebrity cures illness with herb', score:22, source:'Untrusted'},
      {ts:new Date(Date.now()-7200e3), input:'Local council opens new library', score:82, source:'Trusted'},
    ];
    render(mock);
  }
  function render(data){
    table.innerHTML = data.map(r => `
      <tr>
        <td>${r.ts.toLocaleString()}</td>
        <td class="truncate" title="${r.input}">${r.input}</td>
        <td>${r.score}</td>
        <td><span class="chip ${r.source==='Trusted'?'green':r.source==='Untrusted'?'red':'grey'}">${r.source}</span></td>
      </tr>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  animateCounts();
  hydrateRecent();
});
