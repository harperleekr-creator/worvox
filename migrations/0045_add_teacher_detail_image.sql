-- Add detail_image_url column to hiing_teachers table
ALTER TABLE hiing_teachers ADD COLUMN detail_image_url TEXT;

-- Update Youna's detail image
UPDATE hiing_teachers 
SET detail_image_url = 'https://www.genspark.ai/api/files/s/zw9BgR60' 
WHERE teacher_code = 'youna';
