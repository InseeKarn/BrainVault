(function(){
  const { authFetch, API_BASE } = window.BrainVaultAuth || {};

  async function loadAvatarFallback(profile){
    const img = document.getElementById('profile-avatar');
    if (!img) return;
    if (profile && profile.avatar) img.src = profile.avatar;
    else img.src = 'https://www.gravatar.com/avatar/?d=identicon';
  }

  async function updateAvatar(){
    const url = document.getElementById('avatar-url').value.trim();
    if (!url) { alert('Please enter an image URL'); return; }
    const res = await authFetch(`${API_BASE}/user/me/avatar`, { method: 'PUT', body: JSON.stringify({ avatar: url }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Failed to update'); return; }
    document.getElementById('profile-avatar').src = data.avatar;
  }

  async function uploadAvatar(){
    const fileInput = document.getElementById('avatar-file');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) { alert('Choose an image file'); return; }
    const fd = new FormData();
    fd.append('avatar', fileInput.files[0]);
    const res = await fetch(`${API_BASE}/user/me/avatar/upload`, { method: 'POST', headers: (window.BrainVaultAuth.getToken()? { 'Authorization': 'Bearer ' + window.BrainVaultAuth.getToken() } : {}), body: fd });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Upload failed'); return; }
    document.getElementById('profile-avatar').src = data.avatar;
  }

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await authFetch(`${API_BASE}/user/me`);
      const data = await res.json();
      const p = data.profile;
      await loadAvatarFallback(p);
      const el = document.getElementById('profile-data');
      if (el) el.innerHTML = `<div><strong>${p.username}</strong> (${p.email})</div><div>Level ${p.level} · ${p.xp} XP</div><div>Plan: ${p.plan}</div>`;
      // Progress
      const cur = document.getElementById('pf-cur');
      const nxt = document.getElementById('pf-next');
      const lvl = document.getElementById('pf-level');
      const bar = document.getElementById('pf-bar');
      if (cur && nxt && lvl && bar) {
        cur.textContent = p.currentXP || 0;
        nxt.textContent = p.nextLevelXP || 100;
        lvl.textContent = p.level || 1;
        const percent = Math.max(0, Math.min(100, Math.round((p.currentXP||0)/(p.nextLevelXP||1)*100)));
        bar.style.width = percent + '%';
      }
      const planEl = document.getElementById('pf-plan');
      if (planEl) planEl.textContent = p.plan || 'free';
      // Mock stats
      const s7 = document.getElementById('pf-7d');
      const s30 = document.getElementById('pf-30d');
      const top = document.getElementById('pf-top');
      if (s7) s7.textContent = 250;
      if (s30) s30.textContent = 1200;
      if (top) top.textContent = 'Mechanics, Electromagnetism';
    } catch(_) { await loadAvatarFallback(null); }
    const btn = document.getElementById('avatar-update');
    if (btn) btn.addEventListener('click', updateAvatar);
    const up = document.getElementById('avatar-upload');
    if (up) up.addEventListener('click', uploadAvatar);
  });
})();