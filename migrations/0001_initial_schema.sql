-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  level TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Conversation sessions
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  topic TEXT NOT NULL, -- daily, business, travel, etc.
  level TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  total_messages INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL, -- user or assistant
  content TEXT NOT NULL,
  audio_url TEXT, -- URL to audio file if available
  transcription TEXT, -- For user messages, the transcribed text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- User learning statistics
CREATE TABLE IF NOT EXISTS user_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  total_sessions INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Topics for conversation
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  level TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  icon TEXT DEFAULT '💬'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_date ON user_stats(user_id, date);
CREATE INDEX IF NOT EXISTS idx_topics_level ON topics(level);

-- Insert default topics
INSERT OR IGNORE INTO topics (name, description, level, system_prompt, icon) VALUES
('Daily Conversation', 'Practice everyday English conversations', 'beginner', 'You are a friendly English tutor helping a beginner practice daily conversations. Use simple vocabulary and short sentences. Be encouraging and patient. Ask follow-up questions to keep the conversation going.', '☀️'),
('Business English', 'Improve your professional communication skills', 'intermediate', 'You are a professional English tutor specializing in business communication. Use business terminology appropriately and help with formal expressions. Discuss topics like meetings, presentations, and emails.', '💼'),
('Travel English', 'Learn useful phrases for traveling abroad', 'beginner', 'You are a helpful English tutor teaching travel-related phrases. Focus on practical situations like hotels, restaurants, airports, and asking for directions. Use clear and simple language.', '✈️'),
('Job Interview', 'Prepare for English job interviews', 'advanced', 'You are an experienced career coach helping with English job interviews. Ask typical interview questions and provide constructive feedback. Use professional language and discuss career-related topics.', '🎯'),
('Free Talk', 'Have a natural conversation on any topic', 'intermediate', 'You are a conversational English tutor. Engage in natural, flowing conversations on various topics. Adapt to the user''s interests and provide a comfortable speaking environment. Gently correct major errors.', '🗣️');
