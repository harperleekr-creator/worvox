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

-- Layla - Business & Interview 전문
UPDATE hiing_teachers SET 
  specialty = 'Business English, Interview Preparation\nPresentation Skills, Professional Communication\nCareer Development English',
  experience = '15년 경력',
  bio = 'Help you speak confidently in\nprofessional settings with\npractical business English!',
  rating = 4.9,
  nationality = '🇰🇷🇺🇸',
  title = 'Business Presentations\nInterview Expert'
WHERE teacher_code = 'layla';

-- Ella - Grammar & Writing 전문
UPDATE hiing_teachers SET 
  specialty = 'Grammar Fundamentals, Academic Writing\nEssay Structure, Creative Writing\nEnglish Literature',
  experience = '9년 경력',
  bio = 'Master English grammar and\nwriting with structured lessons\nand personalized feedback!',
  rating = 4.8,
  nationality = '🇰🇷🇺🇸',
  title = 'Grammar & Writing\nSpecialist'
WHERE teacher_code = 'ella';

-- Jeff - OPIC & Accent Training 전문
UPDATE hiing_teachers SET 
  specialty = 'OPIC Advanced Level, Accent Reduction\nPronunciation Training, Fluency Development\nNatural Expression',
  experience = '11년 경력',
  bio = 'Improve your accent and speak\nlike a native with focused\npronunciation practice!',
  rating = 4.8,
  nationality = '🇰🇷🇺🇸',
  title = 'OPIC Expert\nAccent Training'
WHERE teacher_code = 'jeff';
