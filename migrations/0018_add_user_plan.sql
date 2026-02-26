-- Add plan column to users table
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Update existing user to premium
UPDATE users SET plan = 'premium' WHERE email = 'harperleekr@gmail.com' OR google_email = 'harperleekr@gmail.com';
