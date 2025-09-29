(function(){
  const { authFetch, API_BASE } = window.BrainVaultAuth || {};

  function collectSteps() {
    const steps = [];
    document.querySelectorAll('#steps-container .step').forEach(div => {
      const formula = div.querySelector('.formula-input').value.trim();
      const resultVal = div.querySelector('.result-input').value;
      const variables = {};
      div.querySelectorAll('.var-input').forEach(inp => {
        const name = inp.dataset.name;
        const val = inp.value;
        if (name && val !== '') variables[name] = Number(val);
      });
      const step = { formula, variables };
      if (resultVal !== '') step.result = Number(resultVal);
      steps.push(step);
    });
    return steps;
  }

  async function submitSolution() {
    const problem = window.currentProblem;
    if (!problem) { alert('No problem loaded'); return; }
    const steps = collectSteps();
    const finalAnswerInput = document.getElementById('final-answer');
    const finalAnswer = finalAnswerInput.value !== '' ? { value: Number(finalAnswerInput.value) } : null;
    const payload = { problemId: problem.id, steps, finalAnswer };

    const btn = document.getElementById('submit-solution-btn');
    btn.disabled = true;
    const feedbackEl = document.getElementById('feedback-container');
    feedbackEl.innerHTML = 'Submitting...';
    try {
      const res = await authFetch(`${API_BASE}/problems/submit`, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      const status = data.correct ? '<span class="feedback ok">Correct ✔</span>' : '<span class="feedback error">Incorrect ✖</span>';
      let html = `${status}<br/>XP Award: ${data.xpAward || 0}`;
      if (data.issues && data.issues.length) {
        html += '<ul>' + data.issues.map(i => `<li>${i.stepIndex !== undefined ? `Step ${i.stepIndex+1}: ` : ''}${i.type} — ${i.message}</li>`).join('') + '</ul>';
      }
      feedbackEl.innerHTML = html;

      // Detailed feedback
      const fbRes = await authFetch(`${API_BASE}/feedback`, { method: 'POST', body: JSON.stringify({ problem, steps, finalAnswer }) });
      const fbData = await fbRes.json();
      if (fbData.feedback) {
        feedbackEl.innerHTML += '<h4>Detailed Feedback</h4><ul>' + fbData.feedback.map(f => `<li class="${f.status === 'ok' ? 'feedback ok' : (f.status === 'error' ? 'feedback error' : '')}">${f.stepIndex !== undefined ? `Step ${f.stepIndex+1}: ` : ''}${f.type ? f.type + ' — ' : ''}${f.message}</li>`).join('') + '</ul>';
      }
    } catch (e) {
      feedbackEl.textContent = e.message;
    } finally {
      btn.disabled = false;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('submit-solution-btn');
    if (btn) btn.addEventListener('click', submitSolution);
  });
})();
