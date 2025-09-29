const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const state = require('./state');

// Upload config
const uploadDir = path.join(__dirname, '../frontend/assets/uploads');
try { fs.mkdirSync(uploadDir, { recursive: true }); } catch(_) {}
const storage = multer.diskStorage({
  destination: function(req, file, cb){ cb(null, uploadDir); },
  filename: function(req, file, cb){
    const ext = path.extname(file.originalname).toLowerCase();
    const base = (req.user && req.user.id) ? req.user.id : 'user';
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp)$/i.test(file.mimetype)) return cb(null, true);
    return cb(new Error('Only image files are allowed'));
  }
});

// XP requirements for each level
function getXPForLevel(level) {
  return level * 100; // Progressive: Level 1 needs 100 XP, Level 2 needs 200 XP, etc.
}

function calculateLevel(xp) {
  let level = 1;
  let totalRequired = 0;
  while (totalRequired + getXPForLevel(level) <= xp) {
    totalRequired += getXPForLevel(level);
    level++;
  }
  return {
    level: level - 1,
    currentXP: xp - totalRequired,
    nextLevelXP: getXPForLevel(level),
    totalXP: xp
  };
}

// Comic Book Superhero Badge System with 10 levels each
const BADGE_SYSTEM = {
  'Solver': {
    titles: ['Rookie', 'Apprentice', 'Learner', 'Adept', 'Skilled', 'Proficient', 'Expert', 'Master', 'Grandmaster', 'Legend'],
    description: 'Master of problem solving',
    icon: '💪',
    color: '#dc2626'
  },
  'Speedster': {
    titles: ['Swiftling', 'Quickster', 'Rapid', 'Brisk', 'Hasty', 'Agile', 'Nimble', 'Flash', 'Lightning', 'Warp Speed'],
    description: 'Lightning fast solutions',
    icon: '⚡',
    color: '#f59e0b'
  },
  'Mastermind': {
    titles: ['Initiate', 'Junior', 'Intermediate', 'Senior', 'Advanced', 'Specialist', 'Expert', 'Elite', 'Master', 'Genius'],
    description: 'Strategic thinking expert',
    icon: '🧠',
    color: '#8b5cf6'
  },
  'Explorer': {
    titles: ['Rookie', 'Scout', 'Voyager', 'Pathfinder', 'Navigator', 'Adventurer', 'Trailblazer', 'Pioneer', 'Discoverer', 'Omniscient'],
    description: 'Adventurous learner across physics branches',
    icon: '🗺️',
    color: '#059669'
  },
  'Collector': {
    titles: ['Gatherer', 'Accumulator', 'Hoarder', 'Keeper', 'Curator', 'Archivist', 'Librarian', 'Scholar', 'Sage', 'Oracle'],
    description: 'Knowledge and formula collector',
    icon: '📚',
    color: '#3b82f6'
  },
  'Strategist': {
    titles: ['Planner', 'Tactician', 'Coordinator', 'Organizer', 'Director', 'Commander', 'General', 'Marshal', 'Warlord', 'Supreme Leader'],
    description: 'Tactical approach master',
    icon: '♟️',
    color: '#6b7280'
  },
  'Innovator': {
    titles: ['Thinker', 'Creator', 'Designer', 'Inventor', 'Pioneer', 'Visionary', 'Revolutionary', 'Genius', 'Mastermind', 'Legend'],
    description: 'Creative problem solver',
    icon: '💡',
    color: '#fbbf24'
  },
  'Perfectionist': {
    titles: ['Precise', 'Accurate', 'Meticulous', 'Thorough', 'Flawless', 'Immaculate', 'Perfect', 'Supreme', 'Ultimate', 'Divine'],
    description: 'Accuracy champion',
    icon: '🎯',
    color: '#ef4444'
  },
  'Contributor': {
    titles: ['Helper', 'Assistant', 'Supporter', 'Collaborator', 'Partner', 'Mentor', 'Guide', 'Leader', 'Champion', 'Hero'],
    description: 'Community helper and mentor',
    icon: '🤝',
    color: '#ec4899'
  },
  'Champion': {
    titles: ['Competitor', 'Contender', 'Fighter', 'Warrior', 'Victor', 'Conqueror', 'Hero', 'Legend', 'Immortal', 'Physics God'],
    description: 'Ultimate physics achiever',
    icon: '🏆',
    color: '#d97706'
  },
  // New Comic Book Themed Badges
  'Physics Warrior': {
    titles: ['Cadet', 'Soldier', 'Sergeant', 'Lieutenant', 'Captain', 'Major', 'Colonel', 'General', 'Commander', 'Supreme Warrior'],
    description: 'Battles through complex physics problems',
    icon: '⚔️',
    color: '#7c2d12'
  },
  'Formula Wizard': {
    titles: ['Apprentice', 'Novice', 'Student', 'Scholar', 'Sage', 'Mage', 'Wizard', 'Archmage', 'Master Wizard', 'Formula God'],
    description: 'Master of formula manipulation',
    icon: '🪄',
    color: '#7c3aed'
  },
  'Time Keeper': {
    titles: ['Punctual', 'Timely', 'Swift', 'Rapid', 'Quick', 'Fast', 'Speedy', 'Lightning', 'Time Master', 'Chronos'],
    description: 'Completes problems within time limits',
    icon: '⏰',
    color: '#0ea5e9'
  },
  'Hint Guardian': {
    titles: ['Saver', 'Conserve', 'Prudent', 'Wise', 'Smart', 'Clever', 'Genius', 'Brilliant', 'Master', 'Hint God'],
    description: 'Uses hints wisely and sparingly',
    icon: '💮',
    color: '#059669'
  },
  'Comeback King': {
    titles: ['Persistent', 'Determined', 'Resilient', 'Tough', 'Strong', 'Mighty', 'Powerful', 'Unstoppable', 'Invincible', 'Phoenix'],
    description: 'Never gives up, learns from mistakes',
    icon: '🔥',
    color: '#dc2626'
  },
  'Branch Master': {
    titles: ['Focused', 'Specialized', 'Expert', 'Authority', 'Professional', 'Master', 'Grandmaster', 'Legend', 'Ultimate', 'Branch God'],
    description: 'Dominates a specific physics branch',
    icon: '🌳',
    color: '#16a34a'
  },
  'Streak Survivor': {
    titles: ['Lucky', 'Consistent', 'Stable', 'Steady', 'Reliable', 'Dependable', 'Unshakeable', 'Rock Solid', 'Unstoppable', 'Eternal'],
    description: 'Maintains problem-solving streaks',
    icon: '🔥',
    color: '#ea580c'
  },
  'Knowledge Seeker': {
    titles: ['Curious', 'Inquisitive', 'Student', 'Learner', 'Scholar', 'Researcher', 'Scientist', 'Professor', 'Genius', 'Omniscient'],
    description: 'Always hungry for more physics knowledge',
    icon: '🔍',
    color: '#0d9488'
  },
  'Error Slayer': {
    titles: ['Careful', 'Precise', 'Accurate', 'Sharp', 'Perfect', 'Flawless', 'Impeccable', 'Supreme', 'Ultimate', 'Error Destroyer'],
    description: 'Minimizes calculation errors',
    icon: '⚙️',
    color: '#be185d'
  },
  'Physics Avenger': {
    titles: ['Rookie', 'Hero', 'Super Hero', 'Champion', 'Defender', 'Guardian', 'Protector', 'Avenger', 'Ultimate Hero', 'Physics God'],
    description: 'Protects the universe of physics knowledge',
    icon: '🦾',
    color: '#1e40af'
  }
};

// Calculate XP bonus based on badge levels
function calculateXPBonus(badges) {
  let bonus = 0;
  badges.forEach(badge => {
    bonus += badge.level * 0.05; // 5% bonus per badge level
  });
  return Math.min(bonus, 2.0); // Cap at 200% bonus
}

// Get current user profile (derived from JWT claims; placeholder values for stats)
router.get('/me', (req, res) => {
  const { id, email, username } = req.user || {};
  if (!id) return res.status(401).json({ error: 'Unauthorized' });
  
  // Mock user data - in a real app, this would come from database
  const xp = 2350; // Sample XP for demo
  const levelInfo = calculateLevel(xp);
  
  // Sample badges with progress - Expanded Comic Book Collection
  const badges = [
    { name: 'Solver', level: 3, progress: 75, maxLevel: 10 },
    { name: 'Speedster', level: 8, progress: 20, maxLevel: 10 },
    { name: 'Mastermind', level: 2, progress: 40, maxLevel: 10 },
    { name: 'Explorer', level: 5, progress: 60, maxLevel: 10 },
    { name: 'Collector', level: 1, progress: 10, maxLevel: 10 },
    { name: 'Strategist', level: 0, progress: 0, maxLevel: 10 },
    { name: 'Innovator', level: 4, progress: 80, maxLevel: 10 },
    { name: 'Perfectionist', level: 6, progress: 90, maxLevel: 10 },
    { name: 'Contributor', level: 0, progress: 0, maxLevel: 10 },
    { name: 'Champion', level: 1, progress: 30, maxLevel: 10 },
    // New Comic Book Badges
    { name: 'Physics Warrior', level: 4, progress: 65, maxLevel: 10 },
    { name: 'Formula Wizard', level: 7, progress: 15, maxLevel: 10 },
    { name: 'Time Keeper', level: 2, progress: 80, maxLevel: 10 },
    { name: 'Hint Guardian', level: 3, progress: 45, maxLevel: 10 },
    { name: 'Comeback King', level: 1, progress: 90, maxLevel: 10 },
    { name: 'Branch Master', level: 5, progress: 25, maxLevel: 10 },
    { name: 'Streak Survivor', level: 2, progress: 60, maxLevel: 10 },
    { name: 'Knowledge Seeker', level: 6, progress: 85, maxLevel: 10 },
    { name: 'Error Slayer', level: 4, progress: 35, maxLevel: 10 },
    { name: 'Physics Avenger', level: 3, progress: 70, maxLevel: 10 }
  ];
  
  // Add badge metadata
  const enrichedBadges = badges.map(badge => ({
    ...badge,
    title: BADGE_SYSTEM[badge.name]?.titles[badge.level] || 'Unranked',
    description: BADGE_SYSTEM[badge.name]?.description || 'Achievement',
    icon: BADGE_SYSTEM[badge.name]?.icon || '🏅',
    xpBonus: badge.level * 0.05
  }));
  
  const profile = {
    id,
    username,
    email,
    avatar: null,
    plan: state.userPlans.get(id) || 'free',
    xp: levelInfo.totalXP,
    level: levelInfo.level,
    currentXP: levelInfo.currentXP,
    nextLevelXP: levelInfo.nextLevelXP,
    hintTokens: 15,
    problemsSolved: 89,
    badges: enrichedBadges,
    history: [],
    // Today's stats (mock data)
    todayProblems: 3,
    todayXP: 75,
    todayTime: 45,
    // Additional stats
    totalXPBonus: calculateXPBonus(badges),
    averageAccuracy: 87.5,
    streakDays: 7,
    favoriteSubjects: ['Mechanics', 'Electromagnetism'],
    joinDate: '2024-01-15',
    lastActive: new Date().toISOString()
  };
  
  res.json({ profile });
});

// Update avatar via URL
router.put('/me/avatar', (req, res) => {
  const { avatar } = req.body || {};
  if (!avatar) return res.status(400).json({ error: 'avatar is required (URL or data URI)' });
  res.json({ success: true, avatar });
});

// Upload avatar file
router.post('/me/avatar/upload', upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const publicUrl = `/assets/uploads/${req.file.filename}`;
  res.json({ success: true, avatar: publicUrl });
});

// Get user history (placeholder)
router.get('/history', (req, res) => {
  const sample = [
    { id: 'OER_MIT_001', date: new Date().toISOString(), result: 'correct', xpGained: 30 },
  ];
  res.json({ history: sample });
});

// Get badges (placeholder)
router.get('/badges', (req, res) => {
  const badges = [
    { name: 'Solver', level: 0, progress: 0 },
    { name: 'Speedster', level: 0, progress: 0 },
    { name: 'Mastermind', level: 0, progress: 0 },
    { name: 'Explorer', level: 0, progress: 0 },
  ];
  res.json({ badges });
});

module.exports = router;
