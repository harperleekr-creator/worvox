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
