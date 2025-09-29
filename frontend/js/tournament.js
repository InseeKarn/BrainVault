(function(){
  const { authFetch, requireAuth, API_BASE } = window.BrainVaultAuth || {};
  const spectate = new URLSearchParams(window.location.search).get('spectate') === '1';
  if (!spectate) requireAuth();

  let currentId = null;
  let poller = null;

  function setPanel(t){
    const panel = document.getElementById('tour-panel');
    panel.hidden = !t;
    if (!t) return;
    document.getElementById('tour-id').textContent = t.id;
    document.getElementById('tour-status').textContent = t.status;
    const ul = document.getElementById('players-list');
    ul.innerHTML = '';
    (t.players||[]).forEach(p => {
      const li = document.createElement('li');
      li.textContent = `${p.username} — ${p.score} pts ${p.finished? '(finished)':''}`;
      ul.appendChild(li);
    });
    const ol = document.getElementById('problems-list');
    ol.innerHTML = '';
    (t.problems||[]).forEach(pr => {
      const li = document.createElement('li');
      li.innerHTML = `<div><strong>${pr.branch} › ${pr.subbranch}</strong> — ${pr.difficulty}</div><div>${pr.question}</div>`;
      // simple answer box
      const box = document.createElement('div');
      box.style = 'margin:6px 0; display:flex; gap:6px;';
      box.innerHTML = `<input type="number" step="any" placeholder="your answer" style="max-width:160px;"/><button class="btn secondary">Submit</button>`;
      const btn = box.querySelector('button');
      const inp = box.querySelector('input');
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await authFetch(`${API_BASE}/tournament/${encodeURIComponent(t.id)}/submit`, { method:'POST', body: JSON.stringify({ problemId: pr.id, value: Number(inp.value) }) });
          const data = await res.json();
          if (!res.ok) { alert(data.error||'Submit failed'); btn.disabled=false; return; }
          refresh();
        } catch(e){ btn.disabled=false; }
      });
      li.appendChild(box);
      ol.appendChild(li);
    });
  }

  async function createTour(){
    const branchSel = document.getElementById('tour-branch').value || null;
    const difficulty = document.getElementById('tour-difficulty').value || 'Medium';
    const res = await authFetch(`${API_BASE}/tournament/create`, { method:'POST', body: JSON.stringify({ branch: branchSel, difficulty }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error||'Create failed'); return; }
    currentId = data.tournament.id;
    setPanel(data.tournament);
    startPolling();
  }

  async function joinTour(){
    const id = document.getElementById('join-id').value.trim();
    if (!id) return alert('Enter tournament ID');
    const res = await authFetch(`${API_BASE}/tournament/${encodeURIComponent(id)}/join`, { method:'POST' });
    const data = await res.json();
    if (!res.ok) { alert(data.error||'Join failed'); return; }
    currentId = id;
    setPanel(data.tournament);
    startPolling();
  }

  async function startTour(){
    if (!currentId) return;
    const res = await authFetch(`${API_BASE}/tournament/${encodeURIComponent(currentId)}/start`, { method:'POST' });
    const data = await res.json();
    if (!res.ok) { alert(data.error||'Start failed'); return; }
    setPanel(data.tournament);
  }

  async function refresh(){
    if (!currentId) return;
    const endpoint = spectate ? 'spectate' : 'status';
    const res = await fetch(`${API_BASE}/tournament/${encodeURIComponent(currentId)}/${endpoint}`);
    const data = await res.json();
    if (!res.ok) { return; }
    setPanel(data.tournament);
  }

  function startPolling(){
    if (poller) clearInterval(poller);
    poller = setInterval(refresh, 2000);
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('create-btn').addEventListener('click', createTour);
    document.getElementById('join-btn').addEventListener('click', joinTour);
    document.getElementById('start-btn').addEventListener('click', startTour);
    document.getElementById('refresh-btn').addEventListener('click', refresh);
  });
})();