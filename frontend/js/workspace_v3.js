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

  function renderFormulaPanel() {
    const el = document.getElementById('formula-bank');
    if (!el) return;
    // Compose-only panel (Docs moved to Navbar)
    el.innerHTML = `
      <div>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
          <input id="compose-input" placeholder="Type your formula, e.g., v = u + a*t" list="formula-suggestions" style="flex:1; padding:8px; background:#0b1222; border:1px solid #334155; border-radius:8px; color:var(--text);" />
          <button class="btn comic" id="compose-add">New Step</button>
        </div>
        <datalist id="formula-suggestions">
          ${formulaBank.map(f => `<option value="${f}"></option>`).join('')}
          <option value="a = (v - u)/t"></option>
          <option value="s = u*t + 0.5*a*t^2"></option>
          <option value="I = V/R"></option>
          <option value="P = V*I"></option>
        </datalist>
      </div>
    `;
    el.querySelector('#compose-add').addEventListener('click', () => {
      const v = el.querySelector('#compose-input').value.trim();
      addStep(v);
    });
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

  function updateSolveForChoices(stepEl) {
    const formulaInput = stepEl.querySelector('.formula-input');
    const sel = stepEl.querySelector('.solve-for');
    if (!sel || !formulaInput) return;
    const current = sel.value;
    const names = extractIdentifiers(formulaInput.value);
    sel.innerHTML = `<option value="">-- none --</option>` + names.map(n => `<option value="${n}">${n}</option>`).join('');
    if (current && names.includes(current)) sel.value = current;
  }

  function applySolveForState(stepEl) {
    const unknown = (stepEl.querySelector('.solve-for')?.value) || '';
    stepEl.querySelectorAll('.var-input').forEach(inp => {
      if (unknown && inp.dataset.name === unknown) {
        inp.disabled = true;
        inp.placeholder = 'solved by equation';
        inp.value = '';
        inp.style.opacity = '0.6';
      } else {
        inp.disabled = false;
        inp.style.opacity = '1';
      }
    });
  }

  function parseTokens(expr){
    const tokens=[]; let i=0;
    const isDigit=c=>/\d/.test(c);
    const isAlpha=c=>/[A-Za-z_]/.test(c);
    while(i<expr.length){
      const c=expr[i];
      if(/\s/.test(c)){ i++; continue; }
      if('()+-*/'.includes(c)){ tokens.push({type:'op',value:c}); i++; continue; }
      if(isDigit(c) || (c==='.' && isDigit(expr[i+1]))){
        let s=i; i++; while(i<expr.length && /[0-9.]/.test(expr[i])) i++; tokens.push({type:'num',value:expr.slice(s,i)}); continue;
      }
      if(isAlpha(c)){
        let s=i; i++; while(i<expr.length && /[A-Za-z0-9_]/.test(expr[i])) i++; tokens.push({type:'id',value:expr.slice(s,i)}); continue;
      }
      i++;
    }
    return tokens;
  }
  function parseExpr(expr){
    const prec={'+':1,'-':1,'*':2,'/':2};
    const output=[]; const ops=[]; const tokens=parseTokens(expr);
    for(const t of tokens){
      if(t.type==='num'||t.type==='id'){ output.push({type:t.type==='num'?'num':'var', value:t.value}); }
      else if(t.type==='op'){
        if(t.value==='('){ ops.push(t.value); }
        else if(t.value===')'){
          while(ops.length && ops[ops.length-1]!== '('){ const op=ops.pop(); const b=output.pop(), a=output.pop(); output.push({type:'op',op, left:a, right:b}); }
          if(ops.length) ops.pop();
        } else {
          const o1=t.value; const precTop=() => (ops.length && ops[ops.length-1]!== '(') ? (ops[ops.length-1]) : null;
          while(precTop() && ( (o1==='+'||o1==='-'||o1==='*'||o1==='/') && ( (o1==='+'||o1==='-') ? (prec[precTop()]>=prec[o1]) : (prec[precTop()]>=prec[o1]) ) )){
            const op=ops.pop(); const b=output.pop(), a=output.pop(); output.push({type:'op',op, left:a, right:b});
          }
          ops.push(o1);
        }
      }
    }
    while(ops.length){ const op=ops.pop(); const b=output.pop(), a=output.pop(); output.push({type:'op',op, left:a, right:b}); }
    return output[0]||{type:'num',value:'0'};
  }
  function stringifyAST(n){
    if(!n) return '0'; if(n.type==='num') return n.value; if(n.type==='var') return n.value;
    const a=stringifyAST(n.left), b=stringifyAST(n.right);
    if(n.op==='+'||n.op==='-') return `(${a} ${n.op} ${b})`;
    if(n.op==='*') return `(${a}*${b})`;
    if(n.op=== '/') return `(${a}/${b})`;
    return `(${a}${n.op}${b})`;
  }
  function containsVarAST(n, target){
    if(!n) return false; if(n.type==='var') return n.value===target; if(n.type!=='op') return false; return containsVarAST(n.left,target)||containsVarAST(n.right,target);
  }
  function isolateLinear(lhs, rhs, target){
    function step(L,R){
      if(L.type==='var' && L.value===target) return {L,R,ok:true};
      if(L.type!=='op') return {ok:false};
      const A=L.left, B=L.right;
      if(L.op==='+'){
        if(containsVarAST(A,target)&&!containsVarAST(B,target)) return step(A,{type:'op',op:'-',left:R,right:B});
        if(containsVarAST(B,target)&&!containsVarAST(A,target)) return step(B,{type:'op',op:'-',left:R,right:A});
        return {ok:false};
      }
      if(L.op==='-'){
        if(containsVarAST(A,target)&&!containsVarAST(B,target)) return step(A,{type:'op',op:'+',left:R,right:B});
        if(containsVarAST(B,target)&&!containsVarAST(A,target)) return step(B,{type:'op',op:'-',left:A,right:R});
        return {ok:false};
      }
      if(L.op==='*'){
        if(containsVarAST(A,target)&&!containsVarAST(B,target)) return step(A,{type:'op',op:'/',left:R,right:B});
        if(containsVarAST(B,target)&&!containsVarAST(A,target)) return step(B,{type:'op',op:'/',left:R,right:A});
        return {ok:false};
      }
      if(L.op==='/'){
        if(containsVarAST(A,target)&&!containsVarAST(B,target)) return step(A,{type:'op',op:'*',left:R,right:B});
        if(containsVarAST(B,target)&&!containsVarAST(A,target)) return step(B,{type:'op',op:'/',left:A,right:R});
        return {ok:false};
      }
      return {ok:false};
    }
    return step(lhs,rhs);
  }
  function autoRearrange(stepEl){
    const formulaInput=stepEl.querySelector('.formula-input');
    const target = (stepEl.querySelector('.solve-for')?.value)||'';
    if(!target) return;
    const f = formulaInput.value.trim();
    if(!f.includes('=')) return;
    const [lhsS, rhsS] = f.split('=').map(s=>s.trim());
    let lhs=parseExpr(lhsS), rhs=parseExpr(rhsS);
    if(!containsVarAST(lhs,target) && containsVarAST(rhs,target)){
      const tmp=lhs; lhs=rhs; rhs=tmp;
    }
    const res=isolateLinear(lhs,rhs,target);
    if(res && res.ok){
      const rightExpr = stringifyAST(res.R);
      const unwrapped = rightExpr.startsWith('(') && rightExpr.endsWith(')') ? rightExpr.slice(1,-1) : rightExpr;
      const newFormula = `${target} = ${unwrapped}`;
      formulaInput.value = newFormula;
      renderVariablesForStep(stepEl);
    }
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
    const givenKeys = Object.keys((window.currentProblem && window.currentProblem.given) || {});
    varsWrap.innerHTML = names.map(n => {
      const val = existingValues.get(n) || '';
      const isGiven = givenKeys.includes(n);
      const codeCls = `code-var${isGiven ? ' given' : ''}`;
      const inputCls = `var-input${isGiven ? ' given' : ''}`;
      return (
        `<div style=\"display:flex; gap:8px; align-items:center; margin-bottom:6px;\">` +
        `<code class=\"${codeCls}\" style=\"min-width:60px; display:inline-block; text-align:right;\">${n}</code>` +
        `<input type=\"number\" step=\"any\" class=\"${inputCls}\" data-name=\"${n}\" placeholder=\"value\" value=\"${val}\" />` +
        `</div>`
      );
    }).join('');
    updateSolveForChoices(stepEl);
    applySolveForState(stepEl);
  }

  async function computeStep(stepEl) {
    const formula = stepEl.querySelector('.formula-input').value.trim();
    const resultInput = stepEl.querySelector('.result-input');
    const vars = {};
    stepEl.querySelectorAll('.var-input').forEach(inp => {
      if (inp.disabled) return;
      const name = inp.dataset.name;
      if (inp.value !== '') vars[name] = Number(inp.value);
    });
    try {
      const res = await (window.BrainVaultAuth?.authFetch)(`${API_BASE}/problems/submit`, {
        method: 'POST',
        body: JSON.stringify({ problemId: window.currentProblem?.id, steps: [{ formula, variables: vars }], finalAnswer: null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Compute failed');
      const c = (data.computed && data.computed[0]) || {};
      const val = (c.exprVal !== null && c.exprVal !== undefined) ? c.exprVal
                : (c.rhsVal !== null && c.rhsVal !== undefined) ? c.rhsVal
                : (c.lhsVal !== null && c.lhsVal !== undefined) ? c.lhsVal
                : null;
      if (val === null) throw new Error('Unable to compute value from this step');
      resultInput.value = String(val);
    } catch (e) {
      alert(e.message);
    }
  }

  function addStep(prefill = '') {
    const container = document.getElementById('steps-container');
    const div = document.createElement('div');
    div.className = 'step';
    div.innerHTML = `
      <label>Formula</label>
      <input type="text" class="formula-input" placeholder="e.g., (v - u)/t or v = u + a*t" value="${prefill}" />
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
        <div style="display:flex; gap:8px; align-items:center;">
          <label>Solve for (optional)</label>
          <select class="solve-for"><option value="">-- none --</option></select>
          <button type="button" class="btn secondary compute-step">Compute</button>
        </div>
        <button type="button" class="btn danger delete-step">Delete Step</button>
        <span class="small">Tip: Variables are auto-detected from the formula. Use ^ for exponent.</span>
      </div>
    `;
    container.appendChild(div);
    renderVariablesForStep(div);
    const fInp = div.querySelector('.formula-input');
    fInp.addEventListener('input', () => renderVariablesForStep(div));
    const solveSel = div.querySelector('.solve-for');
    solveSel.addEventListener('change', () => { applySolveForState(div); autoRearrange(div); });
    div.querySelector('.compute-step').addEventListener('click', () => computeStep(div));
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
    renderFormulaPanel();
    loadProblem();
    document.getElementById('add-step-btn').addEventListener('click', () => addStep());
    document.getElementById('use-hint-btn').addEventListener('click', useHint);
  });
})();
