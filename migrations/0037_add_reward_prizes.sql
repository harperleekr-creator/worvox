-- 🎁 상품 테이블
CREATE TABLE IF NOT EXISTS reward_prizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_ko TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'physical', -- physical, digital, service
  stock INTEGER DEFAULT 0,
  required_level INTEGER DEFAULT 1,
  probability REAL DEFAULT 0.1, -- 당첨 확률 (0.0 ~ 1.0)
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 🎯 당첨 내역 테이블
CREATE TABLE IF NOT EXISTS user_prize_wins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  prize_id INTEGER NOT NULL,
  won_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  claim_status TEXT DEFAULT 'pending', -- pending, contacted, shipped, completed
  contact_info TEXT, -- 사용자가 입력한 연락처 정보 (JSON)
  shipping_address TEXT,
  tracking_number TEXT,
  notes TEXT,
  claimed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (prize_id) REFERENCES reward_prizes(id)
);

-- 초기 상품 데이터
INSERT INTO reward_prizes (name, name_ko, description, category, stock, required_level, probability, image_url) VALUES
('Starbucks Gift Card $10', '스타벅스 기프트카드 $10', '스타벅스에서 사용 가능한 10달러 기프트카드', 'digital', 100, 8, 0.15, '☕'),
('Amazon Gift Card $20', '아마존 기프트카드 $20', '아마존에서 사용 가능한 20달러 기프트카드', 'digital', 50, 15, 0.08, '📦'),
('Wireless Earbuds', '무선 이어폰', '고음질 블루투스 무선 이어폰', 'physical', 20, 25, 0.03, '🎧'),
('Premium T-Shirt', 'WorVox 프리미엄 티셔츠', 'WorVox 로고가 새겨진 프리미엄 티셔츠', 'physical', 50, 20, 0.05, '👕'),
('1 Month Premium Upgrade', '프리미엄 1개월 무료', 'WorVox 프리미엄 플랜 1개월 무료 이용권', 'service', 200, 5, 0.20, '⭐'),
('3 Month Premium Upgrade', '프리미엄 3개월 무료', 'WorVox 프리미엄 플랜 3개월 무료 이용권', 'service', 50, 30, 0.02, '🌟'),
('iPad Pro', 'iPad Pro 11인치', '최신 iPad Pro 11인치 (Wi-Fi 128GB)', 'physical', 2, 50, 0.001, '📱'),
('Book Voucher $15', '도서 상품권 $15', '온라인 서점에서 사용 가능한 15달러 도서 상품권', 'digital', 100, 10, 0.12, '📚');

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_prize_wins_user_id ON user_prize_wins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prize_wins_claim_status ON user_prize_wins(claim_status);
CREATE INDEX IF NOT EXISTS idx_reward_prizes_required_level ON reward_prizes(required_level);
CREATE INDEX IF NOT EXISTS idx_reward_prizes_is_active ON reward_prizes(is_active);
