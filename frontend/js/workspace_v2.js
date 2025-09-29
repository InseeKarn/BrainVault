(function(){
  const { authFetch, requireAuth, API_BASE } = window.BrainVaultAuth || {};
  requireAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const problemId = urlParams.get('problemId');
  let currentProblem = null;
  window.currentProblem = null;

  const formulaBank = [
    'v = u + a*t',
    's = u*t + 0.5*a*t^2',
    'F = m*a',
    'P = V*I',
    'E = m*c^2',
    'p = m*v',
    'Q = m*c*ΔT'
  ];

  function renderFormulaBank() {
    const el = document.getElementById('formula-bank');
    if (!el) return;
    el.innerHTML = formulaBank
      .map(f => `<button class="btn secondary" data-formula="${f}">${f}</button>`)
      .join(' ');
    el.querySelectorAll('button').forEach(btn =>
      btn.addEventListener('click', () => addStep(btn.dataset.formula))
    );
  }

  function extractIdentifiers(formula) {
    const ids = new Set();
    const re = /\b[A-Za-z_][A-Za-z0-9_]*\b/g;
    const reserved = new Set(['pi','PI','e','E','sqrt','sin','cos','tan','log','ln','exp']);
    const f = String(formula || '');
    let m;
    while ((m = re.exec(f)) !== null) {
      const name = m[0];
      if (!reserved.has(name)) ids.add(name);
    }
    return Array.from(ids);
  }

  function renderVariablesForStep(stepEl) {
    const formulaInput = stepEl.querySelector('.formula-input');
    const varsWrap = stepEl.querySelector('.variables-fields');
    if (!formulaInput || !varsWrap) return;
    const existingValues = new Map();
    varsWrap.querySelectorAll('.var-input').forEach(inp => {
      existingValues.set(inp.dataset.name, inp.value);
    });
    const names = extractIdentifiers(formulaInput.value);
    varsWrap.innerHTML = names.map(n => {
      const val = existingValues.get(n) || '';
      return (
        `<div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">` +
        `<code style="min-width:60px; display:inline-block; text-align:right;">${n}</code>` +
        `<input type="number" step="any" class="var-input" data-name="${n}" placeholder="value" value="${val}" />` +
        `</div>`
      );
    }).join('');
  }

  function addStep(prefill = '') {
    const container = document.getElementById('steps-container');
    const div = document.createElement('div');
    div.className = 'step';
    div.innerHTML = `
      <label>Formula</label>
      <input type="text" class="formula-input" placeholder="e.g., (v - u)/t" value="${prefill}" />
      <div class="grid cols-2" style="margin-top:8px;">
        <div>
          <label>Variables</label>
          <div class="variables-fields"></div>
        </div>
        <div>
          <label>Result (optional)</label>
          <input type="number" class="result-input" step="any" />
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
        <button type="button" class="btn danger delete-step">Delete Step</button>
        <span class="small">Tip: Variables are auto-detected from the formula. Use ^ for exponent.</span>
      </div>
    `;
    container.appendChild(div);
    renderVariablesForStep(div);
    div.querySelector('.formula-input').addEventListener('input', () => renderVariablesForStep(div));
    div.querySelector('.delete-step').addEventListener('click', () => div.remove());
  }

  async function loadProblem() {
    if (!problemId) {
      document.getElementById('problem-text').textContent = 'No problem selected.';
      return;
    }
    try {
      const res = await authFetch(`${API_BASE}/problems/${encodeURIComponent(problemId)}`);
      const data = await res.json();
      currentProblem = data.problem;
      window.currentProblem = currentProblem;
      document.getElementById('problem-title').textContent = `${currentProblem.branch} › ${currentProblem.subbranch} — ${currentProblem.difficulty}`;
      document.getElementById('problem-text').textContent = currentProblem.question;
      const given = currentProblem.given || {};
      document.getElementById('problem-given').textContent = 'Given: ' + JSON.stringify(given);
    } catch (err) {
      document.getElementById('problem-text').textContent = 'Failed to load problem.';
    }
  }

  async function useHint() {
    const btn = document.getElementById('use-hint-btn');
    btn.disabled = true;
    try {
      const res = await authFetch(`${API_BASE}/hints/use`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to use hint');
      alert(`Hint token used. Remaining: ${data.tokens}`);
    } catch (e) {
      alert(e.message);
    } finally {
      btn.disabled = false;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    renderFormulaBank();
    loadProblem();
    document.getElementById('add-step-btn').addEventListener('click', () => addStep());
    document.getElementById('use-hint-btn').addEventListener('click', useHint);
  });
})();
