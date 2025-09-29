const express = require('express');
const { getDetailedFeedback } = require('./utils/validation');

const router = express.Router();

// POST /api/feedback - produce detailed feedback for a submission
// Body: { problem, steps, finalAnswer }
router.post('/', (req, res) => {
  const { problem, steps = [], finalAnswer = null } = req.body || {};
  if (!problem) return res.status(400).json({ error: 'problem object required' });
  const details = getDetailedFeedback({ steps, finalAnswer }, problem);
  res.json({ feedback: details });
});

module.exports = router;
