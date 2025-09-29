(function(){
  const { authFetch, requireAuth, API_BASE } = window.BrainVaultAuth || {};

  const branches = [
    'Mechanics','Thermodynamics','Electromagnetism','Optics','Modern Physics','Acoustics','Astrophysics','Condensed Matter','Plasma','Biophysics','Geophysics','Computational Physics'
  ];

  // XP requirements for each level
  function getXPForLevel(level) {
    return level * 100; // Simple progression: Level 1 = 100 XP, Level 2 = 200 XP, etc.
  }

  function calculateLevel(xp) {
    let level = 1;
    let totalRequired = 0;
    while (totalRequired + getXPForLevel(level) <= xp) {
      totalRequired += getXPForLevel(level);
      level++;
    }
    return { level: level - 1, currentXP: xp - totalRequired, nextLevelXP: getXPForLevel(level) };
  }

  async function loadProfile() {
    if (!authFetch) return;
    try {
      const res = await authFetch(`${API_BASE}/user/me`);
      if (!res.ok) throw new Error('Not logged in');
      const data = await res.json();
      const p = data.profile;
      
      // Update user name
      const userNameEl = document.getElementById('userName');
      if (userNameEl) userNameEl.textContent = p.username || 'Physicist';
      
      // Calculate level info
      const levelInfo = calculateLevel(p.xp || 0);
      
      // Update quick stats
      document.getElementById('userLevel').textContent = levelInfo.level;
      document.getElementById('userXP').textContent = (p.xp || 0).toLocaleString();
      document.getElementById('hintTokens').textContent = p.hintTokens || 5;
      document.getElementById('problemsSolved').textContent = p.problemsSolved || 0;
      
      // Update level progress card
      document.getElementById('currentLevel').textContent = levelInfo.level;
      document.getElementById('currentXP').textContent = levelInfo.currentXP;
      document.getElementById('nextLevelXP').textContent = levelInfo.nextLevelXP;
      const progressPercent = (levelInfo.currentXP / levelInfo.nextLevelXP) * 100;
      document.getElementById('progressFill').style.width = `${progressPercent}%`;
      document.getElementById('xpToNext').textContent = `${levelInfo.nextLevelXP - levelInfo.currentXP} XP to next level!`;
      
      // Update today's progress (mock data for now)
      document.getElementById('todayProblems').textContent = p.todayProblems || 0;
      document.getElementById('todayXP').textContent = p.todayXP || 0;
      document.getElementById('todayTime').textContent = `${p.todayTime || 0} min`;
      
      // Update latest badges
      const badgesContainer = document.getElementById('latestBadges');
      if (p.badges && p.badges.length > 0) {
        badgesContainer.innerHTML = p.badges.slice(0, 3).map(badge => `
          <div class="badge-item">
            <span class="badge-icon">${getBadgeIcon(badge.name)}</span>
            <div>
              <strong>${badge.name} - ${getBadgeTitle(badge.name, badge.level)}</strong>
              <p>${getBadgeDescription(badge.name)}</p>
            </div>
          </div>
        `).join('');
      } else {
        badgesContainer.innerHTML = '<div class="no-badges">Complete problems to earn badges!</div>';
      }
      
      // Legacy support for other pages
      const statsEl = document.getElementById('dashboard-stats');
      if (statsEl) statsEl.innerHTML = `
        <div><strong>${p.username}</strong></div>
        <div>XP: ${p.xp} · Level: ${levelInfo.level}</div>
        <div>Hint Tokens: ${p.hintTokens}</div>
      `;
      const prof = document.getElementById('profile-data');
      if (prof) prof.innerHTML = `
        <div><strong>${p.username}</strong> (${p.email})</div>
        <div>Level ${levelInfo.level} · ${p.xp} XP</div>
        <div>Hint Tokens: ${p.hintTokens}</div>
      `;
      const badgesEl = document.getElementById('badge-list');
      if (badgesEl) {
        badgesEl.innerHTML = (p.badges || []).map(b => `<span class="badge">${b.name}: L${b.level}</span>`).join('');
      }
      
    } catch (_) {
      // Show default values for non-logged-in users
      const statsEl = document.getElementById('dashboard-stats');
      if (statsEl) statsEl.textContent = 'Please login to view stats.';
    }
  }

  // Helper functions for badge display
  function getBadgeIcon(badgeName) {
    const icons = {
      'Solver': '💪',
      'Speedster': '⚡',
      'Mastermind': '🧠',
      'Explorer': '🗺️',
      'Collector': '📚',
      'Strategist': '♟️',
      'Innovator': '💡',
      'Perfectionist': '🎯',
      'Contributor': '🤝',
      'Champion': '🏆'
    };
    return icons[badgeName] || '🏅';
  }

  function getBadgeTitle(badgeName, level) {
    const titles = {
      'Solver': ['Novice', 'Apprentice', 'Learner', 'Adept', 'Skilled', 'Proficient', 'Expert', 'Master', 'Grandmaster', 'Legend'],
      'Speedster': ['Swiftling', 'Quickster', 'Rapid', 'Brisk', 'Hasty', 'Agile', 'Nimble', 'Flash', 'Lightning', 'Warp'],
      'Mastermind': ['Initiate', 'Junior', 'Intermediate', 'Senior', 'Advanced', 'Specialist', 'Expert', 'Elite', 'Master', 'Genius'],
      'Explorer': ['Rookie', 'Explorer', 'Voyager', 'Pathfinder', 'Scout', 'Adventurer', 'Trailblazer', 'Navigator', 'Pioneer', 'Omniscient']
    };
    const levelTitles = titles[badgeName] || ['Level'];
    return levelTitles[Math.min(level - 1, levelTitles.length - 1)] || `Level ${level}`;
  }

  function getBadgeDescription(badgeName) {
    const descriptions = {
      'Solver': 'Master of problem solving',
      'Speedster': 'Lightning fast solutions',
      'Mastermind': 'Strategic thinking expert',
      'Explorer': 'Adventurous learner',
      'Collector': 'Knowledge gatherer',
      'Strategist': 'Tactical approach master',
      'Innovator': 'Creative problem solver',
      'Perfectionist': 'Accuracy champion',
      'Contributor': 'Community helper',
      'Champion': 'Ultimate achiever'
    };
    return descriptions[badgeName] || 'Special achievement unlocked';
  }

  function optionEl(value, text){ const o = document.createElement('option'); o.value = value; o.textContent = text || value; return o; }

  async function initSelectionPage() {
    if (!authFetch) return;
    requireAuth();
    const branchSel = document.getElementById('branch-select');
    const subSel = document.getElementById('subbranch-select');
    const diffSel = document.getElementById('difficulty');
    const loadBtn = document.getElementById('load-problems-btn');
    const list = document.getElementById('problems-list');
    if (!branchSel || !subSel || !diffSel || !loadBtn || !list) return;

    // Populate branches
    branches.forEach(b => branchSel.appendChild(optionEl(b)));

    async function loadSubbranches() {
      // Derive subbranches from all problems
      try {
        const res = await authFetch(`${API_BASE}/problems?limit=1000`);
        const data = await res.json();
        const map = new Map();
        (data.problems || []).forEach(p => {
          if (!map.has(p.branch)) map.set(p.branch, new Set());
          map.get(p.branch).add(p.subbranch);
        });
        subSel.innerHTML = '';
        const selectedBranches = Array.from(branchSel.selectedOptions).map(o => o.value);
        const subs = new Set();
        if (selectedBranches.length === 0) {
          map.forEach(set => set.forEach(s => subs.add(s)));
        } else {
          selectedBranches.forEach(b => (map.get(b) || []).forEach ? map.get(b).forEach(s => subs.add(s)) : null);
        }
        Array.from(subs).sort().forEach(s => subSel.appendChild(optionEl(s)));
      } catch (_) {}
    }

    branchSel.addEventListener('change', loadSubbranches);
    await loadSubbranches();

    loadBtn.addEventListener('click', async () => {
      const diff = diffSel.value;
      const branchesSel = Array.from(branchSel.selectedOptions).map(o => o.value).join(',');
      const subsSel = Array.from(subSel.selectedOptions).map(o => o.value).join(',');
      const url = `${API_BASE}/problems?difficulty=${encodeURIComponent(diff)}&branch=${encodeURIComponent(branchesSel)}&subbranch=${encodeURIComponent(subsSel)}`;
      const res = await authFetch(url);
      const data = await res.json();
      list.innerHTML = '';
      (data.problems || []).forEach(p => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${p.branch} › ${p.subbranch}</strong> — ${p.difficulty}<br/>${p.question}<br/><button class="btn" data-id="${p.id}">Open Workspace</button>`;
        list.appendChild(li);
        const btn = li.querySelector('button');
        btn.addEventListener('click', () => {
          window.location.href = `./problem_workspace.html?problemId=${encodeURIComponent(p.id)}`;
        });
      });
      if (!data.problems || data.problems.length === 0) {
        list.innerHTML = '<li>No problems found for the selected filters.</li>';
      }
    });
  }

  async function loadLeaderboardPreview() {
    if (!authFetch) return;
    try {
      const res = await authFetch(`${API_BASE}/leaderboard?limit=5`);
      const data = await res.json();
      const previewEl = document.getElementById('leaderboardPreview');
      
      if (data.leaderboard && data.leaderboard.length > 0) {
        previewEl.innerHTML = `
          <div class="leaderboard-list">
            ${data.leaderboard.map((user, index) => `
              <div class="leaderboard-item">
                <span class="rank">#${index + 1}</span>
                <span class="username">${user.username}</span>
                <span class="level">Level ${user.level}</span>
                <span class="xp">${user.xp.toLocaleString()} XP</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        previewEl.innerHTML = '<div class="loading">No leaderboard data available</div>';
      }
    } catch (error) {
      const previewEl = document.getElementById('leaderboardPreview');
      if (previewEl) previewEl.innerHTML = '<div class="loading">Unable to load leaderboard</div>';
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadLeaderboardPreview();
    const onSelection = document.getElementById('load-problems-btn');
    if (onSelection) initSelectionPage();
  });
})();
