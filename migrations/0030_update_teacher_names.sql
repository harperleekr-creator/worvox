-- Update teacher names to Anna, Matthew, Youna, Layla, Ella, Jeff
-- 생성일: 2026-03-06

-- Jennifer → Anna
UPDATE hiing_teachers SET 
  name = 'Anna',
  teacher_code = 'anna',
  photo_url = 'https://hiing.com/teachers/anna.jpg'
WHERE teacher_code = 'jennifer';

-- Michael → Matthew
UPDATE hiing_teachers SET 
  name = 'Matthew',
  teacher_code = 'matthew',
  photo_url = 'https://hiing.com/teachers/matthew.jpg'
WHERE teacher_code = 'michael';

-- Sarah → Youna
UPDATE hiing_teachers SET 
  name = 'Youna',
  teacher_code = 'youna',
  photo_url = 'https://hiing.com/teachers/youna.jpg'
WHERE teacher_code = 'sarah';

-- David → Layla
UPDATE hiing_teachers SET 
  name = 'Layla',
  teacher_code = 'layla',
  photo_url = 'https://hiing.com/teachers/layla.jpg'
WHERE teacher_code = 'david';

-- Emma → Ella
UPDATE hiing_teachers SET 
  name = 'Ella',
  teacher_code = 'ella',
  photo_url = 'https://hiing.com/teachers/ella.jpg'
WHERE teacher_code = 'emma';

-- James → Jeff
UPDATE hiing_teachers SET 
  name = 'Jeff',
  teacher_code = 'jeff',
  photo_url = 'https://hiing.com/teachers/jeff.jpg'
WHERE teacher_code = 'james';
