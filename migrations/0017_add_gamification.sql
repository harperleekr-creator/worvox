-- Add gamification fields to users table
-- Note: 'level' column already exists for English level (beginner/intermediate/advanced)
-- So we use 'user_level' for gamification level
ALTER TABLE users ADD COLUMN user_level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN coins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_activity_date DATE;

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, badge_name)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Create daily_missions table
CREATE TABLE IF NOT EXISTS daily_missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mission_type TEXT NOT NULL, -- 'learn_words', 'ai_conversation', 'quiz_completion', 'daily_login'
  mission_name TEXT NOT NULL,
  mission_description TEXT,
  target_count INTEGER DEFAULT 1,
  current_count INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 50,
  coin_reward INTEGER DEFAULT 10,
  is_completed BOOLEAN DEFAULT 0,
  mission_date DATE NOT NULL,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, mission_type, mission_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_missions_user_date ON daily_missions(user_id, mission_date);

-- Create user_activity_log table for tracking XP gains
CREATE TABLE IF NOT EXISTS user_activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- 'word_learned', 'conversation_completed', 'quiz_completed', 'mission_completed'
  xp_gained INTEGER DEFAULT 0,
  coins_gained INTEGER DEFAULT 0,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON user_activity_log(created_at);

-- Create speed_quiz_scores table for leaderboard
CREATE TABLE IF NOT EXISTS speed_quiz_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  difficulty TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  time_limit INTEGER NOT NULL, -- 30 or 60 seconds
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_scores_user ON speed_quiz_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_scores_leaderboard ON speed_quiz_scores(difficulty, score DESC, created_at DESC);
