-- 기존 상품 전부 삭제
DELETE FROM reward_prizes;

-- 새로운 상품 목록 삽입
INSERT INTO reward_prizes (name, name_ko, description, image_url, category, stock, required_level, probability, is_active) VALUES
-- XP 보상 (92.48%)
('50 XP', '50 XP', '즉시 경험치 50 포인트 획득', '💎', 'xp', 999999, 1, 0.55, 1),
('100 XP', '100 XP', '즉시 경험치 100 포인트 획득', '💎💎', 'xp', 999999, 1, 0.3048, 1),
('200 XP', '200 XP', '즉시 경험치 200 포인트 획득', '💎💎💎', 'xp', 999999, 1, 0.07, 1),

-- 서비스 보상 (5.5%)
('1 Month Premium', '프리미엄 1개월 무료', 'WorVox 프리미엄 플랜 1개월 무료 이용권', '⭐', 'service', 200, 5, 0.05, 1),
('3 Month Premium', '프리미엄 3개월 무료', 'WorVox 프리미엄 플랜 3개월 무료 이용권', '🌟', 'service', 50, 30, 0.005, 1),

-- 디지털 상품 (3%)
('Starbucks Coffee Coupon', '스타벅스 커피 기프티콘', '스타벅스 아메리카노(Tall) 쿠폰', '☕', 'digital', 100, 8, 0.025, 1),
('Shinsegae Gift Card 50,000 KRW', '신세계 상품권 5만원', '신세계백화점 모바일 상품권 5만원권', '🎁', 'digital', 50, 15, 0.005, 1),

-- 레어 실물 상품 (0.01%)
('AirPods Pro', '에어팟 프로', 'Apple AirPods Pro (2세대, USB-C)', '🎧', 'physical', 10, 40, 0.00005, 1),
('iPad mini', 'iPad mini', 'Apple iPad mini (Wi-Fi, 128GB)', '📱', 'physical', 3, 50, 0.00005, 1);
