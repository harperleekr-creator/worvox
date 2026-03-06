-- Live Speaking System Migration
-- Created: 2026-03-06

-- 1. Live Speaking Credits Table (수업권)
CREATE TABLE IF NOT EXISTS live_speaking_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  package_type TEXT NOT NULL,  -- 'free', 'monthly', 'one-time'
  total_credits INTEGER NOT NULL,
  used_credits INTEGER DEFAULT 0,
  remaining_credits INTEGER NOT NULL,
  price INTEGER NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,  -- 월정기 30일, 일반 6개월
  status TEXT DEFAULT 'active',  -- 'active', 'expired', 'used'
  order_id TEXT,  -- Toss Payments orderId
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2. Live Speaking Sessions Table (수업 이력)
CREATE TABLE IF NOT EXISTS live_speaking_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  credit_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  teacher_name TEXT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  started_at DATETIME,
  ended_at DATETIME,
  duration INTEGER DEFAULT 25,  -- 수업 시간 (분)
  status TEXT DEFAULT 'scheduled',  -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
  rating INTEGER,  -- 1-5 별점
  student_feedback TEXT,  -- 학생 피드백
  teacher_notes TEXT,  -- 강사 피드백
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (credit_id) REFERENCES live_speaking_credits(id)
);

-- 3. Teachers Table (강사 정보)
CREATE TABLE IF NOT EXISTS live_speaking_teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  specialty TEXT,
  experience TEXT,
  rating REAL DEFAULT 5.0,
  introduction TEXT,
  teacher_code TEXT UNIQUE NOT NULL,  -- 강사 인증 코드
  status TEXT DEFAULT 'active',  -- 'active', 'inactive'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert 6 teachers from Hiing.com
INSERT INTO live_speaking_teachers (name, photo_url, specialty, experience, rating, introduction, teacher_code) VALUES
  ('Jennifer Kim', 'https://via.placeholder.com/300x300?text=Jennifer+Kim', 'Business English, IELTS', '10 years', 4.9, 'MBA from Harvard, specialized in Business English', 'TEACHER001'),
  ('Michael Johnson', 'https://via.placeholder.com/300x300?text=Michael+Johnson', 'Conversation, Pronunciation', '8 years', 4.8, 'Native speaker from California', 'TEACHER002'),
  ('Sarah Lee', 'https://via.placeholder.com/300x300?text=Sarah+Lee', 'TOEFL, Academic English', '12 years', 5.0, 'PhD in TESOL, university professor', 'TEACHER003'),
  ('David Park', 'https://via.placeholder.com/300x300?text=David+Park', 'Kids, Teens', '6 years', 4.7, 'Patient and friendly, great with young learners', 'TEACHER004'),
  ('Emma Wilson', 'https://via.placeholder.com/300x300?text=Emma+Wilson', 'Accent Training, Phonics', '9 years', 4.9, 'British accent specialist', 'TEACHER005'),
  ('James Chen', 'https://via.placeholder.com/300x300?text=James+Chen', 'Interview Prep, Resume', '7 years', 4.8, 'Career coach and English tutor', 'TEACHER006');

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_speaking_sessions_user_id ON live_speaking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_speaking_sessions_teacher_id ON live_speaking_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_live_speaking_sessions_status ON live_speaking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_speaking_sessions_scheduled_at ON live_speaking_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_speaking_credits_user_id ON live_speaking_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_live_speaking_credits_status ON live_speaking_credits(status);
