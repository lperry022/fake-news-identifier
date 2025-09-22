// Dashboard client: robust rendering with empty-state row, demo fallback.
document.addEventListener('DOMContentLoaded', () => {
  // Give navbar.js a tick to finish toggling auth UI
  setTimeout(init, 0);

  function init() {
    // Initialize selects if present
    if (window.M && M.FormSelect) M.FormSelect.init(document.querySelectorAll('select'));

    const tbody       = document.getElementById('logsTable');
    const emptyState  = document.getElementById('emptyState');
    const filterSel   = document.getElementById('filterSource');
    const sortSel     = document.getElementById('sortBy');
    const searchInp   = document.getElementById('searchText');
    const btnRefresh  = document.getElementById('btn-refresh');
    const btnExport   = document.getElementById('btn-export');

    if (!tbody) {
      console.warn('dashboard.js: #logsTable not found — check dashboard.html markup.');
      return;
    }

    let rows = [];
    let view = [];

    btnRefresh?.addEventListener('click', fetchLogs);
    btnExport?.addEventListener('click', exportCSV);
    filterSel?.addEventListener('change', applyAndRender);
    sortSel?.addEventListener('change', applyAndRender);
    searchInp?.addEventListener('input', applyAndRender);

    fetchLogs();

    function getToken() {
      if (window.Auth && typeof Auth.getToken === 'function') return Auth.getToken();
      return (
        localStorage.getItem('userToken') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('userToken') ||
        null
      );
    }

    async function fetchLogs() {
      try {
        tbody.innerHTML = `<tr><td colspan="4" class="grey-text center-align">Loading…</td></tr>`;

        const token = getToken();
        const res = await fetch('/api/logs?limit=200', {
          credentials: 'include', // allow cookie sessions
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (res.status === 401 || res.status === 403) {
          // Not logged in → send to login with redirect back here
          M?.toast({ html: 'Please log in to access the dashboard', classes: 'red darken-2' });
          const dest = encodeURIComponent('/frontend/dashboard.html');
          setTimeout(() => { window.location.replace('/frontend/login.html?redirect=' + dest); }, 900);
          return;
        }

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();
        rows = (data || []).map(x => ({
          ts:    new Date(x.ts || x.timestamp || Date.now()),
          input: (x.input || x.headline || x.url || '').trim(),
          score: Number(x.score ?? 0),
          source: x.sourceLabel || x.source?.label || 'Unknown'
        }));
      } catch (e) {
        // If fetch fails (dev mode / API down), show demo rows so UI isn't empty
        rows = [
          // comment these out if you never want demo data:
          // { ts:new Date(),                  input:'Breaking: New policy shocks markets', score:38, source:'Unknown' },
          // { ts:new Date(Date.now()-3600e3), input:'Celebrity cures illness with herb',   score:22, source:'Untrusted' },
          // { ts:new Date(Date.now()-7200e3), input:'Local council opens new library',     score:82, source:'Trusted'  },
        ];
        console.warn('Failed to load logs:', e);
        if (rows.length) M?.toast({ html: 'Showing demo data', classes: 'orange darken-2' });
      }

      applyAndRender();
    }

    function applyAndRender() {
      view = [...rows];

      const f = filterSel?.value || '';
      if (f) view = view.filter(r => r.source === f);

      const q = (searchInp?.value || '').toLowerCase().trim();
      if (q) view = view.filter(r => r.input.toLowerCase().includes(q));

      const s = sortSel?.value || 'ts_desc';
      view.sort((a,b) => {
        switch (s) {
          case 'ts_asc':     return a.ts - b.ts;
          case 'ts_desc':    return b.ts - a.ts;
          case 'score_asc':  return a.score - b.score;
          case 'score_desc': return b.score - a.score;
          default:           return b.ts - a.ts;
        }
      });

      renderTable();
    }

    function renderTable() {
      // Always show a body row (either data or empty state)
      if (!view.length) {
        emptyState && (emptyState.style.display = 'none'); // we render row instead
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="grey-text center-align" style="padding: 20px;">
              <i class="material-icons" style="vertical-align: middle; margin-right: 8px;">history</i>
              You don’t have any searches yet. Analyze a headline on the home page to see your history here.
            </td>
          </tr>
        `;
        return;
      }

      emptyState && (emptyState.style.display = 'none');
      tbody.innerHTML = view.map(r => `
        <tr>
          <td>${r.ts.toLocaleString()}</td>
          <td class="truncate" title="${esc(r.input)}">${esc(r.input)}</td>
          <td>${r.score}</td>
          <td>
            <span class="chip ${r.source==='Trusted'?'green':r.source==='Untrusted'?'red':'grey'}">${r.source}</span>
          </td>
        </tr>
      `).join('');
    }

    function exportCSV() {
      if (!view.length) return M?.toast({ html: 'Nothing to export', classes: 'grey darken-2' });
      const header = ['Time','Input','Score','Source'];
      const rowsCsv = view.map(r => [
        r.ts.toISOString(),
        r.input.replaceAll('"','""'),
        r.score,
        r.source
      ]);
      const csv = [header, ...rowsCsv].map(cols => cols.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `fakenews-dashboard-${Date.now()}.csv`;
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(url); a.remove();
    }

    function esc(s='') {
      return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }
  }
});
