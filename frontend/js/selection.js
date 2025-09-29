(function(){
  const { authFetch, API_BASE } = window.BrainVaultAuth || {};

  const branches = [
    'Mechanics','Thermodynamics','Electromagnetism','Optics','Modern Physics','Acoustics','Astrophysics','Condensed Matter','Plasma','Biophysics','Geophysics','Computational Physics'
  ];

  function tile(name){
    const div = document.createElement('div');
    div.className = 'checkbox-tile';
    const id = `branch_${name.replace(/\s+/g,'_')}`;
    div.innerHTML = `<input id=\"${id}\" type=\"checkbox\" value=\"${name}\"/><label for=\"${id}\"><span class=\"branch-name\">${name}</span></label>`;
    const cb = div.querySelector('input');
    const lbl = div.querySelector('label');
    const toggle = () => { div.classList.toggle('selected', cb.checked); };
    cb.addEventListener('change', toggle);
    lbl.addEventListener('click', () => { cb.checked = !cb.checked; toggle(); });
    return div;
  }

  async function loadPreview(){
    const diff = document.getElementById('difficulty').value;
    const selected = Array.from(document.querySelectorAll('#branch-grid input:checked')).map(i => i.value);
    const url = `${API_BASE}/problems?limit=15&difficulty=${encodeURIComponent(diff)}&branch=${encodeURIComponent(selected.join(','))}`;
    const res = await authFetch(url);
    const data = await res.json();
    const list = document.getElementById('problems-list');
    list.innerHTML = '';
    (data.problems||[]).forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${p.branch} › ${p.subbranch}</strong> — ${p.difficulty}<br/>${p.question}`;
      list.appendChild(li);
    });
  }

  async function startPractice(){
    const diff = document.getElementById('difficulty').value;
    const selected = Array.from(document.querySelectorAll('#branch-grid input:checked')).map(i => i.value);
    const url = `${API_BASE}/problems?limit=200&difficulty=${encodeURIComponent(diff)}&branch=${encodeURIComponent(selected.join(','))}`;
    const res = await authFetch(url);
    const data = await res.json();
    const items = data.problems || [];
    if (!items.length) { alert('No problems found for selected scope'); return; }
    const pick = items[Math.floor(Math.random()*items.length)];
    window.location.href = `./problem_workspace.html?problemId=${encodeURIComponent(pick.id)}`;
  }

  window.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('branch-grid');
    branches.forEach(b => grid.appendChild(tile(b)));
    document.getElementById('select-all-branches').addEventListener('click', () => {
      document.querySelectorAll('#branch-grid .checkbox-tile').forEach(div => { const cb=div.querySelector('input'); cb.checked=true; div.classList.add('selected'); });
      loadPreview();
    });
    document.getElementById('clear-branches').addEventListener('click', () => {
      document.querySelectorAll('#branch-grid .checkbox-tile').forEach(div => { const cb=div.querySelector('input'); cb.checked=false; div.classList.remove('selected'); });
      loadPreview();
    });
    document.getElementById('difficulty').addEventListener('change', loadPreview);
    grid.addEventListener('change', loadPreview);
    document.getElementById('start-practice').addEventListener('click', startPractice);
    loadPreview();
  });
})();