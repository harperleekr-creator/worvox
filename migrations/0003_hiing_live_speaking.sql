-- Hiing 1:1 Live Speaking 시스템 테이블
-- 생성일: 2026-03-06

-- 강사 프로필 테이블
CREATE TABLE IF NOT EXISTS hiing_teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_code TEXT UNIQUE NOT NULL,  -- 예: 'jennifer', 'michael'
  name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  specialty TEXT NOT NULL,  -- 예: 'Business English, IELTS'
  experience TEXT NOT NULL,  -- 예: '10+ years teaching experience'
  rating REAL DEFAULT 5.0,
  phone_number TEXT NOT NULL,  -- 강사 개인 전화번호
  pin_code TEXT NOT NULL,  -- 강사 인증 PIN (기본값: '1234')
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 수업권 구매 및 잔여 기록 테이블
CREATE TABLE IF NOT EXISTS hiing_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_count INTEGER NOT NULL,  -- 구매한 수업권 개수
  amount INTEGER NOT NULL,  -- 결제 금액 (0 = 무료체험)
  package_type TEXT NOT NULL,  -- 'free', 'monthly', 'one-time'
  remaining_credits INTEGER NOT NULL,  -- 남은 수업권
  expires_at DATETIME,  -- 만료일 (free = 30일, monthly = 90일)
  purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_key TEXT,  -- Toss 결제 키
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 수업 예약 및 이력 테이블
CREATE TABLE IF NOT EXISTS hiing_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  teacher_name TEXT NOT NULL,  -- 예약 당시 강사명 (기록용)
  scheduled_at DATETIME NOT NULL,  -- 예약 시간
  duration INTEGER NOT NULL,  -- 수업 시간 (25 또는 50분)
  status TEXT DEFAULT 'scheduled',  -- 'scheduled', 'completed', 'cancelled', 'no_show'
  teacher_phone TEXT NOT NULL,  -- 수업 진행 전화번호
  confirmed_by TEXT,  -- 'teacher', 'admin', 'auto'
  confirmed_at DATETIME,
  credit_deducted INTEGER DEFAULT 0,  -- 수업권 차감 여부 (0 = 미차감, 1 = 차감됨)
  notes TEXT,  -- 기타 메모
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES hiing_teachers(id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hiing_credits_user_id ON hiing_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_hiing_credits_expires_at ON hiing_credits(expires_at);
CREATE INDEX IF NOT EXISTS idx_hiing_sessions_user_id ON hiing_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hiing_sessions_teacher_id ON hiing_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_hiing_sessions_scheduled_at ON hiing_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_hiing_sessions_status ON hiing_sessions(status);

-- 초기 강사 데이터 삽입 (Hiing.com 6명 강사)
INSERT OR IGNORE INTO hiing_teachers (teacher_code, name, photo_url, specialty, experience, rating, phone_number, pin_code) VALUES
('jennifer', 'Jennifer Kim', 'https://hiing.com/teachers/jennifer.jpg', 'Business English, IELTS', '10+ years teaching experience', 4.9, '+82-10-1234-5678', '1234'),
('michael', 'Michael Johnson', 'https://hiing.com/teachers/michael.jpg', 'Conversational English, TOEFL', '8 years teaching experience', 4.8, '+82-10-2345-6789', '1234'),
('sarah', 'Sarah Lee', 'https://hiing.com/teachers/sarah.jpg', 'Kids English, Phonics', '12 years teaching experience', 5.0, '+82-10-3456-7890', '1234'),
('david', 'David Park', 'https://hiing.com/teachers/david.jpg', 'Business Presentations, Interview', '15 years teaching experience', 4.9, '+82-10-4567-8901', '1234'),
('emma', 'Emma Wilson', 'https://hiing.com/teachers/emma.jpg', 'Grammar, Writing', '9 years teaching experience', 4.7, '+82-10-5678-9012', '1234'),
('james', 'James Chen', 'https://hiing.com/teachers/james.jpg', 'OPIC, Accent Training', '11 years teaching experience', 4.8, '+82-10-6789-0123', '1234');
