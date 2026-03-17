-- Safe migration: Add XP tracking tables only if they don't exist
-- This migration is idempotent and can be run multiple times

-- Add daily XP tracking table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS daily_xp_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create unique constraint only if table was just created
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_xp_unique ON daily_xp_tracking(user_id, activity_type, date);

-- Add other indexes
CREATE INDEX IF NOT EXISTS idx_daily_xp_user_date ON daily_xp_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_xp_activity ON daily_xp_tracking(activity_type, date);

-- Add attendance tracking table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  login_date DATE NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create unique constraint only if table was just created
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON user_attendance(user_id, login_date);

-- Add index for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON user_attendance(user_id, login_date);
