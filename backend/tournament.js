const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const state = require('./state');
const { staticProblemService } = require('./static_problem_service');

const JWT_SECRET = process.env.JWT_SECRET || 'brainvault_secret_key';

// In-memory tournaments store
const tournaments = new Map(); // id -> { id, createdAt, status, players: [{id, username, score, finished, answers: {} }], problems: [], difficulty, branch }

function requireAuth(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_) {
    return null;
  }
}

function ensurePro(decoded) {
  const plan = state.userPlans.get(decoded.id) || 'free';
  return plan === 'pro' || plan === 'ultra';
}

function pickProblems({ branch = null, difficulty = 'Medium', count = 10 }) {
  const result = staticProblemService.getProblems({ branch, difficulty, limit: 1000, randomize: true });
  const items = result.problems.slice(0, count);
  return items;
}

function computeScore(problem, submittedValue) {
  try {
    const correctVal = Number(problem.answer?.value);
    const val = Number(submittedValue);
    if (!isFinite(correctVal) || !isFinite(val)) return 0;
    const tol = Math.max(1e-6, Math.abs(0.02 * correctVal)); // 2% tolerance
    return Math.abs(val - correctVal) <= tol ? 1 : 0;
  } catch (_) { return 0; }
}

// POST /api/tournament/create { branch?, difficulty? }
router.post('/create', (req, res) => {
  if (!staticProblemService.isReady()) return res.status(503).json({ error: 'Problem service not ready' });
  const decoded = requireAuth(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  if (!ensurePro(decoded)) return res.status(402).json({ error: 'Tournament requires subscription (Pro/Ultra)' });

  const { branch = null, difficulty = 'Medium' } = req.body || {};
  const id = `tm_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
  const problems = pickProblems({ branch, difficulty, count: 10 });
  const t = {
    id,
    createdAt: new Date().toISOString(),
    status: 'waiting',
    branch, difficulty,
    players: [{ id: decoded.id, username: decoded.username || decoded.email || 'player1', score: 0, finished: false, answers: {} }],
    problems: problems.map(p => ({ id: p.id, branch: p.branch, subbranch: p.subbranch, difficulty: p.difficulty, question: p.question, given: p.given, xp_reward: p.xp_reward }))
  };
  tournaments.set(id, t);
  res.json({ tournament: t });
});

// POST /api/tournament/:id/join
router.post('/:id/join', (req, res) => {
  if (!staticProblemService.isReady()) return res.status(503).json({ error: 'Problem service not ready' });
  const decoded = requireAuth(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  if (!ensurePro(decoded)) return res.status(402).json({ error: 'Tournament requires subscription (Pro/Ultra)' });
  const t = tournaments.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  if (t.players.find(p => p.id === decoded.id)) return res.json({ tournament: t });
  if (t.players.length >= 2) return res.status(409).json({ error: 'Tournament full' });
  t.players.push({ id: decoded.id, username: decoded.username || decoded.email || 'player2', score: 0, finished: false, answers: {} });
  t.status = 'ready';
  res.json({ tournament: t });
});

// POST /api/tournament/:id/start
router.post('/:id/start', (req, res) => {
  const decoded = requireAuth(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const t = tournaments.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  if (!t.players.find(p => p.id === decoded.id)) return res.status(403).json({ error: 'Not a participant' });
  if (t.players.length < 2) return res.status(409).json({ error: 'Waiting for opponent' });
  t.status = 'live';
  t.startedAt = new Date().toISOString();
  res.json({ tournament: t });
});

// GET /api/tournament/:id/status (requires auth)
router.get('/:id/status', (req, res) => {
  const decoded = requireAuth(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const t = tournaments.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  res.json({ tournament: t });
});

// GET /api/tournament/:id/spectate (public)
router.get('/:id/spectate', (req, res) => {
  const t = tournaments.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  // Return read-only view
  const view = { id: t.id, status: t.status, createdAt: t.createdAt, startedAt: t.startedAt, finishedAt: t.finishedAt,
    branch: t.branch, difficulty: t.difficulty, players: t.players.map(p => ({ username: p.username, score: p.score, finished: p.finished })), problems: t.problems };
  res.json({ tournament: view });
});

// POST /api/tournament/:id/submit { problemId, value }
router.post('/:id/submit', (req, res) => {
  const decoded = requireAuth(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const t = tournaments.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tournament not found' });
  const player = t.players.find(p => p.id === decoded.id);
  if (!player) return res.status(403).json({ error: 'Not a participant' });
  if (t.status !== 'live') return res.status(409).json({ error: 'Tournament not live' });

  const { problemId, value } = req.body || {};
  if (!problemId) return res.status(400).json({ error: 'problemId required' });
  if (player.answers[problemId] != null) return res.status(409).json({ error: 'Already answered' });

  // Fetch full problem to grade
  const full = staticProblemService.getProblemById(problemId);
  if (!full) return res.status(404).json({ error: 'Problem not found' });

  const score = computeScore(full, value);
  player.answers[problemId] = { value, score };
  player.score += score;

  // If all 10 answered, mark finished
  if (Object.keys(player.answers).length >= t.problems.length) {
    player.finished = true;
  }

  // If both finished, end tournament
  if (t.players.every(p => p.finished)) {
    t.status = 'finished';
    t.winner = t.players[0].score === t.players[1].score ? 'draw' : (t.players[0].score > t.players[1].score ? t.players[0].id : t.players[1].id);
    t.finishedAt = new Date().toISOString();
  }

  res.json({ tournament: t, yourScore: player.score });
});

module.exports = router;