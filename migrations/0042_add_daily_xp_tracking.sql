-- Add daily XP tracking
-- Migration: 0042_add_daily_xp_tracking.sql

-- Add daily_xp and last_xp_reset columns to users table
ALTER TABLE users ADD COLUMN daily_xp INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_xp_reset TEXT;

-- Create index for efficient daily XP queries
CREATE INDEX IF NOT EXISTS idx_users_daily_xp ON users(daily_xp);
CREATE INDEX IF NOT EXISTS idx_users_last_xp_reset ON users(last_xp_reset);

-- Create a table to track daily XP history
CREATE TABLE IF NOT EXISTS daily_xp_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  total_xp INTEGER DEFAULT 0,
  activity_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_xp_history_user_date ON daily_xp_history(user_id, date);
