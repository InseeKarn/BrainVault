const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// In-memory user store for placeholder
// In production, replace with a database
const users = new Map(); // id -> user
const usersByEmail = new Map(); // email -> id

const JWT_SECRET = process.env.JWT_SECRET || 'brainvault_secret_key';

// Badge templates (10 levels each)
const BADGE_TEMPLATES = {
  Solver: 0,
  Speedster: 0,
  Mastermind: 0,
  Explorer: 0,
  Collector: 0,
  Strategist: 0,
  Innovator: 0,
  Perfectionist: 0,
  Contributor: 0,
  Champion: 0,
};

const defaultBadges = () => (
  Object.keys(BADGE_TEMPLATES).map(name => ({ name, level: 0, progress: 0 }))
);

// Helpers
function sanitizeUser(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

function tokenForUser(user) {
  return jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email, and password are required' });
    }
    const emailKey = String(email).trim().toLowerCase();
    if (usersByEmail.has(emailKey)) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      username: String(username).trim(),
      email: emailKey,
      passwordHash,
      avatar: null,
      xp: 0,
      level: 1,
      hintTokens: 10,
      plan: 'free',
      history: [],
      badges: defaultBadges(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.set(user.id, user);
    usersByEmail.set(emailKey, user.id);

    const token = tokenForUser(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (email/password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const emailKey = String(email).trim().toLowerCase();
    const userId = usersByEmail.get(emailKey);
    if (!userId) return res.status(401).json({ error: 'Invalid credentials' });
    const user = users.get(userId);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = tokenForUser(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// OAuth placeholders
router.get('/google', (req, res) => {
  res.status(501).json({ error: 'Google OAuth not implemented in placeholder' });
});
router.get('/github', (req, res) => {
  res.status(501).json({ error: 'GitHub OAuth not implemented in placeholder' });
});

// Export router and user store for other modules
module.exports = router;
