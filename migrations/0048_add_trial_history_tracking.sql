-- Add field to track if user has ever used trial (prevent re-trial after cancellation)
ALTER TABLE users ADD COLUMN has_used_trial INTEGER DEFAULT 0;

-- Update existing trial users to mark as having used trial
UPDATE users SET has_used_trial = 1 WHERE is_trial = 1 OR trial_start_date IS NOT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_has_used_trial ON users(has_used_trial);
