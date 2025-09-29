(function(){
  const API_BASE = '/api';
  async function loadLeaderboard() {
    const branch = document.getElementById('lb-branch').value;
    const res = await fetch(`${API_BASE}/leaderboard?branch=${encodeURIComponent(branch)}`);
    const data = await res.json();
    const list = document.getElementById('lb-list');
    list.innerHTML = '';
    (data.leaderboard || []).forEach((row, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>#${i+1} ${row.username}</strong> — XP: ${row.xp} · Level ${row.level} · ${row.branch}`;
      list.appendChild(li);
    });
  }
  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lb-refresh').addEventListener('click', loadLeaderboard);
    loadLeaderboard();
  });
})();
