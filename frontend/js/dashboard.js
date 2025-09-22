// simple dashboard client
document.addEventListener('DOMContentLoaded', () => {
  const elems = document.querySelectorAll('select');
  M.FormSelect.init(elems);

  const tbody = document.getElementById('logsTable');
  const emptyState = document.getElementById('emptyState');
  const filterSel = document.getElementById('filterSource');
  const sortSel   = document.getElementById('sortBy');

  let rows = [];

  async function fetchLogs(){
    try{
      const res = await fetch('/api/logs?limit=20');
      if(!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      rows = (data || []).map(x => ({
        ts: new Date(x.ts || x.timestamp || Date.now()),
        input: x.input || x.headline || x.url || '',
        score: Number(x.score ?? 0),
        source: x.sourceLabel || x.source?.label || 'Unknown'
      }));
      render();
    }catch(e){
      tbody.innerHTML = `<tr><td colspan="4" class="red-text center-align">Failed to load logs.</td></tr>`;
      console.error(e);
    }
  }

  function render(){
    let view = [...rows];

    // filter
    const f = filterSel.value;
    if (f) view = view.filter(r => r.source === f);

    // sort
    const s = sortSel.value;
    view.sort((a,b)=>{
      switch(s){
        case 'ts_asc': return a.ts - b.ts;
        case 'ts_desc': return b.ts - a.ts;
        case 'score_asc': return a.score - b.score;
        case 'score_desc': return b.score - a.score;
        default: return b.ts - a.ts;
      }
    });

    if (!view.length){
      tbody.innerHTML = '';
      emptyState.style.display = '';
      return;
    }
    emptyState.style.display = 'none';

    tbody.innerHTML = view.map(r => `
      <tr>
        <td>${r.ts.toLocaleString()}</td>
        <td class="truncate" title="${r.input}">${r.input}</td>
        <td>${r.score}</td>
        <td>
          <span class="chip ${r.source==='Trusted'?'green':r.source==='Untrusted'?'red':'grey'}">${r.source}</span>
        </td>
      </tr>
    `).join('');
  }

  filterSel.addEventListener('change', render);
  sortSel.addEventListener('change', render);

  fetchLogs();
});
