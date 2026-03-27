-- Add lesson package size for monthly billing renewal
ALTER TABLE users ADD COLUMN hiing_lesson_package_size INTEGER DEFAULT 0;

-- Update existing records to set package size same as current lesson count
UPDATE users SET hiing_lesson_package_size = hiing_lesson_count WHERE hiing_subscription_active = 1;
