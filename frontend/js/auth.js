// BrainVault Auth Utils
const API_BASE = '/api';

function getToken() { return localStorage.getItem('bv_token'); }
function setToken(t) { localStorage.setItem('bv_token', t); }
function clearToken() { localStorage.removeItem('bv_token'); }

async function authFetch(url, opts = {}) {
  const token = getToken();
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...opts, headers });
  return res;
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = './login.html';
  }
}

function showAuthLinks() {
  const el = document.getElementById('auth-links');
  if (!el) return;
  if (getToken()) {
    el.innerHTML = '<a href="#" id="logout-link">Logout</a>';
    const l = document.getElementById('logout-link');
    if (l) l.addEventListener('click', (e) => { e.preventDefault(); clearToken(); window.location.reload(); });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  showAuthLinks();
  // Login page
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const status = document.getElementById('login-status');
      status.textContent = 'Signing in...';
      try {
        const res = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        setToken(data.token);
        status.textContent = 'Success! Redirecting...';
        window.location.href = './index.html';
      } catch (err) {
        status.textContent = err.message;
      }
    });
  }

  // Register page
  const regForm = document.getElementById('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const status = document.getElementById('register-status');
      status.textContent = 'Creating account...';
      try {
        const res = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        setToken(data.token);
        status.textContent = 'Success! Redirecting...';
        window.location.href = './index.html';
      } catch (err) {
        status.textContent = err.message;
      }
    });
  }
});

window.BrainVaultAuth = { API_BASE, getToken, setToken, clearToken, authFetch, requireAuth };
