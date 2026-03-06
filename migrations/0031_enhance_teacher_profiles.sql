-- Add new columns for teacher profiles
-- 생성일: 2026-03-06

-- Add new columns if they don't exist
ALTER TABLE hiing_teachers ADD COLUMN bio TEXT;
ALTER TABLE hiing_teachers ADD COLUMN nationality TEXT DEFAULT '🇰🇷🇺🇸';
ALTER TABLE hiing_teachers ADD COLUMN title TEXT;

-- Anna - 12년 경력, 경영컨설팅 전문
UPDATE hiing_teachers SET 
  specialty = '직장인/대학 영어 시사 토론 전문\n수능영어 전문 영어학과 강사\nTOEIC 990, TOEIC Speaking AM\n전문번역 경영컨설팅 세무법인\n영어 독해 강/작해 작가',
  experience = '12년 경력',
  bio = '학문, 실무를 동시에 대비\n전략적으로 재/교재 영어 실력을\n키우고 알려드린 저의 담임 해요!',
  rating = 5.0,
  nationality = '🇰🇷🇺🇸',
  title = '경영컨설팅 전문번역\n편안한 분위기메이커'
WHERE teacher_code = 'anna';

-- Matthew - 원어민처럼 자연스럽게
UPDATE hiing_teachers SET 
  specialty = '원어민처럼 자연스럽게 대화를 영어실력과 컴플섹션\n원어민 같은 마인드셋\n프리랜서 번역가',
  experience = '미국 거주 경험 보유',
  bio = '부담없이 편하게 일상을 영어로 내뱉다보면 실전문장을\n쓸게주세요',
  rating = 4.9,
  nationality = '🇰🇷🇺🇸',
  title = '원어민처럼 자연스럽게\n대화를 이는\n친근한 영어버디'
WHERE teacher_code = 'matthew';

-- Youna - 초중등생 영어 스피킹 전문
UPDATE hiing_teachers SET 
  specialty = '초중등생 영어 스피킹 지도 1년\n실전 캘브스 연쇄, 미국대학원서 등 다양\n기업별 참사 영어 브로커링\n현 어린이영어 수출심의원 출/작가\n고등 내신 및 수능 영어 강사 경력',
  experience = '미국 거주 경력 보유완',
  bio = '자세히고 친절하게\n다양한 표현 알려드립니다.\n같이 공부해요:)치치!',
  rating = 5.0,
  nationality = '🇰🇷🇺🇸',
  title = '미국 거주 경험을 보유완\n젊잘한 max'
WHERE teacher_code = 'youna';

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
