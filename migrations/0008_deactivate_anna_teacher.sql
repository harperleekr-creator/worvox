-- Deactivate Anna teacher
UPDATE hiing_teachers 
SET is_active = 0 
WHERE teacher_code = 'anna';
