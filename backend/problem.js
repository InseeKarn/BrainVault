const express = require('express');
const path = require('path');
const fs = require('fs');
const { verifySolution } = require('./utils/validation');
const { staticProblemService } = require('./static_problem_service');

const router = express.Router();

// Initialize static problem service
staticProblemService.initialize().catch(console.error);

// Difficulty XP table
const DIFF_XP = { Easy: 10, Medium: 25, Hard: 50, Expert: 100 };

// GET /api/problems - list/filter with enhanced options
router.get('/', (req, res) => {
  try {
    if (!staticProblemService.isReady()) {
      return res.status(503).json({ error: 'Problem service not ready' });
    }

    const {
      difficulty,
      branch,
      subbranch,
      limit = '50',
      offset = '0',
      randomize = 'false'
    } = req.query;

    // Optional auth to enforce Expert gating
    let plan = 'free';
    try {
      const jwt = require('jsonwebtoken');
      const state = require('./state');
      const JWT_SECRET = process.env.JWT_SECRET || 'brainvault_secret_key';
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        plan = state.userPlans.get(decoded.id) || 'free';
      }
    } catch (_) {}

    // Normalize difficulty: treat 'All' and 'All Levels' as no filter
    let normalizedDifficulty = difficulty;
    if (normalizedDifficulty && /^(all|all levels)$/i.test(String(normalizedDifficulty))) {
      normalizedDifficulty = null;
    }

    // Enforce Expert access only for pro/ultra
    if (normalizedDifficulty && /^expert$/i.test(String(normalizedDifficulty)) && !['pro','ultra'].includes(plan)) {
      return res.status(402).json({ error: 'Expert difficulty requires subscription (Pro or Ultra)' });
    }

    // Map display branch names (CSV) to internal keys (lowercase with underscores)
    let branchList = null;
    if (branch && String(branch).trim().length) {
      branchList = String(branch).split(',').map(s => s.trim()).filter(Boolean)
        .map(name => name.toLowerCase().replace(/\s+/g,'_'));
    }

    const options = {
      branch: null,
      branchList,
      difficulty: normalizedDifficulty || null,
      subbranch: subbranch || null,
      limit: Math.max(1, Math.min(100, parseInt(limit, 10))), // Max 100 per request
      offset: Math.max(0, parseInt(offset, 10)),
      randomize: randomize === 'true'
    };

    const result = staticProblemService.getProblems(options);
    res.json(result);

  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// GET /api/problems/random - get random problems
router.get('/random', (req, res) => {
  try {
    if (!staticProblemService.isReady()) {
      return res.status(503).json({ error: 'Problem service not ready' });
    }

    const {
      count = '5',
      difficulty,
      branch
    } = req.query;

    const result = staticProblemService.getRandomProblems(
      Math.min(20, parseInt(count, 10)), // Max 20 random problems
      { difficulty, branch }
    );

    res.json(result);

  } catch (error) {
    console.error('Error fetching random problems:', error);
    res.status(500).json({ error: 'Failed to fetch random problems' });
  }
});

// GET /api/problems/session - get practice session
router.get('/session', (req, res) => {
  try {
    if (!staticProblemService.isReady()) {
      return res.status(503).json({ error: 'Problem service not ready' });
    }

    const {
      branch,
      difficulty = 'medium',
      count = '10',
      focusAreas
    } = req.query;

    const options = {
      branch,
      difficulty,
      count: Math.min(20, parseInt(count, 10)),
      focusAreas: focusAreas ? focusAreas.split(',') : []
    };

    const result = staticProblemService.getPracticeSession(options);
    res.json(result);

  } catch (error) {
    console.error('Error creating practice session:', error);
    res.status(500).json({ error: 'Failed to create practice session' });
  }
});

// GET /api/problems/stats - get service statistics
router.get('/stats', (req, res) => {
  try {
    const stats = staticProblemService.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/problems/branches/:branch/subbranches - get subbranches for a branch
router.get('/branches/:branch/subbranches', (req, res) => {
  try {
    if (!staticProblemService.isReady()) {
      return res.status(503).json({ error: 'Problem service not ready' });
    }

    const { branch } = req.params;
    const subbranches = staticProblemService.getSubbranches(branch);
    
    res.json({ branch, subbranches });

  } catch (error) {
    console.error('Error fetching subbranches:', error);
    res.status(500).json({ error: 'Failed to fetch subbranches' });
  }
});

// GET /api/problems/:id - get single problem
router.get('/:id', (req, res) => {
  try {
    if (!staticProblemService.isReady()) {
      return res.status(503).json({ error: 'Problem service not ready' });
    }

    const problem = staticProblemService.getProblemById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    res.json({ problem });

  } catch (error) {
    console.error('Error fetching problem:', error);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// POST /api/problems/submit - verify a solution
// Body: { problemId, steps: [{ formula, variables, result }...], finalAnswer: { value } }
router.post('/submit', (req, res) => {
  try {
    if (!staticProblemService.isReady()) {
      return res.status(503).json({ error: 'Problem service not ready' });
    }

    const { problemId, steps = [], finalAnswer = null } = req.body || {};
    const problem = staticProblemService.getProblemById(problemId);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    const { correct, issues, computed, finalCheck } = verifySolution({ steps, finalAnswer }, problem);

    const xpAward = correct ? (problem.xp_reward || DIFF_XP[problem.difficulty] || 0) : 0;
    
    // Enhanced response with problem metadata
    res.json({ 
      correct, 
      xpAward, 
      issues, 
      finalCheck, 
      computed,
      problem: {
        id: problem.id,
        branch: problem.branch,
        difficulty: problem.difficulty,
        xp_reward: problem.xp_reward
      }
    });

  } catch (error) {
    console.error('Error verifying solution:', error);
    res.status(500).json({ error: 'Failed to verify solution' });
  }
});

module.exports = router;
