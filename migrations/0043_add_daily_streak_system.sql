-- Add daily goals and streak tracking system
-- This migration adds tables to track daily learning goals and streaks

-- Daily goals table - stores user's daily progress
CREATE TABLE IF NOT EXISTS daily_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  goal_date DATE NOT NULL, -- YYYY-MM-DD format
  goal_level TEXT DEFAULT 'balanced', -- 'casual', 'balanced', 'intensive'
  
  -- Goal targets (based on level)
  target_conversations INTEGER DEFAULT 3,
  target_timer_sessions INTEGER DEFAULT 5,
  target_words INTEGER DEFAULT 10,
  target_xp INTEGER DEFAULT 100,
  
  -- Current progress
  current_conversations INTEGER DEFAULT 0,
  current_timer_sessions INTEGER DEFAULT 0,
  current_words INTEGER DEFAULT 0,
  current_xp INTEGER DEFAULT 0,
  
  -- Completion status
  is_completed INTEGER DEFAULT 0, -- 0 or 1
  completed_at DATETIME,
  
  -- Rewards
  xp_reward INTEGER DEFAULT 50,
  random_boxes_earned INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, goal_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_goals_user_date ON daily_goals(user_id, goal_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_goals_completed ON daily_goals(user_id, is_completed);

-- Streak tracking table - stores user's streak history
CREATE TABLE IF NOT EXISTS user_streaks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  
  -- Current streak
  current_streak INTEGER DEFAULT 0, -- consecutive days
  longest_streak INTEGER DEFAULT 0, -- personal record
  
  -- Last activity
  last_goal_completed_date DATE, -- YYYY-MM-DD
  last_activity_date DATE, -- for tracking active days
  
  -- Streak freeze (protection)
  freeze_available INTEGER DEFAULT 1, -- monthly free freeze
  freeze_used_this_month INTEGER DEFAULT 0,
  last_freeze_date DATE,
  
  -- Milestones reached
  milestone_7_days INTEGER DEFAULT 0,
  milestone_14_days INTEGER DEFAULT 0,
  milestone_30_days INTEGER DEFAULT 0,
  milestone_100_days INTEGER DEFAULT 0,
  
  -- Total stats
  total_goals_completed INTEGER DEFAULT 0,
  total_random_boxes_earned INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for user lookup
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);

-- Streak milestones table - stores milestone achievements
CREATE TABLE IF NOT EXISTS streak_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  milestone_days INTEGER NOT NULL, -- 7, 14, 30, 100, etc.
  achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Rewards
  xp_reward INTEGER DEFAULT 0,
  random_boxes_reward INTEGER DEFAULT 0,
  badge_name TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_streak_milestones_user ON streak_milestones(user_id, milestone_days);

-- Goal level presets (for reference, stored in app logic)
-- casual: { conversations: 2, timer: 3, words: 5, xp: 50 }
-- balanced: { conversations: 3, timer: 5, words: 10, xp: 100 }
-- intensive: { conversations: 5, timer: 10, words: 20, xp: 200 }
