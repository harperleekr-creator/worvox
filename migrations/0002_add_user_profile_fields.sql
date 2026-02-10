-- Add new columns to users table for enhanced profile
ALTER TABLE users ADD COLUMN age_group TEXT; -- '10s', '20s', '30s', '40s', '50+'
ALTER TABLE users ADD COLUMN gender TEXT; -- 'male', 'female', 'other'
ALTER TABLE users ADD COLUMN occupation TEXT; -- 'entrepreneur', 'employee', 'freelancer', 'student'
ALTER TABLE users ADD COLUMN referral_source TEXT; -- 'search', 'social', 'friend', 'ad', 'other'
