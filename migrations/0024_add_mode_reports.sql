-- Create mode_reports table for Timer, Scenario, and Exam modes
CREATE TABLE IF NOT EXISTS mode_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  mode_type TEXT NOT NULL, -- 'timer', 'scenario', 'exam'
  report_data TEXT NOT NULL, -- JSON data containing all results
  created_at DATETIME DEFAULT (datetime('now', '+9 hours')),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mode_reports_session ON mode_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_mode_reports_user ON mode_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_mode_reports_mode ON mode_reports(mode_type);
