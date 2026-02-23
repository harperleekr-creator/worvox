-- WorVox Minimal Database Schema
-- Copy and paste this entire SQL into Cloudflare D1 Console

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  google_id TEXT,
  google_email TEXT,
  google_picture TEXT,
  level TEXT DEFAULT 'beginner',
  auth_provider TEXT DEFAULT 'google',
  user_level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  icon TEXT DEFAULT '💬'
);

INSERT OR IGNORE INTO topics (name, description, level, system_prompt, icon) VALUES
('AI English Conversation', 'Practice English with AI', 'intermediate', 'You are a friendly English tutor.', '🤖'),
('Vocabulary', 'Learn English words', 'beginner', 'You are a vocabulary tutor.', '📖');

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic_id INTEGER,
  topic TEXT,
  level TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  total_messages INTEGER DEFAULT 0
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  meaning_ko TEXT NOT NULL,
  meaning_en TEXT,
  example_sentence TEXT,
  difficulty TEXT DEFAULT 'beginner'
);

-- User vocabulary progress
CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  is_learned BOOLEAN DEFAULT 0,
  UNIQUE(user_id, word_id)
);

-- Verify tables created
SELECT 'Tables created successfully!' as status;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
