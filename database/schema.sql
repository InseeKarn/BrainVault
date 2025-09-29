-- BrainVault Database Schema (PostgreSQL-flavored)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT,
  avatar TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Problems table (OER JSON mirrored into SQL columns)
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  branch TEXT NOT NULL,
  subbranch TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  source TEXT,
  question TEXT NOT NULL,
  given JSONB NOT NULL,
  answer JSONB NOT NULL,
  hints JSONB,
  xp_reward INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_problems_branch ON problems(branch);
CREATE INDEX IF NOT EXISTS idx_problems_subbranch ON problems(subbranch);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);

-- Hint tokens (separate to support refill schedules)
CREATE TABLE IF NOT EXISTS hint_tokens (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tokens_available INTEGER DEFAULT 0,
  refill_date TIMESTAMP WITH TIME ZONE
);

-- XP / Level and progression data
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1
);

-- Badges (10 levels per badge)
CREATE TABLE IF NOT EXISTS badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, badge_name)
);

-- Optional: history of solved problems
CREATE TABLE IF NOT EXISTS solve_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id TEXT REFERENCES problems(id) ON DELETE SET NULL,
  correct BOOLEAN,
  xp_gained INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
