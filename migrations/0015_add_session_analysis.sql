-- Session Analysis Tables for PHASE 1
-- 세션 분석 리포트 및 피드백 저장

-- 세션 리포트 테이블
CREATE TABLE IF NOT EXISTS session_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  
  -- 점수 (0-100)
  overall_score INTEGER DEFAULT 0,
  grammar_score INTEGER DEFAULT 0,
  vocabulary_score INTEGER DEFAULT 0,
  fluency_score INTEGER DEFAULT 0,
  
  -- 통계
  total_messages INTEGER DEFAULT 0,
  total_words INTEGER DEFAULT 0,
  avg_sentence_length REAL DEFAULT 0,
  
  -- 분석 완료 시간 (KST)
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 세션 피드백 테이블 (오류 및 개선 제안)
CREATE TABLE IF NOT EXISTS session_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  
  -- 피드백 타입: 'error' (고쳐야 할 것) 또는 'suggestion' (더 나은 표현)
  type TEXT NOT NULL,
  
  -- 원본 문장 (사용자가 말한 것)
  original_text TEXT NOT NULL,
  
  -- 개선된 문장
  improved_text TEXT NOT NULL,
  
  -- 설명
  explanation TEXT,
  
  -- 카테고리: grammar, vocabulary, pronunciation, style
  category TEXT,
  
  -- 중요도 (1-3, 3이 가장 중요)
  priority INTEGER DEFAULT 1,
  
  -- 연습 완료 여부
  practiced INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (report_id) REFERENCES session_reports(id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_session_reports_session ON session_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reports_user ON session_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_report ON session_feedback(report_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_type ON session_feedback(type);

-- sessions 테이블에 has_report 플래그 추가 (History 페이지에서 사용)
-- 기존 테이블 수정은 ALTER TABLE 사용
ALTER TABLE sessions ADD COLUMN has_report INTEGER DEFAULT 0;
