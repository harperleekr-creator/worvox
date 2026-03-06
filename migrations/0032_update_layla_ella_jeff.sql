-- Update Layla, Ella, Jeff profiles only
-- 생성일: 2026-03-06

-- Layla - 비클리 응대에서 공부 중
UPDATE hiing_teachers SET 
  specialty = '유학 & 국제학교로 다져진 영어 감각\n스피킹 / 회화 전문\n지루한 문법 X 실전 대화 O\n친구처럼 편한 영어 수업',
  experience = '유학 & 국제학교 경력',
  bio = '영어는 공부보단 소통!\n저와 함께 즐겁게 배워요!',
  rating = 5.0,
  nationality = '🇰🇷🇺🇸',
  title = '비클리 응대에서 공부 중인,\n영어로 스토커는 게\n제일 자연스러운',
  photo_url = 'https://www.genspark.ai/api/files/s/ickuuWei'
WHERE teacher_code = 'layla';

-- Ella - 띠돗한 에너지로
UPDATE hiing_teachers SET 
  specialty = '영어유치원 근무 경력\n숙명여대 영어영문학 전공\n해외영업 실무\n성인 기초부터 회화까지',
  experience = '영어유치원 근무 경력',
  bio = '틀려도 괜찮아요\n영어 실력 + 자신감 함께 키워요',
  rating = 5.0,
  nationality = '🇰🇷🇺🇸',
  title = '띠돗한 에너지로\n영어 말하기 자신감 UP!',
  photo_url = 'https://www.genspark.ai/api/files/s/ickuuWei'
WHERE teacher_code = 'ella';

-- Jeff - 출김프 편하게
UPDATE hiing_teachers SET 
  specialty = '강남 등 영어학원 전문 학원강의 경력 5년+\n미국 캘리포니아 9년 거주\n영어 회화 향상팀\n다양한 연령레벨의 학생 지도 경험',
  experience = '미국 캘리포니아 9년 거주',
  bio = '영어가 익숙해지는\n순간을 함께 만들어보아요!',
  rating = 4.9,
  nationality = '🇰🇷🇺🇸',
  title = '출김프 편하게\n대화할 수 있는\n영어 파트너',
  photo_url = 'https://www.genspark.ai/api/files/s/ickuuWei'
WHERE teacher_code = 'jeff';
