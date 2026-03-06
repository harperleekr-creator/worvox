-- Clean and improve teacher profiles with proper formatting

-- Anna
UPDATE hiing_teachers SET
  title = '경영 컨설팅 전문 번역가
편안한 분위기 메이커',
  bio = '학문과 실무를 동시에 대비!
전략적으로 영어 실력을
끌어올리는 담임 선생님이 되어드려요',
  specialty = '직장인/대학생 영어 시사 토론 전문
수능 영어 전문 영어학과 강사
TOEIC 990점, TOEIC Speaking IM3
경영 컨설팅 & 세무법인 전문 번역
영어 독해 및 작문 전문가',
  experience = '12년 경력 / TOEIC 990점'
WHERE teacher_code = 'anna';

-- Youna
UPDATE hiing_teachers SET
  title = '미국 거주 경험 보유
젊고 열정적인 강사',
  bio = '자세하고 친절하게
다양한 표현 알려드립니다
같이 공부해요! :)',
  specialty = '초·중등생 영어 스피킹 지도 전문
미국 대학 생활 및 유학 준비 컨설팅
기업 비즈니스 영어 브로커링
어린이 영어 교육 전문가
고등 내신 및 수능 영어 강사 경력',
  experience = '미국 거주 경험 보유'
WHERE teacher_code = 'youna';

-- Layla
UPDATE hiing_teachers SET
  title = '유학 & 국제학교 출신
영어가 가장 자연스러운 강사',
  bio = '영어는 공부보단 소통!
저와 함께 즐겁게 배워요!',
  specialty = '유학 & 국제학교로 다져진 완벽한 영어 감각
스피킹/회화 전문
지루한 문법 ✗ 실전 대화 ○
친구처럼 편안한 영어 수업
자연스러운 발음 및 억양 교정',
  experience = '유학 & 국제학교 경력'
WHERE teacher_code = 'layla';

-- Ella
UPDATE hiing_teachers SET
  title = '따뜻한 에너지로
영어 말하기 자신감 UP!',
  bio = '틀려도 괜찮아요!
영어 실력 + 자신감 함께 키워요',
  specialty = '영어유치원 근무 경력
숙명여대 영어영문학 전공
해외 영업 실무 경험
성인 기초부터 비즈니스 회화까지
친절하고 체계적인 맞춤 수업',
  experience = '영어유치원 근무 경력 / 해외 영업 실무'
WHERE teacher_code = 'ella';

-- Matthew
UPDATE hiing_teachers SET
  title = '원어민처럼 자연스럽게
대화를 이끄는
친근한 영어 버디',
  bio = '부담없이 편하게
일상을 영어로 표현하다 보면
실전 문장이 자연스럽게 나와요!',
  specialty = '원어민 수준의 자연스러운 대화 실력
미국 거주 경험으로 다져진 영어 마인드
프리랜서 전문 번역가
일상 회화부터 비즈니스 영어까지
편안한 분위기의 실전 영어 훈련',
  experience = '미국 거주 경험 / 전문 번역가'
WHERE teacher_code = 'matthew';

-- Jeff
UPDATE hiing_teachers SET
  title = '편하게 대화할 수 있는
든든한 영어 파트너',
  bio = '영어가 익숙해지는
그 순간을 함께 만들어가요!',
  specialty = '강남권 유명 영어학원 강의 경력 5년+
미국 캘리포니아 9년 거주
실전 회화 향상 전문
다양한 연령대 학생 지도 경험
OPIC, 토익스피킹 등 시험 대비 전문',
  experience = '미국 캘리포니아 9년 거주 / 강남 영어학원 5년+'
WHERE teacher_code = 'jeff';
