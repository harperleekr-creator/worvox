-- Create table for caching AI-generated prompts
CREATE TABLE IF NOT EXISTS ai_generated_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  mode TEXT NOT NULL,
  level TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_prompts_mode_level ON ai_generated_prompts(mode, level);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_user ON ai_generated_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_created ON ai_generated_prompts(created_at);

-- Add setting for AI prompts to users table
ALTER TABLE users ADD COLUMN use_ai_prompts INTEGER DEFAULT 0;
