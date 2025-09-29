const express = require('express');
const jwt = require('jsonwebtoken');
let redisClient = null;
try {
  const { createClient } = require('redis');
  if (process.env.REDIS_URL) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.warn('Redis error:', err.message));
    redisClient.connect().catch(e => console.warn('Redis connect error:', e.message));
  }
} catch (_) {
  // redis not installed, ignore for placeholder
}

const router = express.Router();

const memoryCache = new Map();
const CACHE_TTL_MS = 30_000; // 30s
const JWT_SECRET = process.env.JWT_SECRET || 'brainvault_secret_key';

async function getCache(key) {
  const now = Date.now();
  if (memoryCache.has(key)) {
    const { value, ts } = memoryCache.get(key);
    if (now - ts < CACHE_TTL_MS) return value;
  }
  if (redisClient) {
    try {
      const v = await redisClient.get(key);
      if (v) return JSON.parse(v);
    } catch (_) {}
  }
  return null;
}

async function setCache(key, value) {
  memoryCache.set(key, { value, ts: Date.now() });
  if (redisClient) {
    try { await redisClient.setEx(key, CACHE_TTL_MS / 1000, JSON.stringify(value)); } catch (_) {}
  }
}

function generateLeaderboard(branch, limit = 1000) {
  const list = [];
  for (let i = 1; i <= limit; i++) {
    list.push({ username: `user${i}`, xp: Math.max(0, 2000 - i*2), level: Math.max(1, Math.floor((2000 - i*2)/100)+1), branch, rank: i });
  }
  return list;
}

router.get('/', async (req, res) => {
  const { branch = 'Global', limit = '1000' } = req.query;
  const lim = Math.min(1000, Math.max(1, parseInt(limit, 10) || 1000));
  const key = `leaderboard:${branch}:${lim}`;
  let data = await getCache(key);
  if (!data) {
    data = generateLeaderboard(branch, lim);
    await setCache(key, data);
  }
  let yourRank = null;
  let you = null;
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      you = { username: decoded.username || decoded.email || 'you', xp: 1234, level: 12, branch, rank: Math.min(lim + 123, 9999) };
      yourRank = you.rank;
    }
  } catch (_) {}

  res.set('Cache-Control', 'public, max-age=30');
  res.json({ leaderboard: data, yourRank, you });
});

module.exports = router;
