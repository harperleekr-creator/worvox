-- Add attendance tracking table
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  created_at DATETIME DEFAULT (datetime('now', '+9 hours')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, attendance_date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- Insert attendance for existing users based on their sessions
INSERT OR IGNORE INTO attendance (user_id, attendance_date)
SELECT DISTINCT 
  user_id, 
  DATE(started_at) as attendance_date
FROM sessions 
WHERE started_at IS NOT NULL;
