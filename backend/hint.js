const express = require('express');

const router = express.Router();

// In-memory token store keyed by user id (placeholder)
const TOKENS = new Map();
const DEFAULT_FREE_TOKENS = 10;

function getUserId(req) {
  return (req.user && req.user.id) || null;
}

function ensureUser(userId) {
  if (!TOKENS.has(userId)) TOKENS.set(userId, { tokens: DEFAULT_FREE_TOKENS, lastRefill: new Date().toISOString() });
  return TOKENS.get(userId);
}

router.get('/balance', (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const state = ensureUser(uid);
  res.json({ tokens: state.tokens, lastRefill: state.lastRefill });
});

router.post('/use', (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const state = ensureUser(uid);
  if (state.tokens <= 0) return res.status(402).json({ error: 'No hint tokens left' });
  state.tokens -= 1;
  res.json({ success: true, tokens: state.tokens });
});

router.post('/purchase', (req, res) => {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Unauthorized' });
  const { tokens = 5 } = req.body || {};
  const n = Math.max(1, parseInt(tokens, 10));
  const state = ensureUser(uid);
  state.tokens += n;
  res.json({ success: true, tokens: state.tokens });
});

module.exports = router;
