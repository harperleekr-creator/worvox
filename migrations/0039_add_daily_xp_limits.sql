-- Add daily XP tracking table
CREATE TABLE IF NOT EXISTS daily_xp_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL, -- 'timer', 'scenario', 'exam', 'ai_chat', 'vocabulary'
  xp_earned INTEGER DEFAULT 0,
  date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, activity_type, date)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_xp_user_date ON daily_xp_tracking(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_xp_activity ON daily_xp_tracking(activity_type, date);

-- Add attendance tracking table for streak bonuses
CREATE TABLE IF NOT EXISTS user_attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  login_date DATE NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, login_date)
);

-- Add index for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON user_attendance(user_id, login_date);
