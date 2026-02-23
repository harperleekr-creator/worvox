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
-- Add new columns to users table for enhanced profile
ALTER TABLE users ADD COLUMN age_group TEXT; -- '10s', '20s', '30s', '40s', '50+'
ALTER TABLE users ADD COLUMN gender TEXT; -- 'male', 'female', 'other'
ALTER TABLE users ADD COLUMN occupation TEXT; -- 'entrepreneur', 'employee', 'freelancer', 'student'
ALTER TABLE users ADD COLUMN referral_source TEXT; -- 'search', 'social', 'friend', 'ad', 'other'
-- Add Google OAuth fields to users table
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN google_email TEXT;
ALTER TABLE users ADD COLUMN google_picture TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'; -- 'local' or 'google'

-- Create unique index for Google ID (this works as UNIQUE constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
-- Add Vocabulary topic
INSERT OR IGNORE INTO topics (name, description, level, system_prompt, icon) VALUES
('Vocabulary', 'Learn English words with meanings and pronunciation', 'beginner', 
 'You are a vocabulary tutor helping students learn English words. Show words with Korean meanings and help with pronunciation.', 
 '📖');

-- Create vocabulary_words table
CREATE TABLE IF NOT EXISTS vocabulary_words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  meaning_ko TEXT NOT NULL,
  pronunciation TEXT,
  part_of_speech TEXT, -- noun, verb, adjective, etc.
  example_sentence TEXT,
  difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  category TEXT, -- animals, food, business, travel, etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_vocabulary_difficulty ON vocabulary_words(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category ON vocabulary_words(category);

-- Create user_vocabulary_progress table to track learned words
CREATE TABLE IF NOT EXISTS user_vocabulary_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  word_id INTEGER NOT NULL,
  is_learned BOOLEAN DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  last_reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES vocabulary_words(id),
  UNIQUE(user_id, word_id)
);

-- Create index for user progress
CREATE INDEX IF NOT EXISTS idx_user_vocab_user_id ON user_vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_word_id ON user_vocabulary_progress(word_id);

-- Insert sample vocabulary words (beginner level)
INSERT INTO vocabulary_words (word, meaning_ko, pronunciation, part_of_speech, example_sentence, difficulty, category) VALUES
-- Daily Life
('hello', '안녕하세요', '/həˈloʊ/', 'interjection', 'Hello, how are you?', 'beginner', 'daily_life'),
('goodbye', '안녕히 가세요', '/ɡʊdˈbaɪ/', 'interjection', 'Goodbye! See you tomorrow.', 'beginner', 'daily_life'),
('thank you', '감사합니다', '/θæŋk juː/', 'phrase', 'Thank you for your help.', 'beginner', 'daily_life'),
('please', '제발, 부탁합니다', '/pliːz/', 'adverb', 'Please sit down.', 'beginner', 'daily_life'),
('sorry', '미안합니다', '/ˈsɑːri/', 'adjective', 'I am sorry for being late.', 'beginner', 'daily_life'),

-- Numbers
('one', '하나', '/wʌn/', 'number', 'I have one apple.', 'beginner', 'numbers'),
('two', '둘', '/tuː/', 'number', 'Two people are waiting.', 'beginner', 'numbers'),
('three', '셋', '/θriː/', 'number', 'I need three chairs.', 'beginner', 'numbers'),
('ten', '열', '/ten/', 'number', 'There are ten students.', 'beginner', 'numbers'),

-- Colors
('red', '빨간색', '/red/', 'adjective', 'She has a red car.', 'beginner', 'colors'),
('blue', '파란색', '/bluː/', 'adjective', 'The sky is blue.', 'beginner', 'colors'),
('green', '초록색', '/ɡriːn/', 'adjective', 'I like green apples.', 'beginner', 'colors'),
('yellow', '노란색', '/ˈjeloʊ/', 'adjective', 'The sun is yellow.', 'beginner', 'colors'),

-- Family
('mother', '어머니', '/ˈmʌðər/', 'noun', 'My mother is a teacher.', 'beginner', 'family'),
('father', '아버지', '/ˈfɑːðər/', 'noun', 'My father works in a bank.', 'beginner', 'family'),
('sister', '자매, 누나, 언니', '/ˈsɪstər/', 'noun', 'I have one sister.', 'beginner', 'family'),
('brother', '형제, 형, 오빠', '/ˈbrʌðər/', 'noun', 'My brother is older than me.', 'beginner', 'family'),

-- Food
('water', '물', '/ˈwɔːtər/', 'noun', 'I drink water every day.', 'beginner', 'food'),
('coffee', '커피', '/ˈkɔːfi/', 'noun', 'Would you like some coffee?', 'beginner', 'food'),
('rice', '밥, 쌀', '/raɪs/', 'noun', 'I eat rice for lunch.', 'beginner', 'food'),
('apple', '사과', '/ˈæpl/', 'noun', 'An apple a day keeps the doctor away.', 'beginner', 'food'),

-- Common Verbs
('go', '가다', '/ɡoʊ/', 'verb', 'I go to school every day.', 'beginner', 'verbs'),
('come', '오다', '/kʌm/', 'verb', 'Please come here.', 'beginner', 'verbs'),
('eat', '먹다', '/iːt/', 'verb', 'We eat dinner at 6 PM.', 'beginner', 'verbs'),
('drink', '마시다', '/drɪŋk/', 'verb', 'I drink coffee in the morning.', 'beginner', 'verbs'),
('sleep', '자다', '/sliːp/', 'verb', 'I sleep for 8 hours.', 'beginner', 'verbs'),
('study', '공부하다', '/ˈstʌdi/', 'verb', 'I study English every day.', 'beginner', 'verbs'),

-- Intermediate words
('important', '중요한', '/ɪmˈpɔːrtnt/', 'adjective', 'This is an important meeting.', 'intermediate', 'adjectives'),
('difficult', '어려운', '/ˈdɪfɪkəlt/', 'adjective', 'This problem is difficult.', 'intermediate', 'adjectives'),
('beautiful', '아름다운', '/ˈbjuːtɪfl/', 'adjective', 'She is beautiful.', 'intermediate', 'adjectives'),
('interesting', '흥미로운', '/ˈɪntrəstɪŋ/', 'adjective', 'The book is very interesting.', 'intermediate', 'adjectives'),

-- Advanced words
('accomplish', '성취하다', '/əˈkɑːmplɪʃ/', 'verb', 'She accomplished her goals.', 'advanced', 'verbs'),
('achievement', '성취, 업적', '/əˈtʃiːvmənt/', 'noun', 'Graduation is a great achievement.', 'advanced', 'nouns'),
('perspective', '관점, 시각', '/pərˈspektɪv/', 'noun', 'We need different perspectives.', 'advanced', 'nouns'),
('sophisticated', '세련된, 정교한', '/səˈfɪstɪkeɪtɪd/', 'adjective', 'He has sophisticated taste.', 'advanced', 'adjectives');
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
