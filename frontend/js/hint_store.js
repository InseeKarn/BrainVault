(function(){
  const { authFetch, requireAuth, API_BASE } = window.BrainVaultAuth || {};
  requireAuth();
  async function refresh() {
    const el = document.getElementById('hint-balance');
    const res = await authFetch(`${API_BASE}/hints/balance`);
    const data = await res.json();
    if (!res.ok) { el.textContent = data.error || 'Failed to fetch balance'; return; }
    el.textContent = `Tokens available: ${data.tokens}`;
  }
  async function purchase() {
    const n = Number(document.getElementById('purchase-count').value || 1);
    const btn = document.getElementById('purchase-btn');
    const status = document.getElementById('hint-status');
    btn.disabled = true; status.textContent = 'Redirecting to checkout...';
    try {
      const res = await authFetch(`${API_BASE}/billing/create-checkout-session`, { method: 'POST', body: JSON.stringify({ type: 'hints', id: n >= 100 ? 'pack_100' : n >= 30 ? 'pack_30' : 'pack_10', quantity: 1 }) });
      const data = await res.json();
      if (!res.ok || !data.checkout_url) throw new Error(data.error || 'Failed to start checkout');
      window.location.href = data.checkout_url;
    } catch (e) {
      status.textContent = e.message;
      btn.disabled = false;
    }
  }
  async function subscribe(planId) {
    const btnStatus = document.getElementById('hint-status');
    btnStatus.textContent = 'Opening checkout...';
    try {
      const res = await authFetch(`${API_BASE}/billing/create-checkout-session`, { method: 'POST', body: JSON.stringify({ type: 'subscription', id: planId }) });
      const data = await res.json();
      if (!res.ok || !data.checkout_url) throw new Error(data.error || 'Failed to start checkout');
      window.location.href = data.checkout_url;
    } catch (e) {
      btnStatus.textContent = e.message;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('purchase-btn').addEventListener('click', purchase);
    const proBtn = document.getElementById('pro-plan-btn');
    const ultraBtn = document.getElementById('ultra-plan-btn');
    if (proBtn) proBtn.addEventListener('click', () => subscribe('plan_pro'));
    if (ultraBtn) ultraBtn.addEventListener('click', () => subscribe('plan_ultra'));
    refresh();
  });
})();
